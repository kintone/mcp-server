import { describe, it, expect, afterEach } from "vitest";
import { getApp } from "../../../tools/kintone/app/get-app.js";
import { TestServer } from "./fixtures/test-server.js";
import { createFreshKintoneClient } from "./fixtures/create-fresh-kintone-client.js";
import { useInsecureTlsForSelfSignedFixtures } from "./fixtures/insecure-tls-for-self-signed-fixtures.js";
import { SAMPLE_APP_RESPONSE } from "./fixtures/sample-app-response.js";
import { TLS_FIXTURES } from "./fixtures/tls-fixtures.js";
import { mockKintoneConfig } from "../../../__tests__/utils.js";
import type { KintoneClientConfig } from "../../index.js";

/**
 * `KintoneRestAPIClient`をモックせず、実際にHTTPサーバーとやり取りして
 * ツール呼び出しが成立することを確認する回帰テスト。
 *
 * 単体テスト（`client.test.ts`等）は`KintoneRestAPIClient`のコンストラクタ
 * 引数を検証するだけで、実際のリクエスト送信・レスポンス解析は一切行わない。
 * そのため、rest-api-client内部のHTTPクライアント実装（axios→fetch等）が
 * 変わって実際の通信が壊れても、単体テストは無条件でパスしてしまう。
 * このテストは実サーバーを使うことでその穴を塞ぐ。
 *
 * なお`KintoneRestAPIClient`はbaseUrlのプロトコルが`https`であることを
 * 要求するため、ここでもテスト専用の自己署名証明書を使ったHTTPSサーバーを使う。
 */
describe("real HTTP call through getKintoneClient", () => {
  useInsecureTlsForSelfSignedFixtures();

  let server: TestServer;

  const startServer = async (): Promise<TestServer> => {
    const newServer = new TestServer({
      cert: TLS_FIXTURES.serverCert,
      key: TLS_FIXTURES.serverKey,
    });
    await newServer.listen();
    return newServer;
  };

  afterEach(async () => {
    await server?.close();
  });

  it("sends the API token header on the wire and parses the JSON response", async () => {
    server = await startServer();
    server.mockJsonResponse(SAMPLE_APP_RESPONSE);
    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: server.baseUrl,
      KINTONE_USERNAME: undefined,
      KINTONE_PASSWORD: undefined,
      KINTONE_API_TOKEN: "test-api-token",
    };
    const client = await createFreshKintoneClient(config);

    const result = await getApp.callback({ appId: "1" }, { client });

    expect(result.structuredContent).toMatchObject({
      appId: "1",
      name: "Test App",
    });

    const [request] = server.getLogs();
    expect(request.method).toBe("get");
    expect(request.path).toBe("/k/v1/app.json?id=1");
    expect(request.headers["x-cybozu-api-token"]).toBe("test-api-token");
  });

  it("sends the X-Cybozu-Authorization header (base64 of username:password) on the wire", async () => {
    server = await startServer();
    server.mockJsonResponse(SAMPLE_APP_RESPONSE);

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: server.baseUrl,
      KINTONE_USERNAME: "testuser",
      KINTONE_PASSWORD: "testpass",
      KINTONE_API_TOKEN: undefined,
    };
    const client = await createFreshKintoneClient(config);

    await getApp.callback({ appId: "1" }, { client });

    const [request] = server.getLogs();
    expect(request.headers["x-cybozu-authorization"]).toBe(
      Buffer.from("testuser:testpass").toString("base64"),
    );
  });

  it("sends the reverse-proxy Basic auth Authorization header when configured", async () => {
    server = await startServer();
    server.mockJsonResponse(SAMPLE_APP_RESPONSE);

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: server.baseUrl,
      KINTONE_BASIC_AUTH_USERNAME: "basicuser",
      KINTONE_BASIC_AUTH_PASSWORD: "basicpass",
    };
    const client = await createFreshKintoneClient(config);

    await getApp.callback({ appId: "1" }, { client });

    const [request] = server.getLogs();
    expect(request.headers.authorization).toBe(
      `Basic ${Buffer.from("basicuser:basicpass").toString("base64")}`,
    );
  });
});
