# kintone MCP Server

[![ci](https://github.com/kintone/mcp-server/actions/workflows/ci.yaml/badge.svg)](https://github.com/kintone/mcp-server/actions/workflows/ci.yaml)
[![npm version](https://badge.fury.io/js/@kintone%2Fmcp-server.svg)](https://badge.fury.io/js/@kintone%2Fmcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=kintone&config=eyJjb21tYW5kIjoiZG9ja2VyIiwiZW52Ijp7IktJTlRPTkVfQkFTRV9VUkwiOiJodHRwczovLyhzdWJkb21haW4pLmN5Ym96dS5jb20iLCJLSU5UT05FX1VTRVJOQU1FIjoiKHVzZXJuYW1lKSIsIktJTlRPTkVfUEFTU1dPUkQiOiIocGFzc3dvcmQpIn0sImFyZ3MiOlsicnVuIiwiLWkiLCItLXJtIiwiLWUiLCJLSU5UT05FX0JBU0VfVVJMIiwiLWUiLCJLSU5UT05FX1VTRVJOQU1FIiwiLWUiLCJLSU5UT05FX1BBU1NXT1JEIiwiZ2hjci5pby9raW50b25lL21jcC1zZXJ2ZXI6bGF0ZXN0Il19)

<!--
NOTE: Cursorのインストールリンク生成は scripts/generate-cursor-install-link.js で生成している
>>>>>>> 7caf26e (docs: fix cursor deeplink)
-->

kintoneの公式ローカルMCPサーバーです。

## 利用方法

### 設定ファイル

- Claude Code (`.mcp.json`) \[[ref](https://docs.anthropic.com/ja/docs/claude-code/mcp)]
- Cursor (`.cursor/mcp.json`) \[[ref](https://docs.cursor.com/ja/context/mcp)]

```json
{
  "mcpServers": {
    "kintone": {
      "type": "stdio",
      "command": "docker",
      "args": ["run", "-it", "--rm", "ghcr.io/kintone/mcp-server"],
      "cwd": "${cwd}",
      "env": {
        "KINTONE_BASE_URL": "http://localhost",
        "KINTONE_USERNAME": "cybozu",
        "KINTONE_PASSWORD": "cybozu"
      }
    }
  }
}
```

## 実行

### Docker

```shell
docker run ghcr.io/kintone/mcp-server
```

### npm

```shell
npx @kintone/mcp-server
```

## ツール一覧

| ツール名                         | 説明                         |
| -------------------------------- | ---------------------------- |
| `kintone-get-apps`               | 複数のアプリ情報を取得       |
| `kintone-get-app`                | 単一アプリの詳細情報を取得   |
| `kintone-get-form-fields`        | アプリのフィールド設定を取得 |
| `kintone-get-process-management` | ワークフロー設定を取得       |
| `kintone-get-records`            | レコードを検索・取得         |
| `kintone-add-records`            | 新規レコードを追加           |
| `kintone-update-records`         | 既存レコードを更新           |
| `kintone-delete-records`         | レコードを削除               |
| `kintone-update-statuses`        | レコードのステータスを変更   |

## 注意事項

レコード登録更新ツールにおいて、添付ファイルフィールドは2025/08/05時点で指定できません。
また、ユーザー選択フィールド、組織選択フィールド、グループ選択フィールドは、選択肢を設定している場合のみ登録更新が可能です。

## 貢献

[Contributing Guide](CONTRIBUTING.md) を参照してください。

## License

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).
