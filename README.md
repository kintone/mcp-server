# kintone MCP Server

[![ci][ci-badge]][ci-url]
[![npm version][npm-badge]][npm-url]
[![License: MIT][license-badge]][license-url]
[![Install MCP Server][cursor-badge]][cursor-url]

[ci-badge]: https://github.com/kintone/mcp-server/actions/workflows/ci.yaml/badge.svg
[ci-url]: https://github.com/kintone/mcp-server/actions/workflows/ci.yaml
[npm-badge]: https://badge.fury.io/js/@kintone%2Fmcp-server.svg
[npm-url]: https://badge.fury.io/js/@kintone%2Fmcp-server
[license-badge]: https://img.shields.io/badge/License-Apache_2.0-blue.svg
[license-url]: LICENSE
[cursor-badge]: https://cursor.com/deeplink/mcp-install-dark.svg
[cursor-url]: https://cursor.com/en/install-mcp?name=kintone&config=eyJjb21tYW5kIjoiZG9ja2VyIiwiZW52Ijp7IktJTlRPTkVfQkFTRV9VUkwiOiJodHRwczovLyhzdWJkb21haW4pLmN5Ym96dS5jb20iLCJLSU5UT05FX1VTRVJOQU1FIjoiKHVzZXJuYW1lKSIsIktJTlRPTkVfUEFTU1dPUkQiOiIocGFzc3dvcmQpIn0sImFyZ3MiOlsicnVuIiwiLWkiLCItLXJtIiwiLWUiLCJLSU5UT05FX0JBU0VfVVJMIiwiLWUiLCJLSU5UT05FX1VTRVJOQU1FIiwiLWUiLCJLSU5UT05FX1BBU1NXT1JEIiwiZ2hjci5pby9raW50b25lL21jcC1zZXJ2ZXI6bGF0ZXN0Il19

<!--
NOTE: Cursorのインストールリンク生成は scripts/generate-cursor-install-link.js で生成している
-->

日本語 | [English](README_en.md)

kintoneの公式ローカルMCPサーバーです。

