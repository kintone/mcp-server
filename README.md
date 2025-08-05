# kintone MCP Server

kintoneの公式ローカルMCPサーバーです。

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
