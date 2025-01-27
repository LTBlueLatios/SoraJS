import globals from "globals";
import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin"

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        plugins: {
            "@stylistic": stylistic
        },
        rules: {
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/indent": ["error", 4]
        }
    },
    pluginJs.configs.recommended,
];