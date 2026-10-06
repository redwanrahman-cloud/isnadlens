'use client';

import {displayCopy, displayLanguages, displayLanguageMetadata, type DisplayLanguage} from '@/lib/display-copy';
import {useEffect, useId, useRef, useState, type KeyboardEvent} from 'react';
import styles from './LanguageSelector.module.css';

export function LanguageSelector({language, onLanguage}: {
  language: DisplayLanguage;
  onLanguage: (language: DisplayLanguage) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const choices = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();
  useEffect(() => {
    if (!open) return;
    choices.current[displayLanguages.indexOf(language)]?.focus();
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open, language]);
  function choose(code: DisplayLanguage) {
    onLanguage(code);
    setOpen(false);
    trigger.current?.focus();
  }
  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const offsets: Record<string, number> = {ArrowRight: 1, ArrowLeft: -1, ArrowDown: 3, ArrowUp: -3};
    const offset = offsets[event.key];
    if (offset !== undefined || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? displayLanguages.length - 1 : (index + offset + displayLanguages.length) % displayLanguages.length;
      choices.current[next]?.focus();
    }
  }
  return <div ref={root} className={styles.root}
    onBlur={event => {if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);}}
    onKeyDown={event => {if (event.key === 'Escape') {event.preventDefault(); setOpen(false); trigger.current?.focus();}}}>
    <button ref={trigger} type="button" id="display-language" className={styles.control}
      title={displayLanguageMetadata[language].nativeName}
      aria-label={`${displayCopy[language].langs}: ${displayLanguageMetadata[language].nativeName}`}
      aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
      onClick={() => setOpen(!open)}
      onKeyDown={event => {if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {event.preventDefault(); setOpen(true);}}}>
    <span className={styles.face} aria-hidden="true" dir="ltr">
      <span className={`${styles.badge} ${styles[language]}`}/>
      <span>{language.toUpperCase()}</span>
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m4 6 4 4 4-4"/></svg>
    </span>
    </button>
    {open && <div id={menuId} className={styles.menu} role="menu" aria-label={displayCopy[language].langs} dir="ltr">
      {displayLanguages.map((code, index) => <button key={code} type="button"
        ref={element => {choices.current[index] = element;}}
        className={styles.choice} role="menuitemradio" aria-checked={language === code}
        aria-label={`${code.toUpperCase()} · ${displayLanguageMetadata[code].nativeName}`}
        title={displayLanguageMetadata[code].nativeName} tabIndex={language === code ? 0 : -1}
        onClick={() => choose(code)} onKeyDown={event => navigate(event, index)}>
        <span aria-hidden="true" className={`${styles.badge} ${styles[code]}`}/>
        <span aria-hidden="true">{code.toUpperCase()}</span>
      </button>)}
    </div>}
  </div>;
}
