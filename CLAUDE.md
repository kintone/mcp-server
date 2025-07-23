# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## よく使うコマンド

### 開発環境の起動

```bash
# 開発サーバーの起動（ファイル変更の自動検知付き）
pnpm dev

# 通常のサーバー起動
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
# テストの実行（現在はno test specifiedと表示される）
pnpm test
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
│   └── tools/
│       ├── index.ts          # ツールのエクスポート
│       ├── types.ts          # ツールの型定義とヘルパー関数
│       └── examples/
│           └── add.ts        # サンプルツール（数値の加算）
├── docker/
│   └── Dockerfile            # 本番用Dockerイメージの定義
├── compose.yaml              # 開発用Docker Compose設定
└── package.json              # プロジェクト設定とスクリプト
```

### 主要な技術スタック

- **TypeScript**: ES2024ターゲット、Node16モジュール解決
- **MCP SDK**: Model Context Protocol SDKを使用したサーバー実装
- **Zod**: スキーマ検証とバリデーション
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

3. **開発環境**
   - `--watch`オプションによるホットリロード対応
   - `--experimental-strip-types`によるTypeScriptの直接実行
   - Docker Composeによる開発環境の分離

## README.mdの内容

kintoneの公式ローカルMCPサーバーです。

### 実行方法

- **Docker**: `docker run ghcr.io/kintone/mcp-server`
- **npm**: `npx @kintone/mcp-server`

## 重要な設定ファイル

### TypeScript設定（tsconfig.json）

- **ターゲット**: ES2024
- **モジュール**: node16
- **厳格モード**: 有効（strict: true）
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

1. **新しいツールの追加**
   - `src/tools/`ディレクトリに新しいツールファイルを作成
   - `createTool`関数を使用してツールを定義
   - `src/tools/index.ts`のtools配列にエクスポート

2. **型安全性**
   - Zodスキーマを使用して入出力を定義
   - TypeScriptの厳格モードが有効なので、型安全性が保証される

3. **コード品質**
   - コミット前に`pnpm lint`でチェック
   - 自動修正可能な問題は`pnpm fix`で解決

4. **Docker環境**
   - 開発時は`compose.yaml`を使用
   - 本番環境はdistrolessイメージで最小限の実行環境

## 注意事項

- `src/tools/examples/add.ts`で`getConfig`をインポートしているが、`config.js`ファイルが存在しないため、この部分は修正が必要かもしれません
- テストは現在実装されていません（`pnpm test`は"no test specified"を返します）
- kintone REST APIクライアント（`@kintone/rest-api-client`）は依存関係に含まれていますが、まだ使用されていません