<!-- NOTE: TOCはpnpm doc:update-tocで自動生成されます。 -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [インストール](#%E3%82%A4%E3%83%B3%E3%82%B9%E3%83%88%E3%83%BC%E3%83%AB)
  - [DXT (Claude Desktop用パッケージ)](#dxt-claude-desktop%E7%94%A8%E3%83%91%E3%83%83%E3%82%B1%E3%83%BC%E3%82%B8)
  - [Dockerコンテナイメージ](#docker%E3%82%B3%E3%83%B3%E3%83%86%E3%83%8A%E3%82%A4%E3%83%A1%E3%83%BC%E3%82%B8)
  - [npmパッケージ](#npm%E3%83%91%E3%83%83%E3%82%B1%E3%83%BC%E3%82%B8)
- [利用方法](#%E5%88%A9%E7%94%A8%E6%96%B9%E6%B3%95)
  - [設定ファイルのパスの例](#%E8%A8%AD%E5%AE%9A%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E3%83%91%E3%82%B9%E3%81%AE%E4%BE%8B)
  - [設定ファイルの内容の例](#%E8%A8%AD%E5%AE%9A%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E5%86%85%E5%AE%B9%E3%81%AE%E4%BE%8B)
- [ツール一覧](#%E3%83%84%E3%83%BC%E3%83%AB%E4%B8%80%E8%A6%A7)
- [注意事項](#%E6%B3%A8%E6%84%8F%E4%BA%8B%E9%A0%85)
- [サポート方針](#%E3%82%B5%E3%83%9D%E3%83%BC%E3%83%88%E6%96%B9%E9%87%9D)
- [コントリビューション](#%E3%82%B3%E3%83%B3%E3%83%88%E3%83%AA%E3%83%93%E3%83%A5%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3)
- [ライセンス](#%E3%83%A9%E3%82%A4%E3%82%BB%E3%83%B3%E3%82%B9)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## インストール

### DXT (Claude Desktop用パッケージ)

DXTファイルは、Claude Desktopの拡張機能としてインストールできます。

以下の手順でインストールしてください。

1. [リリース一覧](https://github.com/kintone/mcp-server/releases) にアクセス
2. 最新のリリースから `kintone-mcp-server.dxt` をダウンロード
3. Claude Desktopを開く
4. 設定から「デスクトップアプリ」→「拡張機能」のページを開く
5. ダウンロードした `kintone-mcp-server.dxt` をClaude Desktopの画面にドラッグ＆ドロップ
6. インストール確認ダイアログが表示されるので「インストール」を選択
7. 設定ダイアログが表示されるので、必要な情報を入力する
   - `Kintone Base URL`: kintoneのベースURL (例: `https://example.cybozu.com`)
   - `Kintone Username`: kintoneのユーザー名
   - `Kintone Password`: kintoneのパスワード

### Dockerコンテナイメージ

[Docker](https://www.docker.com/)のインストールが必要です。

以下のコマンドでコンテナを起動できます。

```shell
docker run -i --rm ghcr.io/kintone/mcp-server \
  -e KINTONE_BASE_URL=https://example.cybozu.com \
  -e KINTONE_USERNAME=(username) \
  -e KINTONE_PASSWORD=(password)
```

### npmパッケージ

[Node.js](https://nodejs.org/)のインストールが必要です。

以下のコマンドでインストールできます。

```shell
npm install -g @kintone/mcp-server
```

以下のコマンドでサーバーを起動できます。

```shell
kintone-mcp-server \
  --kintone-base-url https://example.cybozu.com \
  --kintone-username (username) \
  --kintone-password (password)

# `--kintone-base-url`、`--kintone-username`、`--kintone-password` は
# 環境変数 `KINTONE_BASE_URL`、`KINTONE_USERNAME`、`KINTONE_PASSWORD` でも指定可能です。
```

## 利用方法

DXTファイルをインストールした場合、追加の手順は必要ありません。

その他の利用方法では、設定ファイルを作成する必要があります。
設定ファイルの作成方法の詳細は、利用するAIツールのドキュメントを参照してください。

### 設定ファイルのパスの例

- Claude Code: `.mcp.json` \[[ref](https://docs.anthropic.com/ja/docs/claude-code/mcp)]
- Cursor: `.cursor/mcp.json` \[[ref](https://docs.cursor.com/ja/context/mcp)]

### 設定ファイルの内容の例

```json
{
  "mcpServers": {
    "kintone": {
      "type": "stdio",
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "KINTONE_BASE_URL",
        "-e",
        "KINTONE_USERNAME",
        "-e",
        "KINTONE_PASSWORD",
        "ghcr.io/kintone/mcp-server:latest"
      ],
      "cwd": "${cwd}",
      "env": {
        "KINTONE_BASE_URL": "https://example.cybozu.com",
        "KINTONE_USERNAME": "username",
        "KINTONE_PASSWORD": "password"
      }
    }
  }
}
```

## ツール一覧

| ツール名                         | 説明                         |
| -------------------------------- | ---------------------------- |
| `kintone-get-apps`               | 複数のアプリ情報を取得       |
| `kintone-get-app`                | 単一アプリの詳細情報を取得   |
| `kintone-get-form-fields`        | アプリのフィールド設定を取得 |
| `kintone-get-process-management` | プロセス管理設定を取得       |
| `kintone-get-records`            | レコードを検索・取得         |
| `kintone-add-records`            | 新規レコードを追加           |
| `kintone-update-records`         | 既存レコードを更新           |
| `kintone-delete-records`         | レコードを削除               |
| `kintone-update-statuses`        | レコードのステータスを変更   |

## 注意事項

レコード登録更新ツールにおいて、添付ファイルフィールドは2025/08/05時点で指定できません。
また、ユーザー選択フィールド、組織選択フィールド、グループ選択フィールドは、選択肢を設定している場合のみ登録更新が可能です。

## サポート方針

kintoneローカルMCPサーバーは、APIサポート窓口の対象外です。

バグ報告・機能要望は[Issues](https://github.com/kintone/mcp-server/issues/new/choose)から登録をお願いします。

## コントリビューション

[Contributing Guide](CONTRIBUTING.md) を参照してください。

## ライセンス

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).
