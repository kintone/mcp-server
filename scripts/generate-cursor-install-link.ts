#!/usr/bin/env node
// Cursorのインストール用リンクを作成するスクリプト
// 実行方法: pnpm doc:cursor-install-link

// インストールリンクの詳細はCursorのドキュメントを参照
// ref. https://docs.cursor.com/ja/tools/developers
// 本来は上記ページのリンク生成ツールで作成できるのだが、
// Web Linkの生成が壊れているようなのでこのスクリプトで生成する
// ref. https://forum.cursor.com/t/install-link-generator-for-mcp-servers-produces-invalid-config-parameter/128080

interface CursorMcpConfig {
  command: string;
  env: Record<string, string>;
  args: string[];
}

const serverName = "kintone";
const config: CursorMcpConfig = {
  command: "docker",
  env: {
    KINTONE_BASE_URL: "https://(subdomain).cybozu.com",
    KINTONE_USERNAME: "(username)",
    KINTONE_PASSWORD: "(password)",
  },
  args: [
    "run",
    "-i",
    "--rm",
    "-e",
    "KINTONE_BASE_URL",
    "-e",
    "KINTONE_USERNAME",
    "-e",
    "KINTONE_PASSWORD",
    "ghcr.io/kintone/mcp-server:latest",
  ],
};

// JSON → Base64 → URLエンコード
const json = JSON.stringify(config);
const b64 = Buffer.from(json, "utf8").toString("base64");
const encoded = encodeURIComponent(b64);

// URL組み立て
const baseUrl = "https://cursor.com/en/install-mcp";
const url = `${baseUrl}?name=${encodeURIComponent(serverName)}&config=${encoded}`;

console.log(url);
