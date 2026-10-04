import pathlib, json, hashlib, collections, re
import openpyxl

ROOT = pathlib.Path(__file__).resolve().parents[1]
records, sources, report = [], [], []
for language in ['ar', 'en', 'bn', 'hi', 'ur', 'id', 'es', 'fr', 'de']:
    path = ROOT / 'data' / 'raw' / 'hadeethenc' / f'hadeethenc-{language}.xlsx'
    raw_hash = hashlib.sha256(path.read_bytes()).hexdigest()
    workbook = openpyxl.load_workbook(path, read_only=True, data_only=False)
    rows = workbook.active.iter_rows(values_only=True)
    notice = next(rows)[0]
    headers = list(next(rows))
    if not isinstance(notice, str) or 'hadeethenc.com' not in notice.lower():
        raise ValueError('Missing publisher notice')
    source_records = []
    for row_number, row in enumerate(rows, 3):
        if not any(value is not None for value in row):
            continue
        if any(value is not None and not isinstance(value, (str, int, float)) for value in row):
            raise ValueError(f'Unexpected cell type: {language} row {row_number}')
        fields = {header: None if value is None else str(value) for header, value in zip(headers, row)}
        if any(isinstance(value, str) and value.startswith('=') for value in row):
            raise ValueError('Formula cell is not admitted')
        identifier = fields['id']
        if not identifier or not identifier.isdigit() or not fields['hadith_text']:
            raise ValueError(f'Invalid identity or text: {language} row {row_number}')
        if fields['link'] != f'https://hadeethenc.com/{language}/browse/hadith/{identifier}':
            raise ValueError('Publisher link mismatch')
        source_records.append({'id': identifier, 'language': language, 'fields': fields,
                               'quotation_sha256': hashlib.sha256(fields['hadith_text'].encode()).hexdigest()})
    if len({record['id'] for record in source_records}) != len(source_records):
        raise ValueError('Duplicate record IDs')
    version_match = re.search(r'\(v(\d+(?:\.\d+)+)\)', notice)
    if not version_match:
        raise ValueError('Publisher version missing')
    version = 'v' + version_match.group(1)
    sources.append({'language': language, 'raw_sha256': raw_hash, 'version': version, 'notice': notice, 'filename': path.name})
    report.append({'language': language, 'records': len(source_records), 'version': version})
    records.extend(source_records)
    workbook.close()

# This serialization matches JSON.stringify for this string/null-only corpus.
serialized = json.dumps(records, ensure_ascii=False, separators=(',', ':'))
original_languages = {'ar', 'en', 'bn', 'hi', 'ur', 'id'}
original_serialized = json.dumps([record for record in records if record['language'] in original_languages], ensure_ascii=False, separators=(',', ':'))
original_hash = hashlib.sha256(original_serialized.encode('utf-8')).hexdigest()
if original_hash != '4b8dcc11ef25e42c44b1333eaed643adfb752d6868513f6b98465513d465e17d':
    raise ValueError('Existing six-language admission changed; refuse extension')
corpus_hash = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
manifest = {'id': 'hadeethenc-official-2026-10-04', 'version': '2026-10-04 acquisition', 'sha256': corpus_hash, 'sources': sources}
(ROOT / 'data' / 'hadeethenc.json').write_text(json.dumps({'manifest': manifest, 'records': records}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
pins = {'id': manifest['id'], 'sha256': corpus_hash, 'sources': [{key: source[key] for key in ['language', 'raw_sha256', 'filename', 'version']} for source in sources], 'counts': {row['language']: row['records'] for row in report}}
(ROOT / 'docs' / 'source-rights' / 'hadeethenc-pins.json').write_text(json.dumps(pins, ensure_ascii=False, indent=2), encoding='utf-8', newline='\n')
arabic_ids = {record['id'] for record in records if record['language'] == 'ar'}
for row in report:
    row['ids_outside_arabic_edition'] = sum(record['id'] not in arabic_ids for record in records if record['language'] == row['language'])
(ROOT / 'artifacts' / 'hadeethenc-admission-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'sha256': corpus_hash, 'languages': report}, ensure_ascii=False))
(ROOT / 'artifacts' / 'hadeethenc-extension-preservation.json').write_text(json.dumps({'original_six_records': 14629, 'original_six_records_sha256': original_hash, 'new_records_sha256': corpus_hash, 'unchanged_original_six': True}, indent=2), encoding='utf-8')
