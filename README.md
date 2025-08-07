# kintone MCP Server

kintoneの公式ローカルMCPサーバーです。

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=kintone&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMmRvY2tlciUyMHJ1biUyMC1pdCUyMC0tcm0lMjBnaGNyLmlvJTJGa2ludG9uZSUyRm1jcC1zZXJ2ZXIlMjIlN0Q%3D)

<!--

Cursorのインストール用Deep Linkは以下のJSONから生成している

{
  "kintone": {
    "command": "docker",
    "args": ["run", "-it", "--rm", "ghcr.io/kintone/mcp-server:latest"]
  }
}

作成方法は以下を参照
https://docs.cursor.com/ja/tools/developers

-->

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

## 注意事項

レコード登録更新ツールにおいて、添付ファイルフィールドは2025/08/05時点で指定できません。
また、ユーザー選択フィールド、組織選択フィールド、グループ選択フィールドは、選択肢を設定している場合のみ登録更新が可能です。

## License

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).
