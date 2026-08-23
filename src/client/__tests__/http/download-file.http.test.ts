import { describe, it, expect, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { downloadFile } from "../../../tools/kintone/file/download-file.js";
import { TestServer } from "./fixtures/TestServer.js";
import { createFreshKintoneClient } from "./fixtures/createFreshKintoneClient.js";
import { useInsecureTlsForSelfSignedFixtures } from "./fixtures/insecureTlsForSelfSignedFixtures.js";
import { TLS_FIXTURES } from "./fixtures/tlsFixtures.js";
import { mockKintoneConfig } from "../../../__tests__/utils.js";
import type { KintoneClientConfig } from "../../index.js";

// 1x1の透明PNG。file-typeによる実バイト列からのMIME判定も併せて検証するため、
// 実在するフォーマットの既知バイト列を使う。
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVQYV2NgAAIAAAUAAen63NgAAAAASUVORK5CYII=",
  "base64",
);

/**
 * `client.file.downloadFile`はレスポンスをArrayBuffer（バイナリ）として
 * 受け取る（axios時代は`responseType: "arraybuffer"`）。既存の単体テスト
 * （`download-file.test.ts`）は`client.file.downloadFile`自体をモックしており、
 * HTTPレスポンスボディの実際のバイト列の転送・復元は一切検証していない。
 *
 * このテストは実HTTPSサーバーから既知のバイト列を返し、`kintone-download-file`
 * ツールが実際にディスクへ書き出したファイルがバイト単位で一致することを
 * 検証する。
 */
describe("kintone-download-file (real HTTP binary response)", () => {
  useInsecureTlsForSelfSignedFixtures();

  let server: TestServer;
  let attachmentsDir: string;

  afterEach(async () => {
    await server?.close();
    if (attachmentsDir) {
      fs.rmSync(attachmentsDir, { recursive: true, force: true });
    }
  });

  it("writes the exact bytes returned by the server to disk", async () => {
    server = new TestServer({
      cert: TLS_FIXTURES.serverCert,
      key: TLS_FIXTURES.serverKey,
    });
    await server.listen();
    server.mockBinaryResponse(PNG_BYTES, "image/png");

    attachmentsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "mcp-server-download-test-"),
    );

    const config: KintoneClientConfig = {
      ...mockKintoneConfig,
      KINTONE_BASE_URL: server.baseUrl,
    };
    const client = await createFreshKintoneClient(config);

    const result = await downloadFile.callback(
      { fileKey: "some-file-key", fileName: "test-download" },
      { client, attachmentsDir },
    );

    expect(result.structuredContent).toMatchObject({
      mimeType: "image/png",
      fileSize: PNG_BYTES.byteLength,
    });

    const filePath = (result.structuredContent as { filePath: string })
      .filePath;
    const writtenBytes = fs.readFileSync(filePath);
    expect(writtenBytes.equals(PNG_BYTES)).toBe(true);
    expect(path.extname(filePath)).toBe(".png");

    const [request] = server.getLogs();
    expect(request.method).toBe("get");
    expect(request.path).toBe("/k/v1/file.json?fileKey=some-file-key");
  });
});
