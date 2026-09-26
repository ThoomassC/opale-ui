import {
  LanguageSelector as SharedLanguageSelector,
  type LanguageSelectorProps,
} from '../magic/components/header-controls/LanguageSelector';

/** Le contrôle de la vitrine partage son rendu et son clavier avec PageScaffold. */
export function LanguageSelector(props: Omit<LanguageSelectorProps, 'siteClassNames'>) {
  return <SharedLanguageSelector {...props} siteClassNames />;
}
