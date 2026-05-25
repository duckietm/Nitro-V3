import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactCompilerPlugin from "eslint-plugin-react-compiler";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default [
    {
        files: ["**/*.jsx", "**/*.js", "**/*.tsx", "**/*.ts"],
        plugins: {
            react: reactPlugin,
            "react-hooks": reactHooksPlugin,
            "react-compiler": reactCompilerPlugin,
            "@typescript-eslint": typescriptEslintPlugin,
        },
        languageOptions: {
            parser: typescriptEslintParser,
            ecmaVersion: "latest",
            parserOptions: {
                sourceType: "module",
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            ...typescriptEslintPlugin.configs.recommended.rules,
            ...typescriptEslintPlugin.configs[
                "recommended-requiring-type-checking"
            ].rules,
            'indent': [
                'error',
                4,
                {
                    'SwitchCase': 1
                }
            ],
            'no-multi-spaces': [
                'error'
            ],
            'no-trailing-spaces': [
                'error',
                {
                    'skipBlankLines': false,
                    'ignoreComments': true
                }
            ],
            'linebreak-style': [
                'off'
            ],
            'quotes': [
                'error',
                'single'
            ],
            'semi': [
                'error',
                'always'
            ],
            'brace-style': [
                'error',
                'allman'
            ],
            'object-curly-spacing': [
                'error',
                'always'
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/explicit-module-boundary-types': [
                'off',
                {
                    'allowedNames': [
                        'getMessageArray'
                    ]
                }
            ],
            '@typescript-eslint/unbound-method': [
                'off'
            ],
            '@typescript-eslint/ban-ts-comment': [
                'off'
            ],
            '@typescript-eslint/no-empty-function': [
                'error',
                {
                    'allow': [
                        'functions',
                        'arrowFunctions',
                        'generatorFunctions',
                        'methods',
                        'generatorMethods',
                        'constructors'
                    ]
                }
            ],
            '@typescript-eslint/no-unused-vars': [
                'off'
            ],
            '@typescript-eslint/no-restricted-types': [
                'error',
                {
                    'types':
                    {
                        'String': { message: 'Use string instead', fixWith: 'string' },
                        'Boolean': { message: 'Use boolean instead', fixWith: 'boolean' },
                        'Number': { message: 'Use number instead', fixWith: 'number' },
                        'Symbol': { message: 'Use symbol instead', fixWith: 'symbol' }
                    }
                }
            ],
            'react/react-in-jsx-scope': 'off',
            'react-compiler/react-compiler': 'warn'
        },
        settings: {
            react: {
                version: "19.2",
            },
        },
    },
];
