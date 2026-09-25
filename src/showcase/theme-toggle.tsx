import { HeaderThemeToggle } from '../magic/components/header-controls/HeaderThemeToggle';
import { useTheme } from './use-theme';

/** Contrôle du thème de la vitrine, habillé comme celui de PageScaffold. */
export function ThemeToggle({ label = 'Thème sombre' }: { readonly label?: string }) {
  const { isDarkTheme, toggleTheme } = useTheme();
  return (
    <HeaderThemeToggle isDark={isDarkTheme} label={label} onToggle={toggleTheme} siteClassNames />
  );
}
