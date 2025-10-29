import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e.test.tsファイルのみ実行
    include: ["**/*.e2e.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  },
});
