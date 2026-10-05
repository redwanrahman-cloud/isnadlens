import { clarificationCopy } from '@/lib/clarification';
import type { DisplayLanguage } from '@/lib/display-copy';
import { WorkspaceIcon } from './WorkspaceIcon';

export function ClarificationCard({ language, proposal, question, disabled, onConfirm, onEdit }: {
  language: DisplayLanguage;
  proposal: { question: string; language: DisplayLanguage } | null;
  question: string;
  disabled: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}) {
  const copy = clarificationCopy[language];
  return <section className="clarification-card" aria-labelledby="clarification-heading">
    <span className="clarification-badge"><WorkspaceIcon name="text"/>{copy.badge}</span>
    <h3 id="clarification-heading" tabIndex={-1}>{proposal ? copy.title : copy.missing}</h3>
    <blockquote dir="auto" lang={proposal?.language ?? (language === 'ar' ? 'ar' : 'en')}>{proposal?.question ?? question}</blockquote>
    {proposal && <p>{copy.note}</p>}
    <div className="clarification-actions">
      {proposal && <button className="primary-button" type="button" disabled={disabled} onClick={onConfirm}><WorkspaceIcon name="check"/>{copy.yes}</button>}
      <button className="clarification-edit" type="button" disabled={disabled} onClick={onEdit}>{proposal ? copy.no : copy.edit}</button>
    </div>
  </section>;
}
