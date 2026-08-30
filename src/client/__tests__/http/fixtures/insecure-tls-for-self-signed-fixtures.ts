import { beforeEach, afterEach } from "vitest";

/**
 * このディレクトリのHTTPレベルテストは、テスト専用の使い捨て自己署名証明書
 * （`./tls/`）を使ったHTTPSサーバーに対して実際に通信する。
 *
 * `KintoneRestAPIClient`のbaseUrlはプロトコルが`https`であることが必須で、
 * 現状の`src/client/index.ts`の`buildHttpsAgent`にはサーバー証明書側を
 * 信頼させるための`ca`/`rejectUnauthorized`を渡す経路がない。そのため、
 * テスト対象の自己署名サーバー証明書をクライアントに信頼させる手段が
 * `NODE_TLS_REJECT_UNAUTHORIZED`の無効化以外にない。
 *
 * これは検証したい挙動（プロキシ到達性・クライアント証明書提示・
 * レスポンス解析等）とは無関係な、テスト用サーバー証明書を通すためだけの
 * 措置。テストの前後だけ有効化し、他のテストファイルに影響しないよう
 * 必ず元の値へ戻す。
 *
 * `describe`ブロックの直下で呼び出して使う：
 * ```ts
 * describe("...", () => {
 *   useInsecureTlsForSelfSignedFixtures();
 *   it(...);
 * });
 * ```
 */
export const useInsecureTlsForSelfSignedFixtures = (): void => {
  let original: string | undefined;

  beforeEach(() => {
    original = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  });

  afterEach(() => {
    // `process.env.X = undefined`は代入であってキー削除ではなく、
    // Node.jsは文字列"undefined"に変換してしまう（`delete`とは異なる）。
    // 元が未設定だった場合はキー自体を削除し、本当に「元の状態」へ戻す。
    if (original === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = original;
    }
  });
};
