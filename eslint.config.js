import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/*
 * Flat config (ESLint 10). Three distinct environments live in this repo and they
 * do not share globals or module systems, so each gets its own block:
 *
 *   src/            browser + ESM + TSX, the React app itself
 *   scripts/*.cjs   Node + CommonJS one-shot generators
 *   *.config.ts     Node-ish ESM tooling config
 *
 * supabase/functions/ is deliberately NOT linted here: it is Deno, with `npm:`/`jsr:`
 * specifiers and Deno globals that this config would flag wholesale. deno.yml covers it.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'supabase/**', 'deploy/**', 'public/**'],
  },

  // The React app. Type-aware linting is off on purpose: the rules we actually want
  // here (react-hooks) are syntactic, and `npm run typecheck` already runs the full
  // type checker over the same files, so a second type-aware pass costs seconds and
  // tells us nothing new.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // `_`-prefixed args are the established convention here for a signature we must
      // match but do not use; tsconfig's noUnusedParameters agrees via the same prefix.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      /*
       * Downgraded from error to warning, deliberately.
       *
       * This is a React-Compiler-era rule new in eslint-plugin-react-hooks v7, and it
       * fires on five pre-existing, tested sites that all reset state when a dependency
       * changes (useSolvedIds, ProgressPage, ReplayPlayer, SessionPage x2). The rule is
       * not wrong - each one does cause a cascading render - but every fix is an effect
       * rewrite, not a lint fix, and this project does not run the compiler. Left visible
       * on every `npm run lint` as a tracked backlog rather than silenced with disables.
       *
       * Because that backlog exists, CI runs plain `eslint .` without `--max-warnings=0`:
       * errors block, warnings are printed. Tighten this to 'error' once the five sites
       * are reworked, and add --max-warnings=0 at the same time.
       */
      'react-hooks/set-state-in-effect': 'warn',
    },
  },

  // CommonJS generator scripts: Node globals, `require`, and `process.exit`.
  {
    files: ['scripts/**/*.cjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },

  // Build/test tooling config at the repo root.
  {
    files: ['*.config.{js,ts}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
  },
);
