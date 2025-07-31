import presetsNodeTypescriptPrettier from "@cybozu/eslint-config/flat/presets/node-typescript-prettier.js";
import eslintPluginPackageJson from "eslint-plugin-package-json";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...presetsNodeTypescriptPrettier,
  {
    ignores: ["lib", "esm", "umd", "dist"],
  },
  {
    files: ["*.cjs", "*.cts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["*.js", "*.ts", "*.mjs", "*.mts"],
    languageOptions: {
      globals: globals.nodeBuiltin,
    },
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    ...eslintPluginPackageJson.configs.recommended,
    rules: {
      ...eslintPluginPackageJson.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
  {
    rules: {
      "n/no-missing-import": [
        "error",
        {
          allowModules: ["@modelcontextprotocol/sdk"],
        },
      ],
    },
  },
];
