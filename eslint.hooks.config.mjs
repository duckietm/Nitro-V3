// Minimal ESLint config focused on the Rules of Hooks.
//
// The full eslint.config.mjs runs the project's full lint baseline,
// which currently emits ~900 pre-existing errors (brace style,
// indentation, recommended TS rules) — those are tracked separately
// and would drown a CI signal. This config strips down to just the
// rule we care about as a gate: react-hooks/rules-of-hooks.
//
// Wired up as `yarn lint:hooks` (see package.json) and called from
// .github/workflows/ci.yml so a hook-order violation breaks the
// build the same way a typecheck or test failure would.

import typescriptEslintParser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    {
        files: ['**/*.jsx', '**/*.js', '**/*.tsx', '**/*.ts'],
        plugins: {
            'react-hooks': reactHooksPlugin
        },
        languageOptions: {
            parser: typescriptEslintParser,
            ecmaVersion: 'latest',
            parserOptions: {
                sourceType: 'module',
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
                ecmaFeatures: {
                    jsx: true
                }
            }
        },
        rules: {
            'react-hooks/rules-of-hooks': 'error'
        }
    }
];
