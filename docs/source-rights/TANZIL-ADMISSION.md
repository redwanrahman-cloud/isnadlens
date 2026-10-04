# Tanzil Arabic Quran admission — 4 October 2026

Admitted: the publisher's Uthmani v1.1 display edition and Simple (Clean) v1.1 search edition. Each was downloaded directly from Tanzil over normally verified TLS after Redwan authorized the build and source acquisition. The preserved official licence grants verbatim copying, distribution, and use in websites/applications with clear Tanzil attribution, a link to Tanzil, and reproduction of the copyright notice. It prohibits changing the Quran text.

The application must display `Source: Tanzil Project` linking to https://tanzil.net, link the licence at https://tanzil.net/docs/Text_License, and retain the full source notices. The original two notices are preserved in this directory and embedded in the corpus manifest. Downloaded raw files retain the original copyright blocks. No Arabic Quran strings are normalized, stemmed, trimmed, rewritten, or translated by this preparation script. Simple Clean is a separate publisher-provided edition, not a transformation of Uthmani.

Download choices: numbered plain text (`txt-2`); Uthmani includes the form's default pause marks, sajdah signs, and tatweel. Rub-el-hizb and sequential tanween are not selected. Simple Clean has no symbols selected. Exact URLs, final URLs, UTC acquisition times, raw byte hashes, source HTML snapshots, and complete surah counts are recorded in `tanzil-acquisition.json`.

Validation: both editions contain exactly 6,236 unique records across 114 surahs and match every expected per-surah verse count. Join uses only the numbered surah:ayah identity. The source strings are kept unchanged, with display SHA-256 per verse. Corpus manifest SHA-256 is calculated over UTF-8 `JSON.stringify(verses)`:

`b38d2ff661bd43dc3d57194cf10427856e2423594541f48c46b1f20e826e1dad`

Raw Uthmani SHA-256: `6933e133dd56db778c801bf738848454e43648105a151e8d84d86a7cae39ec5f`.

Raw Simple Clean SHA-256: `228df2a717671aeb9d2ff573002bd28d6b3f973f4bc7153554e3a81663d67610`.

The download copyright block says 2007–2026, while the licence page's sample block says 2007–2021. Both are preserved as supplied; the terms are consistent and the text editions both identify v1.1. No source-licence text is silently corrected.

This admission covers only these Arabic Quran editions. It does not admit translations, hadith, pilgrimage guides, media, or third-party commentary. Text integrity validation is not scholarly certification of AI interpretation. Raw corpus files remain excluded from the public repository; the reproducible preparation script and rights/provenance records may be committed.

Reproduce locally with `node scripts/prepare-corpus.mjs`. This performs network acquisition and validates the publisher response before writing the corpus. Network and normal TLS access are required. Re-running records a new acquisition timestamp; verify the manifest hash before using a new build.
