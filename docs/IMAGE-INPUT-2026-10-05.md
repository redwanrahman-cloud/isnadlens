# Reviewed image input — October 5, 2026

Screenshots, quote cards and photographed text can enter either the main workbench or the pilgrimage companion. Text verification remains the same pipeline: image → original-language transcription → user selects and edits one claim → existing source search and assessment. Nothing is automatically verified when choosing, pasting or reading an image.

## Reader and limits

- Gemini 3.5 Flash-Lite, using the already confirmed Google free project. No paid reader fallback. The initial 3.8 Flash probe returned HTTP 503 high-demand errors; Flash-Lite passed the functional probes.
- PNG, JPEG and WebP; one image, up to 10 MB, 25 million decoded pixels. Animated/multipage and mismatched formats are rejected. Server decoding strips metadata, corrects orientation and limits the longest side to 2,048 pixels. Small text can become unreadable: upload a clear crop.
- Up to 8,000 characters of visible text and six candidate claims, each at most 1,200 characters. Candidate wording must occur verbatim in the extracted transcript. All nine supported language scripts have offline contract checks; live extraction was checked in English and Arabic only.
- Extraction is not an authenticity assessment or a truth verdict. Pictures without readable text do not produce inferred religious rulings. Users can type their own question.
- Images reach Google only after pressing Read image. Free-tier data may be used to improve Google products; the visible notice asks users to remove private information. The application does not persist uploaded images or extracted readings. The eventual verification record contains the reviewed text, not an image-authenticity seal.
- Shares the existing Google app guard with speech/dictation: 60 requests per UTC day and two per rolling minute; provider limits may be lower. Quota exhaustion offers typing, without switching to paid services.
- Local concurrency and payload guards are implemented. Trusted-edge rate limiting remains part of the deployment work.

## Validation

- Complete suite: 443 tests in 37 files passed. Final focused image tests: nine passed. Production build and TypeScript passed.
- Browser journey checked at 1,440 px and 390 px: explicit upload, preview, original Arabic text selection/editing, transfer without automatic verification, unsupported-format rejection, companion availability, no page errors and no horizontal overflow. Provider responses are mocked in these browser checks.
- Four actual free-provider checks passed: clear English, clear Arabic, blank image (no text and no invented claim), and an instruction-injection screenshot (visible wording retained, no verification verdict returned). These are feature controls, not a broad OCR accuracy benchmark.
- No paid AI calls for this feature. Existing 29/30 semantic benchmark is unchanged and does not certify image recognition accuracy.
- Evidence: `artifacts/image-input-checks-2026-10-05.json`. Synthetic fixtures, exact readings and screenshots remain in ignored `artifacts/private/image-input-2026-10-05`.

## Primary documentation checked

- https://ai.google.dev/gemini-api/docs/generate-content/image-understanding
- https://ai.google.dev/gemini-api/docs/pricing (Flash-Lite text/image free-tier inputs and free-tier data use)
- https://developers.openai.com/api/docs/guides/images-vision (image understanding and limitations; the implemented reader uses Google)

Visual redesign remains in the evening UI/UX phase, with Redwan's direction first.
