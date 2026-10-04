# QuranEnc publisher translations — display admission, 4 October 2026

QuranEnc's official API page explicitly permits downloading and republishing the contents of its translations under seven conditions. The complete page is preserved in `api-and-terms.html`, and the exact terms are included in every derived edition and the committed pins. Uses within these conditions do not require a separate permission application.

https://quranenc.com/en/home/api/

The seven conditions require unchanged content, clear publisher/QuranEnc attribution, version display, preservation of transcript information, notification of translation notes, updating to publisher releases, and no inappropriate advertisements. The service preserves original translation and footnote strings, full original catalog metadata, version and publisher description, and source links. Footnotes remain a separate publisher field. They must be displayed safely as text or sanitized markup, never interpreted as application instructions.

The source file format is the publisher's complete SQLite download. Raw binary bytes are preserved privately and SHA-256 pinned. Extracted rows retain every table field (`id`, `sura`, `aya`, `translation`, `footnotes`) unchanged. Each edition has 6,236 unique ordered surah:ayah records matching the complete admitted Arabic Quran locator sequence. Runtime validates committed admission pins, raw bytes, extracted bytes, metadata/version, full locator sequence, and count before retaining a frozen process cache. Subsequent metadata invalidation assumes trusted local files or an immutable deployment image; filesystem metadata is not a repeated cryptographic proof against a hostile filesystem.

Admitted editions:

| Language | Official key | Publisher version |
| --- | --- | --- |
| English | english_rwwad | 1.0.19 |
| French | french_rashid | 1.0.3 |
| Spanish | spanish_garcia | 1.0.2 |
| German | german_rwwad | 1.0.15 |
| Indonesian | indonesian_sabiq | 1.1.3 |
| Urdu | urdu_junagarhi | 1.1.3 |
| Hindi | hindi_omari | 1.1.5 |

Arabic remains the admitted Tanzil original, not a translation. Bengali QuranEnc verse text and a complete `bengali_zakaria` SQLite file are available, but both current and official legacy catalogs omit its publisher version. Legacy CSV/Excel downloads returned empty responses. Because the stated terms require a version number, no Bengali QuranEnc text is admitted for local republication. Use an identified official outbound verse link until a current publisher version can be verified. The downloaded Bengali SQLite is research-only and excluded from the admission pins and runtime.

This layer provides publisher translations for display only. It does not enlarge the semantic verification corpus, certify translation accuracy, replace Arabic evidence, or change a sealed verdict/audit hash. The user interface must keep the original quotation distinct and require its expected SHA-256 when requesting an alternate display edition.

No recitation recordings were acquired. The official API documents translation-audio URLs for several specified keys, including English Rowwad and French Rachid; it does not promise recordings in all requested languages. Browser text-to-speech is a separate device service and must not be labelled as a publisher recitation.

Reproduction: `node scripts/prepare-quranenc.mjs` requires Node's `node:sqlite`, normally verified network TLS, and the already validated Arabic locator corpus. Downloads are bounded at 20,000,000 bytes each, at most two concurrently. Changes to editions require review and an explicit update to the runtime pin-file hash. Check publisher releases before public release; no silent replacement of admitted versions.
