# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## よく使うコマンド

### 開発環境の起動

```bash
# 開発サーバーの起動（ファイル変更の自動検知付き）
pnpm dev

# ビルドの実行（dist/に出力）
pnpm build

# ビルドされたコードの実行
pnpm start
```

### コード品質チェック

```bash
# すべてのリントチェックを実行
pnpm lint

# ESLintチェック
pnpm lint:eslint

# Prettierチェック
pnpm lint:prettier

# TypeScriptの型チェック
pnpm typecheck
```

### コード修正

```bash
# すべての自動修正を実行
pnpm fix

# ESLintの自動修正
pnpm fix:eslint

# Prettierの自動修正
pnpm fix:prettier
```

### テスト

```bash
# すべてのテストを実行
pnpm test

# 特定のテストファイルを実行
pnpm test src/tools/kintone/__tests__/get-app.test.ts

# テストをwatchモードで実行
pnpm test:watch

# カバレッジレポート付きでテストを実行
pnpm test:coverage
```

### ライセンス管理

```bash
# ライセンスの分析
pnpm license:analyze
```

### Docker環境での実行

```bash
# Dockerイメージのビルドと実行
docker compose up

# 公開されているDockerイメージの実行
docker run ghcr.io/kintone/mcp-server
```

## コードのアーキテクチャと構造

### プロジェクト構造

```
kintone-mcp-server/
├── src/
│   ├── index.ts              # エントリーポイント（STDIOトランスポートを使用）
│   ├── server.ts             # MCPサーバーの設定とツール登録
│   ├── config.ts             # 環境変数の検証とKintone設定
│   ├── client.ts             # KintoneRestAPIClientのシングルトン実装
│   └── tools/
│       ├── index.ts          # ツールのエクスポート
│       ├── types.ts          # ツールの型定義とヘルパー関数
│       ├── examples/
│       │   └── add.ts        # サンプルツール（数値の加算）
│       └── kintone/
│           └── get-app.ts    # Kintoneアプリ情報取得ツール
├── dist/                     # TypeScriptビルド出力（gitignored）
├── docker/
│   └── Dockerfile            # 本番用Dockerイメージの定義
├── compose.yaml              # 開発用Docker Compose設定
└── package.json              # プロジェクト設定とスクリプト
```

### 主要な技術スタック

- **TypeScript**: ES2024ターゲット、Node16モジュール解決
- **MCP SDK**: Model Context Protocol SDKを使用したサーバー実装
- **Kintone REST API Client**: `@kintone/rest-api-client`でKintoneとの通信
- **Zod**: スキーマ検証とバリデーション
- **Vitest**: 高速なテストフレームワーク
- **ESLint & Prettier**: Cybozuの設定を使用したコード品質管理
- **Docker**: distrolessイメージを使用した本番環境

### アーキテクチャの特徴

1. **MCPサーバー実装**
   - `@modelcontextprotocol/sdk`を使用してMCPサーバーを実装
   - STDIOトランスポートを使用した通信
   - ツールの動的登録システム

2. **ツールシステム**
   - 各ツールは独立したモジュールとして実装
   - `Tool`型を使用した型安全な実装
   - Zodスキーマによる入出力の検証
   - `createTool`ヘルパー関数でツールを簡単に作成可能

3. **Kintone統合**
   - 環境変数による認証情報の管理（KINTONE_BASE_URL, KINTONE_USERNAME, KINTONE_PASSWORD）
   - シングルトンパターンでクライアント管理
   - Zodによる環境変数の検証

4. **開発環境**
   - `tsx --watch`によるホットリロード対応
   - Docker Composeによる開発環境の分離
   - 包括的なテストスイート

## 重要な設定ファイル

### TypeScript設定（tsconfig.json）

- **ターゲット**: ES2024
- **モジュール**: node16
- **厳格モード**: 有効（strict: true）
- **出力ディレクトリ**: ./dist
- **除外**: テストファイル、node_modules、dist
- **その他のフラグ**:
  - `verbatimModuleSyntax`: true
  - `erasableSyntaxOnly`: true
  - `esModuleInterop`: true
  - `forceConsistentCasingInFileNames`: true

### ESLint設定（eslint.config.js）

- Cybozuのプリセット（`@cybozu/eslint-config`）を使用
- Node.js向けTypeScript + Prettier設定
- `@typescript-eslint/consistent-type-imports`ルールを強制
- package.jsonのリントも含む

### パッケージ管理

- **pnpm**: v10.13.1を使用
- **Node.js**: v22以上が必要
- **プライベートパッケージ**: 公開されない設定

## 開発のポイント

### 新しいツールの追加

1. `src/tools/`ディレクトリに新しいツールファイルを作成
2. `createTool`関数を使用してツールを定義
   ```typescript
   export const myTool = createTool(
     "tool-name",
     {
       description: "ツールの説明",
       inputSchema: {
         /* Zodスキーマ */
       },
       outputSchema: {
         /* Zodスキーマ */
       },
     },
     async (input) => {
       // 実装
       return {
         structuredContent: result,
         content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
       };
     },
   );
   ```
3. `src/tools/index.ts`のtools配列にエクスポートを追加

### Kintoneツールの追加

1. `src/tools/kintone/`ディレクトリに新しいツールファイルを作成
2. 環境変数の設定を使用してKintoneクライアントを取得
   ```typescript
   const config = parseKintoneClientConfig();
   const client = getKintoneClient(config);
   ```
3. 既存のget-app.tsを参考に実装

### テストの作成

- テストファイルは`__tests__`ディレクトリに配置
- `mockExtra`ユーティリティを使用してツールのテストを作成
- Vitestのモック機能を使用して外部依存をモック化

### 型安全性

- Zodスキーマを使用して入出力を定義
- TypeScriptの厳格モードが有効なので、型安全性が保証される
- すべてのインポートで`.js`拡張子を使用（ESMの要件）

### コード品質

- コミット前に`pnpm lint`でチェック
- 自動修正可能な問題は`pnpm fix`で解決
- テストが通ることを確認（`pnpm test`）

### Docker環境

- 開発時は`compose.yaml`を使用
- 本番環境はdistrolessイメージで最小限の実行環境
- ビルドは多段階ビルドで最適化

## 現在の実装状況

### 実装済みのツール

1. **add_numbers** (examples/add.ts): 2つの数値を加算するサンプルツール
2. **kintone-get-app** (kintone/get-app.ts): Kintoneアプリの情報を取得

### インフラストラクチャ

- MCPサーバーのセットアップ完了
- ツール登録システム実装済み
- Kintone APIクライアント統合済み
- 環境変数による設定管理
- 包括的なテストフレームワーク
- Dockerコンテナ化

## README.mdの内容

kintoneの公式ローカルMCPサーバーです。

### 実行方法

- **Docker**: `docker run ghcr.io/kintone/mcp-server`
- **npm**: `npx @kintone/mcp-server`
