import http from "node:http";
import https from "node:https";
import type { AddressInfo } from "node:net";
import type { TLSSocket } from "node:tls";

export type CapturedRequest = {
  method: string;
  path: string;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  /**
   * TLSソケットの検証結果。requestCertを有効にしたHTTPSサーバーでのみ意味を持つ
   * （クライアント証明書がサーバーに認証されたかどうか）。
   */
  socketAuthorized?: boolean;
  /** クライアント証明書のCommon Name（クライアント証明書が提示された場合のみ）。 */
  peerCertificateCommonName?: string;
};

type QueuedResponse =
  | { kind: "json"; status: number; body: unknown }
  | {
      kind: "binary";
      status: number;
      contentType: string;
      body: Buffer;
    };

export type TestServerTlsOptions = {
  cert: Buffer;
  key: Buffer;
  /** mTLS検証用。指定するとサーバーがクライアント証明書を要求・検証する。 */
  requestCert?: boolean;
  rejectUnauthorized?: boolean;
  ca?: Buffer[];
};

/**
 * 実際にTCP/TLSで通信するテスト用HTTPサーバー。
 *
 * `KintoneRestAPIClient`（およびそれを内部で使う`getKintoneClient`）をモックせず、
 * 実際にHTTP(S)リクエストを送受信させることで、以下のような
 * 「モックだと素通りしてしまう」トランスポート層の挙動を検証するために使う：
 * - プロキシ・クライアント証明書認証が実際に機能しているか
 * - レスポンスボディ（JSON / バイナリ）が正しく読み取れるか
 * - 認証情報（Basic認証ヘッダ、APIトークンヘッダ等）が実際にワイヤに乗るか
 */
export class TestServer {
  private readonly server: http.Server | https.Server;
  private readonly logs: CapturedRequest[] = [];
  private readonly responseQueue: QueuedResponse[] = [];
  public baseUrl = "";

  constructor(private readonly tls?: TestServerTlsOptions) {
    const handler = (
      req: http.IncomingMessage,
      res: http.ServerResponse,
    ): void => this.handle(req, res);
    this.server = this.tls
      ? https.createServer(this.tls, handler)
      : http.createServer(handler);
  }

  public async listen(): Promise<void> {
    await new Promise<void>((resolve) =>
      this.server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = this.server.address() as AddressInfo;
    this.baseUrl = `${this.tls ? "https" : "http"}://127.0.0.1:${port}`;
  }

  public mockJsonResponse(body: unknown, status = 200): void {
    this.responseQueue.push({ kind: "json", status, body });
  }

  public mockBinaryResponse(
    body: Buffer,
    contentType: string,
    status = 200,
  ): void {
    this.responseQueue.push({ kind: "binary", status, contentType, body });
  }

  public getLogs(): CapturedRequest[] {
    return this.logs;
  }

  public async close(): Promise<void> {
    // keep-alive接続が残っているとserver.close()のコールバックが
    // いつまでも呼ばれず、テストのafterEachがタイムアウトしてしまう。
    // 開いている接続を強制的に終了させてから閉じる。
    this.server.closeAllConnections();
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  private handle(req: http.IncomingMessage, res: http.ServerResponse): void {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => {
      const socket = req.socket as Partial<TLSSocket>;
      this.logs.push({
        method: (req.method ?? "").toLowerCase(),
        path: req.url ?? "",
        headers: req.headers,
        body: Buffer.concat(chunks),
        socketAuthorized: socket.authorized,
        peerCertificateCommonName: socket.getPeerCertificate?.()?.subject?.CN,
      });

      const next = this.responseQueue.shift() ?? {
        kind: "json" as const,
        status: 200,
        body: {},
      };
      if (next.kind === "binary") {
        res.writeHead(next.status, { "Content-Type": next.contentType });
        res.end(next.body);
        return;
      }
      res.writeHead(next.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(next.body));
    });
  }
}
