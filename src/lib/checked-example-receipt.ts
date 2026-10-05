import type {DisplayLanguage} from './display-copy';
import example from './checked-example.json';
import {landingExample as sample,landingExampleCopy} from './landing-example';

// Curated question/answer backed by preserved evidence, never a new assessment.
// Include only published metadata present in the saved example; do not invent a seal.
export function checkedExampleReceipt(language:DisplayLanguage='en'){
 const display=landingExampleCopy(language);
 const source=example.evidence, translation=example.translation;
 return [
  `IsnadLens — evidence receipt\nSource-based illustrative example — curated explanation, not a result for your current question.\nExample: ${sample.id}\nEvidence provenance record: ${example.record_id}\nEvidence retrieved: ${example.created_at}\nDisplay language: ${language}\nScope: illustrative question and cited source only; no new AI call was made.`,
  `Original question:\n${display.question}`,
  ...(language!=='en'&&language!=='ar'?[`Displayed explanation (${language}):\n${display.summary}`]:[]),
  `English explanation:\n${sample.summary_en}`,
  `Arabic explanation:\n${sample.summary_ar}`,
  `Source 1: ${source.title}\nEdition: ${source.version}\nLocator: ${source.locator}\nAttribution: ${source.attribution}\nSource URL: ${source.source_url}\nQuotation SHA-256: ${source.quotation_sha256}`,
  `Original source quotation:\n${source.quotation}`,
  ...source.source_context.map(context=>`Source context ${context.position} — ${context.locator}:\n${context.quotation}\nQuotation SHA-256: ${context.quotation_sha256}`),
  `Source 2: ${translation.title}\nEdition: ${translation.version}\nLocator: ${translation.locator}\nAttribution: ${translation.attribution}\nSource URL: ${translation.source_url}\nQuotation SHA-256: ${translation.quotation_sha256}`,
  `Published translation:\n${translation.quotation}`,
  `Publisher footnotes:\n${translation.publisher_fields.footnotes}`,
  `Publisher transcript information:\n${translation.publisher_fields.description}\nPublisher: ${translation.publisher_fields.publisher}`,
  `Publisher notice:\n${translation.publisher_notice}`,
  'Limits of this result:\nThis is a curated source-based landing example, not a verification of a new question. The exported record is abridged; it does not contain all evidence from the original assessment or its record seal. Source text and AI explanation are separate. This is not a personal fatwa.\nTanzil text licence: https://tanzil.net/docs/Text_License',
 ].join('\n\n');
}
