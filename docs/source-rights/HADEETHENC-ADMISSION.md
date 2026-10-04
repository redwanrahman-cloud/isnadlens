# Official HadeethEnc workbook acquisition

Redwan expressly authorized downloading and integrating the official files on 4 October 2026. Source: https://hadeethenc.com/en/home. Download routes: https://hadeethenc.com/browse/download/{ar,en,bn,hi,ur,id}.

The live homepage permits downloading and republishing the translations under seven conditions: preserve content without modification/addition/deletion, identify publisher/source, mention the publisher version, retain transcript information, notify the publisher of translation notes, update with publisher releases, and avoid inappropriate advertising. The unchanged homepage snapshot accompanies the raw downloads. No separate permission request is needed for uses within these published conditions.

All six original workbooks are preserved unchanged outside Git. SHA-256 pins, download response metadata, acquisition date and each workbook's entire document notice are retained. Publisher versions are Arabic v1.7.0, English v1.25.0, Bangla v1.56.0, Hindi v1.59.0, Urdu v1.36.0 and Indonesian v1.22.0. Their original notices also preserve the publisher update dates and version-check URLs.

Arabic has 3,582 records; English 2,328; Bangla 1,925; Hindi 2,314; Urdu 2,220; Indonesian 2,260. Every row was checked for a unique per-language ID, nonempty Hadith text, and an exact official language/ID link. All translated record IDs occur in the Arabic edition. This does not establish equality of the embedded Arabic variants; they remain separate source records with their original fields.

The extraction retains original cell strings, field names and document notices. Search and analysis do not replace the publisher text. Publisher explanations, benefits, grade and references remain distinguished from project explanations. Grades are attributed to HadeethEnc and are never independently assigned by IsnadLens.

This is a curated source corpus, not all Hadith literature. Translation coverage differs by language. Mechanical validation is not scholarly review. Public repository redistribution of full workbooks and extracted text is unnecessary, so source data stays excluded; acquisition scripts and non-text pins support reproduction. Check the official source for updates before release and retain the replacement release as a new acquisition.

## Spanish, French and German extension — 4 October 2026

Redwan authorized these three additional publisher translations. The official homepage was reread before acquisition and exposes their Excel download links under the same seven conditions. A separate current homepage snapshot, `data/raw/hadeethenc/terms-home-nine-languages.html`, preserves this check without replacing the earlier rights snapshot.

| Language | Official download | Resolved publisher edition | Records | Original workbook bytes |
|---|---|---|---:|---:|
| Spanish | https://hadeethenc.com/browse/download/es | v1.23.0 | 1,955 | 2,675,095 |
| French | https://hadeethenc.com/browse/download/fr | v1.17.0 | 1,790 | 2,604,327 |
| German | https://hadeethenc.com/browse/download/de | v1.58.0 | 622 | 872,420 |

The nine-language collection now contains 18,996 records. Each new row retains all publisher fields, exact quotation bytes, grading/reference attribution, document notice, version and official link. All new IDs occur in the preserved Arabic edition; this is an identity check, not a claim of identical embedded Arabic text or independent authentication.

The original six-language subset still has 14,629 records and SHA-256 `4b8dcc11ef25e42c44b1333eaed643adfb752d6868513f6b98465513d465e17d`. Preparation fails if this subset changes. The deliberate expanded admission is SHA-256 `1fa8f74db69b4bcdf7fe0db1e9f2c72dceb090da5ed58d67119ef6d0e014a7b8`; its raw workbook hashes and exact versions are pinned in `hadeethenc-pins.json`. Acquisition never silently overwrites an existing downloaded edition. Future publisher changes require a separately reviewed admission and pin update.

Spanish/French/German are publisher passage display languages. Fresh verification input remains Arabic and English. Translation gaps must be reported as unavailable, rather than filled by model-generated source text. Original previously sealed records are retained as their earlier corpus snapshots; this extension does not rewrite their manifest or audit hash.
