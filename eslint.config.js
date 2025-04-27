import globals from "globals";
import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import functional from "eslint-plugin-functional";

/** @type {import('eslint').Linter.Config[]} */
// @ts-ignore
export default [
    pluginJs.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            "@stylistic": stylistic,
            // You'd think the devs would be a lil more competent. This flags TS.
            "@functional": functional,
        },
        rules: {
            "@stylistic/quotes": ["error", "double"],
            "@stylistic/indent": ["error", 4],
            "@stylistic/comma-spacing": [
                "error",
                {
                    before: false,
                    after: true,
                },
            ],
            "@stylistic/function-call-spacing": ["error", "never"],
            "@stylistic/line-comment-position": [
                "error",
                { position: "above" },
            ],
            "@stylistic/no-extra-semi": "error",
            "@stylistic/no-floating-decimal": "error",
            "@stylistic/no-mixed-spaces-and-tabs": "error",
            "@stylistic/no-multi-spaces": "error",
            "@stylistic/no-multiple-empty-lines": ["error", { max: 1 }],
            "@stylistic/no-trailing-spaces": [
                "error",
                { ignoreComments: true },
            ],
            "@stylistic/no-whitespace-before-property": "error",
            // "@stylistic/nonblock-statement-body-position": ["error", "beside"],
            "@stylistic/object-curly-spacing": ["error", "always"],
            "@stylistic/object-property-newline": "error",
            "@stylistic/padded-blocks": ["error", "never"],
            /**
             * "@stylistic/padding-line-between-statements": [
             *     "error",
             *     {
             *         blankLine: "always",
             *         prev: ["for", "if", "throw"],
             *         next: "return"
             *     }
             * ],
             */
            "@stylistic/quote-props": ["error", "as-needed"],
            "@stylistic/rest-spread-spacing": ["error", "never"],

            "@functional/no-classes": "error",
        },
    },
];
