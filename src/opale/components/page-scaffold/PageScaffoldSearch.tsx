import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import clsx from 'clsx';

import SearchBar, { type SearchBarProps } from '../search-bar/SearchBar';
import type { PageScaffoldLanguage, PageScaffoldSearchSuggestion } from './PageScaffold';
import styles from './PageScaffold.module.css';

interface PageScaffoldSearchProps {
  readonly language: PageScaffoldLanguage;
  readonly placeholder: string;
  readonly label: string;
  readonly suggestionsLabel: string;
  readonly noResultsLabel: string;
  readonly suggestions?: readonly PageScaffoldSearchSuggestion[];
  readonly onSuggestionSelect?: (suggestion: PageScaffoldSearchSuggestion) => void;
  readonly searchProps?: SearchBarProps;
  readonly searchAction: string;
  readonly searchName: string;
  readonly liquidGlass: boolean;
  readonly className?: string;
  readonly onSearch?: (query: string, event: FormEvent<HTMLFormElement>) => void;
}

function normalize(value: string, language: PageScaffoldLanguage): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(language);
}

/** Recherche autonome du gabarit ; la liste personnalisée est activée par `suggestions`. */
export function PageScaffoldSearch({
  language,
  placeholder,
  label,
  suggestionsLabel,
  noResultsLabel,
  suggestions,
  onSuggestionSelect,
  searchProps,
  searchAction,
  searchName,
  liquidGlass,
  className,
  onSearch,
}: PageScaffoldSearchProps) {
  const [localQuery, setLocalQuery] = useState(String(searchProps?.defaultValue ?? ''));
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId().replaceAll(':', '');
  const listId = `opale-page-search-${id}`;
  const query = searchProps?.value === undefined ? localQuery : String(searchProps.value);
  const normalizedQuery = normalize(query.trim(), language);
  const matches = useMemo(
    () =>
      suggestions && normalizedQuery
        ? suggestions
            .filter((suggestion) =>
              normalize(`${suggestion.label} ${suggestion.group ?? ''}`, language).includes(
                normalizedQuery,
              ),
            )
            .slice(0, 8)
        : [],
    [suggestions, normalizedQuery, language],
  );
  const panelOpen = suggestions !== undefined && open && normalizedQuery.length > 0;
  const listVisible = panelOpen && matches.length > 0;
  const activeSuggestion = matches[activeIndex];

  const choose = (suggestion: PageScaffoldSearchSuggestion) => {
    setOpen(false);
    setActiveIndex(-1);
    setLocalQuery('');
    inputRef.current?.blur();
    if (onSuggestionSelect) onSuggestionSelect(suggestion);
    else window.location.assign(suggestion.href);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    searchProps?.onKeyDown?.(event);
    if (event.defaultPrevented || suggestions === undefined) return;
    if (event.key === 'Escape' && panelOpen) {
      event.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!matches.length) return;
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        event.key === 'ArrowDown'
          ? (index + 1) % matches.length
          : index <= 0
            ? matches.length - 1
            : index - 1,
      );
    } else if (event.key === 'Enter' && listVisible && activeSuggestion) {
      event.preventDefault();
      choose(activeSuggestion);
    }
  };

  return (
    <form
      ref={formRef}
      className={clsx(styles.searchForm, className)}
      action={searchAction}
      method="get"
      autoComplete="off"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && formRef.current?.contains(event.relatedTarget))
          return;
        setOpen(false);
        setActiveIndex(-1);
      }}
      onSubmit={
        onSearch
          ? (event) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get(searchProps?.name ?? searchName);
              onSearch(typeof value === 'string' ? value : '', event);
              setOpen(false);
            }
          : undefined
      }
    >
      <SearchBar
        placeholder={placeholder}
        aria-label={label}
        {...searchProps}
        ref={inputRef}
        name={searchProps?.name ?? searchName}
        liquidGlass={searchProps?.liquidGlass ?? liquidGlass}
        autoComplete={searchProps?.autoComplete ?? 'off'}
        autoCorrect={searchProps?.autoCorrect ?? 'off'}
        spellCheck={searchProps?.spellCheck ?? false}
        {...(suggestions === undefined
          ? {}
          : {
              type: searchProps?.type ?? 'text',
              role: 'combobox',
              'aria-autocomplete': 'list' as const,
              'aria-controls': listId,
              'aria-expanded': listVisible,
              'aria-activedescendant':
                listVisible && activeSuggestion ? `${listId}-option-${activeIndex}` : undefined,
              value: query,
              onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                setLocalQuery(event.target.value);
                setOpen(true);
                setActiveIndex(-1);
                searchProps?.onChange?.(event);
              },
              onFocus: (event: React.FocusEvent<HTMLInputElement>) => {
                setOpen(true);
                searchProps?.onFocus?.(event);
              },
              onKeyDown,
            })}
      />
      {suggestions !== undefined ? (
        <>
          <ul
            id={listId}
            role="listbox"
            aria-label={suggestionsLabel}
            className={styles.searchSuggestions}
            hidden={!listVisible}
          >
            {matches.map((suggestion, index) => (
              /* eslint-disable-next-line jsx-a11y/click-events-have-key-events -- le clavier reste sur le champ, qui pilote aria-activedescendant. */
              <li
                key={suggestion.id}
                id={`${listId}-option-${index}`}
                role="option"
                aria-label={
                  suggestion.group ? `${suggestion.label} — ${suggestion.group}` : suggestion.label
                }
                aria-selected={index === activeIndex}
                className={styles.searchSuggestion}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(suggestion)}
              >
                <span className={styles.searchSuggestionLabel}>{suggestion.label}</span>
                {suggestion.group ? (
                  <span className={styles.searchSuggestionGroup}>{suggestion.group}</span>
                ) : null}
              </li>
            ))}
          </ul>
          {panelOpen && matches.length === 0 ? (
            <p className={styles.searchNoResults} role="status">
              {noResultsLabel}
            </p>
          ) : null}
        </>
      ) : null}
    </form>
  );
}
