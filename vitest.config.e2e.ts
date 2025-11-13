import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // e2e.test.tsファイルのみ実行
    include: ["**/*.e2e.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    // 実環境を利用するため、並列実行を無効化して順次実行
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
