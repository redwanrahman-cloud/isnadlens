# Pinned source snapshot for reviewers

`isnadlens-sources-2026-10-06.zip` contains the **27 exact runtime source files** admitted by the deployed competition build (163,542,719 uncompressed bytes), together with their publisher notices and source-rights records. It contains no account credentials, API keys, user uploads or private model logs. The archive is approximately 61 MB; a normal Git clone or GitHub source ZIP includes it without Git LFS or a separate account.

From the repository root, with Python 3.10+:

```sh
python scripts/restore-sources.py
node deploy/check-source-bundle.mjs
```

The restore helper uses only Python's standard library. It checks the archive SHA-256 and each runtime file against `source-snapshot.json` before writing. It refuses to overwrite a different existing source. Re-running it on the same snapshot is safe. The application retains its independent admission checks. No network/model requests, pin regeneration or publisher-text changes occur during restoration.

## Publisher attribution and reuse

- **Tanzil Project**, https://tanzil.net: Arabic Quran Uthmani and Simple Clean, version 1.1. Verbatim copying is permitted with attribution, the publisher link and its complete copyright notice; changing the Quran text is prohibited. Original notices remain in both raw files, the corpus manifest and `docs/source-rights/TANZIL-*-NOTICE.txt`.
- **HadeethEnc**, https://hadeethenc.com: all nine admitted workbooks retain their publisher notices, transcript information and version numbers. Versions and hashes are recorded in `docs/source-rights/hadeethenc-pins.json`; the derived corpus preserves every publisher field and notice. The official homepage terms snapshot is included in the archive.
- **QuranEnc**, https://quranenc.com: seven admitted translation editions retain complete metadata, versions, footnotes and original terms. See `docs/source-rights/quranenc/pins.json`, `api-and-terms.html` and `ADMISSION.md`. The unadmitted Bengali research download is excluded.

HadeethEnc and QuranEnc permit republication subject to unchanged content, source attribution, version identification, retention of transcript information, notification of translation notes, publisher updates and no inappropriate advertising. Their rights are separate from the application code. Read the complete preserved terms before reuse.

This is the **dated competition/reproducibility snapshot**, not a promise of the latest publisher release. Future source updates require a separately reviewed admission and new pins; do not silently alter this snapshot or its historical benchmark. Earlier admission notes saying raw source data stays outside Git describe the original development workflow. This reviewer snapshot now distributes the unchanged admitted files with their notices to make the submission reproducible.

For a new source admission, the original acquisition/extraction scripts remain available. They are not the quick-start path for reproducing the submitted version.
