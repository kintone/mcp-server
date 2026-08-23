import { describe, it, expect, afterEach } from "vitest";
import { getApp } from "../../../tools/kintone/app/get-app.js";
import { TestServer } from "./fixtures/TestServer.js";
import { createFreshKintoneClient } from "./fixtures/createFreshKintoneClient.js";
import { useInsecureTlsForSelfSignedFixtures } from "./fixtures/insecureTlsForSelfSignedFixtures.js";
import { SAMPLE_APP_RESPONSE } from "./fixtures/sampleAppResponse.js";
import { TLS_FIXTURES } from "./fixtures/tlsFixtures.js";
import { mockKintoneConfig } from "../../../__tests__/utils.js";
import type { KintoneClientConfig } from "../../index.js";

/**
 * `src/client/index.ts`の`buildHttpsAgent`は、`KINTONE_PFX_FILE_PATH`/
 * `KINTONE_PFX_FILE_PASSWORD`指定時に`pfx`/`passphrase`を持つ`https.Agent`を
 * 構築し、`httpsAgent`オプションに渡す。
 *
 * `client.test.ts`の既存テストはPFXファイルが読み込まれたことしか検証しておらず、
 * そのAgentが実際のTLSハンドシェイクでクライアント証明書として提示され、
 * サーバー側に検証されるところまでは検証していない（`fs.readFileSync`が
 * モックされているため、実際のPFXの復号や鍵の妥当性も試されない）。
 *
 * このテストは、クライアント証明書を要求する実HTTPSサーバーを立てて実際に
 * mTLSハンドシェイクを完了させることで、その経路が本当に機能しているかを
 * 検証する。
 */
describe("client certificate (mTLS) configuration", () => {
  useInsecureTlsForSelfSignedFixtures();

  let server: TestServer;

  afterEach(async () => {
    await server?.close();
  });

  const startMtlsServer = async (): Promise<TestServer> => {
    const newServer = new TestServer({
      cert: TLS_FIXTURES.serverCert,
      key: TLS_FIXTURES.serverKey,
      requestCert: true,
      rejectUnauthorized: true,
      ca: [TLS_FIXTURES.clientCertPem],
    });
    await newServer.listen();
    return newServer;
  };

  it("completes a real mTLS handshake and lets the server verify the client cert", async () => {
    server = await startMtlsServer();
    server.mockJsonResponse(SAMPLE_APP_RESPONSE);

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: server.baseUrl,
      KINTONE_PFX_FILE_PATH: TLS_FIXTURES.clientCertPfxPath,
      KINTONE_PFX_FILE_PASSWORD: TLS_FIXTURES.clientCertPassphrase,
    };
    const client = await createFreshKintoneClient(config);

    const result = await getApp.callback({ appId: "1" }, { client });

    expect(result.structuredContent).toMatchObject({ name: "Test App" });

    const [request] = server.getLogs();
    expect(request.socketAuthorized).toBe(true);
    expect(request.peerCertificateCommonName).toBe(
      TLS_FIXTURES.clientCertCommonName,
    );
  });

  it("fails the handshake instead of silently connecting when the passphrase is wrong", async () => {
    server = await startMtlsServer();
    server.mockJsonResponse(SAMPLE_APP_RESPONSE);

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: server.baseUrl,
      KINTONE_PFX_FILE_PATH: TLS_FIXTURES.clientCertPfxPath,
      KINTONE_PFX_FILE_PASSWORD: "wrong-passphrase",
    };
    const client = await createFreshKintoneClient(config);

    await expect(getApp.callback({ appId: "1" }, { client })).rejects.toThrow();
    expect(server.getLogs()).toHaveLength(0);
  });
});
