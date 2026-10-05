import example from './checked-example.json';

// A landing example is an abridged historical record, never a new assessment.
// Include only published metadata present in the saved example; do not invent a seal.
export function checkedExampleReceipt(){
 const source=example.evidence, translation=example.translation;
 return [
  `IsnadLens — evidence receipt\nPreviously checked example — abridged historical record, not a result for your current question.\nRecord: ${example.record_id}\nCreated: ${example.created_at}\nOriginal input language: Spanish\nScope: saved example and cited source only; no new AI call was made.`,
  `Original question:\n${example.original_claim}`,
  `English explanation:\n${example.summary_en}`,
  `Arabic explanation:\n${example.summary_ar}`,
  `Source 1: ${source.title}\nEdition: ${source.version}\nLocator: ${source.locator}\nAttribution: ${source.attribution}\nSource URL: ${source.source_url}\nQuotation SHA-256: ${source.quotation_sha256}`,
  `Original source quotation:\n${source.quotation}`,
  ...source.source_context.map(context=>`Source context ${context.position} — ${context.locator}:\n${context.quotation}\nQuotation SHA-256: ${context.quotation_sha256}`),
  `Source 2: ${translation.title}\nEdition: ${translation.version}\nLocator: ${translation.locator}\nAttribution: ${translation.attribution}\nSource URL: ${translation.source_url}\nQuotation SHA-256: ${translation.quotation_sha256}`,
  `Published translation:\n${translation.quotation}`,
  `Publisher footnotes:\n${translation.publisher_fields.footnotes}`,
  `Publisher transcript information:\n${translation.publisher_fields.description}\nPublisher: ${translation.publisher_fields.publisher}`,
  `Publisher notice:\n${translation.publisher_notice}`,
  'Limits of this result:\nThis is the previously checked landing example, not a verification of a new question. The exported record is abridged; it does not contain all evidence from the original assessment or its record seal. Source text and AI explanation are separate. This is not a personal fatwa.\nTanzil text licence: https://tanzil.net/docs/Text_License',
 ].join('\n\n');
}
