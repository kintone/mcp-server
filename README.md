# kintone MCP Server

[![ci][ci-badge]][ci-url]
[![npm version][npm-badge]][npm-url]
[![License: MIT][license-badge]][license-url]
[![Install MCP Server][cursor-badge]][cursor-url]

[ci-badge]: https://github.com/kintone/mcp-server/actions/workflows/ci.yaml/badge.svg
[ci-url]: https://github.com/kintone/mcp-server/actions/workflows/ci.yaml
[npm-badge]: https://badge.fury.io/js/@kintone%2Fmcp-server.svg
[npm-url]: https://badge.fury.io/js/@kintone%2Fmcp-server
[license-badge]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: LICENSE
[cursor-badge]: https://cursor.com/deeplink/mcp-install-dark.svg
[cursor-url]: https://cursor.com/en/install-mcp?name=kintone&config=eyJjb21tYW5kIjoiZG9ja2VyIiwiZW52Ijp7IktJTlRPTkVfQkFTRV9VUkwiOiJodHRwczovLyhzdWJkb21haW4pLmN5Ym96dS5jb20iLCJLSU5UT05FX1VTRVJOQU1FIjoiKHVzZXJuYW1lKSIsIktJTlRPTkVfUEFTU1dPUkQiOiIocGFzc3dvcmQpIn0sImFyZ3MiOlsicnVuIiwiLWkiLCItLXJtIiwiLWUiLCJLSU5UT05FX0JBU0VfVVJMIiwiLWUiLCJLSU5UT05FX1VTRVJOQU1FIiwiLWUiLCJLSU5UT05FX1BBU1NXT1JEIiwiZ2hjci5pby9raW50b25lL21jcC1zZXJ2ZXI6bGF0ZXN0Il19

<!--
NOTE: Cursorのインストールリンク生成は scripts/generate-cursor-install-link.js で生成している
>>>>>>> 7caf26e (docs: fix cursor deeplink)
-->

日本語 | [English](README_en.md)

kintoneの公式ローカルMCPサーバーです。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [利用方法](#%E5%88%A9%E7%94%A8%E6%96%B9%E6%B3%95)
  - [設定ファイル](#%E8%A8%AD%E5%AE%9A%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB)
- [実行](#%E5%AE%9F%E8%A1%8C)
  - [Docker](#docker)
  - [npm](#npm)
- [ツール一覧](#%E3%83%84%E3%83%BC%E3%83%AB%E4%B8%80%E8%A6%A7)
- [注意事項](#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85)
- [コントリビューション](#%E3%82%B3%E3%83%B3%E3%83%88%E3%83%AA%E3%83%93%E3%83%A5%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3)
- [ライセンス](#%E3%83%A9%E3%82%A4%E3%82%BB%E3%83%B3%E3%82%B9)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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

## コントリビューション

[Contributing Guide](CONTRIBUTING.md) を参照してください。

## ライセンス

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).
