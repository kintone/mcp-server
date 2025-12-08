import presetsNodeTypescriptPrettier from "@cybozu/eslint-config/flat/presets/node-typescript-prettier.js";
import eslintPluginPackageJson from "eslint-plugin-package-json";
import globals from "globals";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nodePlugin = require("eslint-plugin-n");

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...presetsNodeTypescriptPrettier,
  {
    ignores: ["lib", "esm", "umd", "dist", "build"],
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
    plugins: {
      n: nodePlugin,
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "n/hashbang": [
        "error",
        // https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/hashbang.md#convertpath
        {
          convertPath: { "src/**/*.ts": ["^src/(.+?)\\.ts$", "dist/$1.js"] },
          additionalExecutables: ["scripts/**/*"],
        },
      ],
      "n/no-missing-import": [
        "error",
        {
          allowModules: ["@modelcontextprotocol/sdk"],
        },
      ],
    },
  },
  {
    ...eslintPluginPackageJson.configs.recommended,
    rules: {
      ...eslintPluginPackageJson.configs.recommended.rules,
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
];
