export type ClaimLanguage = 'ar' | 'en';

/** Script-based routing only, not translation or language authentication.
 * Mixed scripts and unsupported scripts retain the explicit AR/EN selection.
 * The claim itself is never normalized, rewritten, or returned from this helper.
 */
export function inferClaimInputLanguage(claim: string, selected: ClaimLanguage): ClaimLanguage {
  const letters = [...claim].filter(character => /\p{Letter}/u.test(character));
  if (!letters.length) return selected;
  const arabic = letters.some(character => /\p{Script=Arabic}/u.test(character));
  const latin = letters.some(character => /\p{Script=Latin}/u.test(character));
  const other = letters.some(character => !/[\p{Script=Arabic}\p{Script=Latin}]/u.test(character));
  if (other || (arabic && latin)) return selected;
  return arabic ? 'ar' : latin ? 'en' : selected;
}
