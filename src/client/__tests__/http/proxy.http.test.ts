import { describe, it, expect, afterEach } from "vitest";
import { getApp } from "../../../tools/kintone/app/get-app.js";
import { TestServer } from "./fixtures/test-server.js";
import { TestConnectProxyServer } from "./fixtures/test-connect-proxy-server.js";
import { createFreshKintoneClient } from "./fixtures/create-fresh-kintone-client.js";
import { useInsecureTlsForSelfSignedFixtures } from "./fixtures/insecure-tls-for-self-signed-fixtures.js";
import { SAMPLE_APP_RESPONSE } from "./fixtures/sample-app-response.js";
import { TLS_FIXTURES } from "./fixtures/tls-fixtures.js";
import { mockKintoneConfig } from "../../../__tests__/utils.js";
import type { KintoneClientConfig } from "../../index.js";

/**
 * `src/client/index.ts`の`buildHttpsAgent`は、`HTTPS_PROXY`指定時に
 * `HttpsProxyAgent`（`https-proxy-agent`パッケージ、独自のCONNECTトンネリング
 * ロジックを実装したカスタムAgent）を`httpsAgent`オプションに渡している。
 *
 * `client.test.ts`の既存テストは「そのAgentが渡されたこと」しかモック越しに
 * 検証しておらず、そのAgentの接続ロジックが実際に呼ばれてプロキシへ到達する
 * かどうかは検証していない。将来rest-api-clientの内部実装が変わり、`httpsAgent`
 * が「TLS証明書関連プロパティの入れ物」としてしか読まれなくなると
 * （カスタムAgentの接続ロジックが無視される）、この既存テストは気づかずに
 * パスし続けてしまう。
 *
 * このテストは実際にCONNECTトンネリングを行うプロキシサーバーを立て、
 * プロキシへ本当に到達しているかを検証することで、その退行を検知する。
 *
 * このテストが将来失敗した場合にすべきこと：
 * `@kintone/rest-api-client`をaxios→fetch移行後のバージョンへ上げた結果として
 * このテストが失敗した場合、それはリグレッションではなく想定通りの検知結果。
 * 6.2.1時点で既に存在する専用の`proxy`オプション
 * （`{protocol, host, port, auth}`形式、`HTTPS_PROXY`のURL文字列から変換が必要）
 * へ`src/client/index.ts`の実装を切り替えること。「プロキシへ実際にCONNECTが
 * 届くこと」を検証するこのテスト自体の構造は、`proxy`オプション経路でも
 * そのまま使えるはず（`HttpsProxyAgent`を使わなくなる分、`buildHttpsAgent`の
 * 呼び出し経路は変わるが、アサーションの意図は変わらない）。テストを消すのでは
 * なく、期待値を新しい実装に合わせて更新すること。
 */
describe("HTTPS_PROXY configuration (real proxy tunnel)", () => {
  useInsecureTlsForSelfSignedFixtures();

  let targetServer: TestServer;
  let proxyServer: TestConnectProxyServer;

  afterEach(async () => {
    await targetServer?.close();
    await proxyServer?.close();
  });

  it("actually tunnels the HTTPS request through HTTPS_PROXY", async () => {
    targetServer = new TestServer({
      cert: TLS_FIXTURES.serverCert,
      key: TLS_FIXTURES.serverKey,
    });
    await targetServer.listen();

    proxyServer = new TestConnectProxyServer();
    await proxyServer.listen();

    targetServer.mockJsonResponse(SAMPLE_APP_RESPONSE);

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: targetServer.baseUrl,
      HTTPS_PROXY: proxyServer.baseUrl,
    };
    const client = await createFreshKintoneClient(config);

    const result = await getApp.callback({ appId: "1" }, { client });

    expect(result.structuredContent).toMatchObject({ name: "Test App" });

    // プロキシへ実際にCONNECTが届いたこと（=HttpsProxyAgentの接続ロジックが
    // 呼ばれたこと）を検証する。ここが検知できていないと、プロキシが黒く
    // 無視されて直接ターゲットへ到達してしまっていても気づけない。
    const targetUrl = new URL(targetServer.baseUrl);
    const [connectLog] = proxyServer.getLogs();
    expect(connectLog).toEqual({
      targetHost: targetUrl.hostname,
      targetPort: Number(targetUrl.port),
    });

    // トンネルの先で実際にリクエストが処理されたことも確認する。
    const [request] = targetServer.getLogs();
    expect(request.method).toBe("get");
    expect(request.path).toBe("/k/v1/app.json?id=1");
  });

  it("throws instead of silently succeeding when the proxy is unreachable", async () => {
    targetServer = new TestServer({
      cert: TLS_FIXTURES.serverCert,
      key: TLS_FIXTURES.serverKey,
    });
    await targetServer.listen();
    targetServer.mockJsonResponse(SAMPLE_APP_RESPONSE);

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: targetServer.baseUrl,
      // 何も listen していないポートを指すことで、プロキシに到達できない状況を作る。
      HTTPS_PROXY: "http://127.0.0.1:1",
    };
    const client = await createFreshKintoneClient(config);

    await expect(getApp.callback({ appId: "1" }, { client })).rejects.toThrow();

    // プロキシへ到達できなかった以上、ターゲットへ直接届いてしまっていては
    // ならない（プロキシ経由の強制がバイパスされていないことの確認）。
    expect(targetServer.getLogs()).toHaveLength(0);
  });
});
