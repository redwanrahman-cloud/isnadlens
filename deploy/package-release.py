from pathlib import Path
import hashlib,json,tarfile,re,sys
repo=Path(__file__).resolve().parents[1]
audit=json.loads((repo/'artifacts/deployment-audit-2026-10-06.json').read_text())
names=set(['Dockerfile','.dockerignore','package.json','package-lock.json','tsconfig.json','next.config.ts','next-env.d.ts','data/admitted-manifest.json','data/TANZIL-NOTICE.txt','artifacts/deployment-audit-2026-10-06.json'])
for folder in ['src','public','docs/source-rights','deploy']:
    names.update(p.relative_to(repo).as_posix() for p in (repo/folder).rglob('*') if p.is_file())
for page in (repo/'src').rglob('*.tsx'):
    for relative in re.findall(r"from\s+['\"]([^'\"]*artifacts/[^'\"]+\.json)['\"]",page.read_text(encoding='utf-8')):
        resolved=(page.parent/relative).resolve()
        assert resolved.parent == (repo/'artifacts').resolve()
        names.add(resolved.relative_to(repo).as_posix())
for item in audit['source_files']:
    p=repo/item['path']
    assert hashlib.sha256(p.read_bytes()).hexdigest()==item['sha256'],item['path']
    names.add(item['path'])
if len(sys.argv)!=2: raise SystemExit('Usage: python deploy/package-release.py /outside/repository/release.tar.gz')
output=Path(sys.argv[1]).resolve()
if output.is_relative_to(repo): raise SystemExit('Choose an output outside the repository')
output.parent.mkdir(parents=True,exist_ok=True)
with tarfile.open(output,'w:gz') as archive:
    for name in sorted(names):
        assert not any(part in ['private','.git','node_modules','.next'] for part in Path(name).parts)
        assert not Path(name).name.startswith('.env') and not name.endswith('.pem')
        archive.add(repo/name,arcname=name,recursive=False)
digest=hashlib.sha256(output.read_bytes()).hexdigest()
output.with_suffix('.manifest.json').write_text(json.dumps({'files':len(names),'bytes':output.stat().st_size,'sha256':digest},indent=2))
print(json.dumps({'files':len(names),'bytes':output.stat().st_size,'sha256':digest}))
