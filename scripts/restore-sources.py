"""Restore the pinned competition corpus with Python 3's standard library only."""
from pathlib import Path, PurePosixPath
import hashlib
import json
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def restore(root=ROOT):
    manifest = json.loads((root/'resources/source-snapshot.json').read_text(encoding='utf-8'))
    archive = root/'resources'/manifest['archive']
    archive_bytes = archive.read_bytes()
    if len(archive_bytes) != manifest['bytes'] or hashlib.sha256(archive_bytes).hexdigest() != manifest['sha256']:
        raise ValueError('Source archive checksum mismatch. Restore it from the repository; do not change the admission pins.')
    # Validate every source and existing destination before writing any file.
    with zipfile.ZipFile(archive) as bundle:
        if len(bundle.namelist()) != len(set(bundle.namelist())):
            raise ValueError('Duplicate source archive entries')
        for item in manifest['source_files']:
            relative = PurePosixPath(item['path'])
            target = root.joinpath(*relative.parts)
            if relative.is_absolute() or '..' in relative.parts or relative.parts[0] != 'data' or not target.resolve().is_relative_to(root.resolve()):
                raise ValueError('Invalid source path')
            data = bundle.read(item['path'])
            if len(data) != item['bytes'] or hashlib.sha256(data).hexdigest() != item['sha256']:
                raise ValueError(f"Source checksum mismatch: {item['path']}")
            if target.exists() and hashlib.sha256(target.read_bytes()).hexdigest() != item['sha256']:
                raise ValueError(f"Existing source differs: {item['path']}. Use a clean checkout; no files were overwritten.")
        for item in manifest['source_files']:
            target = root/item['path']
            if not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(bundle.read(item['path']))
    print(f"Restored and verified {len(manifest['source_files'])} pinned source files. No network or model calls were made.")

if __name__ == '__main__':
    try:
        restore()
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as error:
        print(f'Source setup stopped: {error}', file=sys.stderr)
        sys.exit(1)
