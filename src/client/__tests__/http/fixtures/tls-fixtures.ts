import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TLS_DIR = fileURLToPath(new URL("./tls/", import.meta.url));

/**
 * テスト専用の使い捨て自己署名証明書一式。
 *
 * 再生成する場合は以下のコマンドを`tls/`ディレクトリ内で実行する：
 *
 * ```sh
 * # サーバー証明書（127.0.0.1宛のテスト用HTTPSサーバー用）
 * openssl req -x509 -newkey rsa:2048 -keyout server-key.pem -out server-cert.pem \
 *   -days 3650 -nodes -subj "/CN=127.0.0.1" \
 *   -addext "subjectAltName=IP:127.0.0.1,DNS:localhost"
 *
 * # クライアント証明書（mTLSテスト用、自己署名）
 * openssl req -x509 -newkey rsa:2048 -keyout client-key.pem -out client-cert.pem \
 *   -days 3650 -nodes -subj "/CN=mcp-server-test-client"
 * openssl pkcs12 -export -out client-cert.pfx -inkey client-key.pem -in client-cert.pem \
 *   -passout pass:correct-passphrase
 * rm client-key.pem # PFXに内包されるので不要
 * ```
 */
export const TLS_FIXTURES = {
  serverCert: readFileSync(`${TLS_DIR}server-cert.pem`),
  serverKey: readFileSync(`${TLS_DIR}server-key.pem`),
  clientCertPem: readFileSync(`${TLS_DIR}client-cert.pem`),
  clientCertPfxPath: `${TLS_DIR}client-cert.pfx`,
  clientCertPassphrase: "correct-passphrase",
  clientCertCommonName: "mcp-server-test-client",
} as const;
