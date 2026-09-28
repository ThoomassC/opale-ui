import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', '.claude'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'error',

      // WCAG 2.1.1 impose qu'une zone défilante soit atteignable au clavier :
      // un tableau à défilement horizontal dont on ne peut pas faire venir les
      // colonnes est inutilisable sans souris. La liste blanche par défaut de
      // la règle ne connaît que `tabpanel` ; `group` est le rôle correct pour
      // une telle zone, et l'autoriser ici évite deux `eslint-disable` posés à
      // l'endroit précis où la règle a tort.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['tabpanel', 'group'] }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
