import http from "node:http";
import net from "node:net";
import type { AddressInfo } from "node:net";

export type CapturedConnect = {
  targetHost: string;
  targetPort: number;
};

/**
 * `CONNECT`メソッドで実際にトンネリングを行う簡易HTTPSプロキシ。
 *
 * `HTTPS_PROXY`設定時に`src/client/index.ts`の`buildHttpsAgent`が構築する
 * `HttpsProxyAgent`（`https-proxy-agent`パッケージ）は、Agentインスタンス自身が
 * 独自の接続ロジック（CONNECTトンネリング）を実装している。
 * `KintoneRestAPIClient`をモックする単体テストでは「Agentが渡されたこと」しか
 * 検証できず、そのAgentの接続ロジックが実際に呼ばれてプロキシへ到達するかは
 * 検証できない。このサーバーは実際にCONNECTリクエストを受け取って記録することで、
 * その経路が本当に機能しているかを検証する。
 */
export class TestConnectProxyServer {
  private readonly server = http.createServer();
  private readonly logs: CapturedConnect[] = [];
  // CONNECTでハイジャックされたソケットは`server.closeAllConnections()`の
  // 追跡から外れてしまい、`server.close()`のコールバックが呼ばれなくなる
  // （テストのafterEachがタイムアウトする）。自前でソケットを追跡し、
  // closeではそれらを明示的に破棄する。
  private readonly sockets = new Set<net.Socket>();
  public baseUrl = "";

  constructor() {
    this.server.on("connection", (socket) => this.trackSocket(socket));
    this.server.on("connect", (req, clientSocket, head) =>
      this.handleConnect(req, clientSocket, head),
    );
  }

  public async listen(): Promise<void> {
    await new Promise<void>((resolve) =>
      this.server.listen(0, "127.0.0.1", resolve),
    );
    const { port } = this.server.address() as AddressInfo;
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  public getLogs(): CapturedConnect[] {
    return this.logs;
  }

  public async close(): Promise<void> {
    for (const socket of this.sockets) {
      socket.destroy();
    }
    await new Promise<void>((resolve) => this.server.close(() => resolve()));
  }

  private trackSocket(socket: net.Socket): void {
    this.sockets.add(socket);
    socket.on("close", () => this.sockets.delete(socket));
  }

  private handleConnect(
    req: http.IncomingMessage,
    clientSocket: net.Socket,
    head: Buffer,
  ): void {
    const [targetHost, targetPortStr] = (req.url ?? "").split(":");
    const targetPort = Number(targetPortStr);
    this.logs.push({ targetHost, targetPort });

    const serverSocket = net.connect(targetPort, targetHost, () => {
      clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      serverSocket.write(head);
      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });
    this.trackSocket(serverSocket);

    serverSocket.on("error", () => clientSocket.destroy());
    clientSocket.on("error", () => serverSocket.destroy());
  }
}
