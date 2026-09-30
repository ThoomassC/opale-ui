import clsx from 'clsx';
import styles from './HeaderControls.module.css';

export interface HeaderThemeToggleProps {
  readonly isDark: boolean;
  readonly label: string;
  readonly onToggle: () => void;
  readonly siteClassNames?: boolean;
}

/** Le même contrôle visuel pour le header Opale et les pages PageScaffold. */
export function HeaderThemeToggle({
  isDark,
  label,
  onToggle,
  siteClassNames = false,
}: HeaderThemeToggleProps) {
  return (
    <button
      className={clsx(siteClassNames && 'tc-doc-themetoggle', styles.theme)}
      type="button"
      aria-pressed={isDark}
      onClick={onToggle}
    >
      <span
        className={clsx(
          siteClassNames && 'tc-doc-themetoggle__glyph',
          siteClassNames &&
            (isDark ? 'tc-doc-themetoggle__glyph--sun' : 'tc-doc-themetoggle__glyph--moon'),
          isDark ? styles.sun : styles.moon,
        )}
        aria-hidden="true"
      >
        {isDark ? '☀' : '☾'}
      </span>
      <span className={clsx(siteClassNames && 'tc-visually-hidden', styles.srOnly)}>{label}</span>
    </button>
  );
}
