# Contributing Guide

## Required

- [mise](https://mise.jdx.dev/)

## 開発環境

以下のいずれかの方法で開発環境をセットアップできます。

### Dev Containerを使った開発（推奨）

#### 前提条件

詳細は [kintone/dev-container](https://github.com/kintone/dev-container) を参照してください。

#### セットアップ手順

1. **リポジトリのクローン**（submoduleを含む）

   ```shell
   git clone --recurse-submodules git@github.com:kintone/mcp-server.git
   ```

   既存のリポジトリの場合：

   ```shell
   git submodule update --init --recursive
   ```

2. **Dev Containerの起動**

   VS Code のコマンドパレットから「Dev Containers: Reopen in Container」を実行

### ローカル環境でのセットアップ

```shell
git clone --recurse-submodules git@github.com:kintone/mcp-server.git
cd mcp-server
mise install
pnpm install
```

## MCPサーバー起動

```shell
pnpm dev
```

## ビルド

npmパッケージ

```shell
pnpm build
```

Dockerコンテナイメージ

```shell
docker build -f ./docker/Dockerfile .
```

DXTファイル

```shell
pnpm build:dxt
```

## テスト

```shell
pnpm test
```

## コミットメッセージとPRの規約

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/)に従ってください。

フォーマット: `<type>: <description>`

#### サポートされているコミットタイプ

| Type     | 説明                 |
| -------- | -------------------- |
| feat     | 新機能               |
| fix      | バグ修正             |
| test     | テストの更新         |
| build    | ビルドプロセスの変更 |
| ci       | CIワークフローの変更 |
| docs     | ドキュメントの更新   |
| perf     | パフォーマンスの改善 |
| refactor | リファクタリング     |
| revert   | 過去の変更の取り消し |
| lint     | Lintの更新           |
| style    | スタイルの更新       |
| debug    | デバッグ             |
| chore    | その他の変更         |

#### 破壊的変更

破壊的変更がある場合：

- スコープの後に`!`を追加する
- フッターに`BREAKING CHANGE: <description>`を含める

### プルリクエスト（PR）タイトル

PRタイトルも[コミットメッセージ](#コミットメッセージ)と同様に[Conventional Commits](https://www.conventionalcommits.org/ja/)の形式に従ってください。

Conventional Commitsをもとに [release-please](https://github.com/googleapis/release-please)によってリリース時に適切なバージョン番号が自動的に決定され、CHANGELOGが自動生成されます。

### バージョニング

[Semantic Versioning](https://semver.org/)に従います。
