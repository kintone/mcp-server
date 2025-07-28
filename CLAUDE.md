# CLAUDE.md

## プロジェクト固有の開発ルール

### 新しいツールの追加
1. `src/tools/`にファイル作成
2. `createTool`関数で定義
3. `src/tools/index.ts`のtools配列に追加

### Kintoneツール開発
```typescript
const config = parseKintoneClientConfig();
const client = getKintoneClient(config);
```

### テスト作成時の注意点
- `mockExtra`ユーティリティを使用
- KintoneRestAPIClientは直接モック：
```typescript
vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { getApp: mockGetApp },
  })),
}));
```

## コミット・PR規約
- **コミットメッセージ**: Semantic Commit Messages形式
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント更新
  - `refactor:` リファクタリング
  - `test:` テスト追加/修正
  - `chore:` ビルドプロセス/ツール変更
- **PRタイトル**: 同様にSemantic形式で記述
