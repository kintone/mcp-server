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

  // 注意: このテストは「PFX/httpsAgentの配線が壊れていないこと」の検知には
  // 実質的に寄与しない。PFX分岐自体を無効化して証明書を一切送らない場合でも、
  // mTLSサーバーは同様に接続を拒否するため、このテストは変わらずパスしてしまう
  // （mutation testで確認済み）。ここで検証しているのは、パスフレーズ不一致が
  // 「invalid clientCertAuth setting」という具体的なエラー（PFXの復号失敗、
  // OpenSSLの"mac verify failure"由来）として明示的に失敗することであり、
  // その一点に絞ってアサートする。PFX/httpsAgentの配線自体の回帰検知は、
  // 上の「completes a real mTLS handshake...」テストが担っている。
  it("fails with a clientCertAuth-specific error when the passphrase is wrong", async () => {
    server = await startMtlsServer();
    server.mockJsonResponse(SAMPLE_APP_RESPONSE);

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: server.baseUrl,
      KINTONE_PFX_FILE_PATH: TLS_FIXTURES.clientCertPfxPath,
      KINTONE_PFX_FILE_PASSWORD: "wrong-passphrase",
    };
    const client = await createFreshKintoneClient(config);

    await expect(getApp.callback({ appId: "1" }, { client })).rejects.toThrow(
      /invalid clientCertAuth setting/,
    );
    expect(server.getLogs()).toHaveLength(0);
  });
});
