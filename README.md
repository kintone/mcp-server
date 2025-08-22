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
- [設定](#%E8%A8%AD%E5%AE%9A)
  - [設定オプション一覧](#%E8%A8%AD%E5%AE%9A%E3%82%AA%E3%83%97%E3%82%B7%E3%83%A7%E3%83%B3%E4%B8%80%E8%A6%A7)
  - [プロキシ設定](#%E3%83%97%E3%83%AD%E3%82%AD%E3%82%B7%E8%A8%AD%E5%AE%9A)
- [ツール一覧](#%E3%83%84%E3%83%BC%E3%83%AB%E4%B8%80%E8%A6%A7)
- [ドキュメント](#%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%B3%E3%83%88)
- [制限事項](#%E5%88%B6%E9%99%90%E4%BA%8B%E9%A0%85)
  - [レコード操作の制限](#%E3%83%AC%E3%82%B3%E3%83%BC%E3%83%89%E6%93%8D%E4%BD%9C%E3%81%AE%E5%88%B6%E9%99%90)
  - [機能制限](#%E6%A9%9F%E8%83%BD%E5%88%B6%E9%99%90)
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
docker run -i --rm \
  -e KINTONE_BASE_URL=https://example.cybozu.com \
  -e KINTONE_USERNAME=(username) \
  -e KINTONE_PASSWORD=(password) \
  ghcr.io/kintone/mcp-server
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

## 設定

### 設定オプション一覧

| 環境変数                      | コマンドライン引数      | 説明                                                       | 必須 |
| ----------------------------- | ----------------------- | ---------------------------------------------------------- | ---- |
| `KINTONE_BASE_URL`            | `--base-url`            | kintone環境のベースURL（例: `https://example.cybozu.com`） | ✓    |
| `KINTONE_USERNAME`            | `--username`            | kintoneのログインユーザー名                                | ※1   |
| `KINTONE_PASSWORD`            | `--password`            | kintoneのログインパスワード                                | ※1   |
| `KINTONE_API_TOKEN`           | `--api-token`           | APIトークン（カンマ区切りで最大9個まで指定可能）           | ※1   |
| `KINTONE_BASIC_AUTH_USERNAME` | `--basic-auth-username` | Basic認証のユーザー名                                      | -    |
| `KINTONE_BASIC_AUTH_PASSWORD` | `--basic-auth-password` | Basic認証のパスワード                                      | -    |
| `KINTONE_PFX_FILE_PATH`       | `--pfx-file-path`       | PFXファイルのパス（クライアント証明書認証用）              | -    |
| `KINTONE_PFX_FILE_PASSWORD`   | `--pfx-file-password`   | PFXファイルのパスワード                                    | -    |
| `HTTPS_PROXY`                 | `--proxy`               | HTTPSプロキシのURL（例: `http://proxy.example.com:8080`）  | -    |

※1: `KINTONE_USERNAME`/`KINTONE_PASSWORD` または `KINTONE_API_TOKEN` のいずれかが必須

**注意事項:**

- クライアント証明書認証を使用する場合、URLのドメインは `.s.cybozu.com` となります（例: `https://example.s.cybozu.com`）
- ユーザー名/パスワード認証とAPIトークン認証を同時に指定した場合、ユーザー名/パスワード認証が優先されます
- コマンドライン引数と環境変数を同時に指定した場合、コマンドライン引数が優先されます
- 詳細な認証設定については [認証設定ガイド](./docs/ja/authentication.md) を参照してください

### プロキシ設定

企業環境などでプロキシサーバーを経由する必要がある場合は、`HTTPS_PROXY` 環境変数を設定してください。

```bash
export HTTPS_PROXY="http://proxy.example.com:8080"

# 認証が必要な場合
export HTTPS_PROXY="http://username:password@proxy.example.com:8080"
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

## ドキュメント

- [認証設定ガイド](./docs/ja/authentication.md) - 認証方法の詳細と設定例

## 制限事項

### レコード操作の制限

- **添付ファイルフィールド**: レコード登録更新ツールにおいて、添付ファイルフィールドは指定できません
- **選択フィールド**: ユーザー選択フィールド、組織選択フィールド、グループ選択フィールドは、選択肢を設定している場合のみ登録更新が可能です

### 機能制限

- **ゲストスペースに非対応**: ゲストスペース内のアプリにはアクセスできません
- **プレビューに非対応**: アプリのプレビュー機能は利用できません

## サポート方針

kintoneローカルMCPサーバーは、APIサポート窓口の対象外です。

バグ報告・機能要望は[Issues](https://github.com/kintone/mcp-server/issues/new/choose)から登録をお願いします。

## コントリビューション

[Contributing Guide](CONTRIBUTING.md) を参照してください。

## ライセンス

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).
