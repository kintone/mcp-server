# Contributing Guide

## リポジトリのセットアップ

```shell
git clone git@github.com:kintone/mcp-server.git
cd mcp-server
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
