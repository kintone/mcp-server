# 認証設定

kintone MCP Serverでは、複数の認証方法をサポートしています。環境変数を使用して、適切な認証方法を設定してください。

**設定の優先順位:**

ユーザー名/パスワード認証とAPIトークン認証を同時に指定した場合、ユーザー名/パスワード認証が優先されます

## 認証方法

### 1. ユーザー名・パスワード認証

kintoneのログイン情報を使用して認証を行います。

| 環境変数           | コマンドライン引数 | 説明                        | 必須 |
| ------------------ | ------------------ | --------------------------- | ---- |
| `KINTONE_USERNAME` | `--username`       | kintoneのログインユーザー名 | ✓    |
| `KINTONE_PASSWORD` | `--password`       | kintoneのログインパスワード | ✓    |

**設定例:**

環境変数:

```bash
export KINTONE_BASE_URL="https://example.cybozu.com"
export KINTONE_USERNAME="user@example.com"
export KINTONE_PASSWORD="your-password"
```

コマンドライン引数:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --username="user@example.com" \
  --password="your-password"
```

### 2. APIトークン認証

アプリごとに発行されるAPIトークンを使用して認証を行います。

| 環境変数            | コマンドライン引数 | 説明                                             | 必須 |
| ------------------- | ------------------ | ------------------------------------------------ | ---- |
| `KINTONE_API_TOKEN` | `--api-token`      | APIトークン（カンマ区切りで最大9個まで指定可能） | ✓    |

**設定例:**

環境変数:

```bash
export KINTONE_BASE_URL="https://example.cybozu.com"
export KINTONE_API_TOKEN="token1,token2,token3"
```

コマンドライン引数:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --api-token="token1,token2,token3"
```

**注意事項:**

- APIトークンは英数字のみで構成される必要があります
- 複数のAPIトークンを使用する場合は、カンマで区切って指定します
- 最大9個までのトークンを指定できます

### 3. Basic認証（追加認証）

kintone環境でBasic認証が設定されている場合に使用します。上記の認証方法と併用して設定する必要があります。

| 環境変数                      | コマンドライン引数      | 説明                  | 必須            |
| ----------------------------- | ----------------------- | --------------------- | --------------- |
| `KINTONE_BASIC_AUTH_USERNAME` | `--basic-auth-username` | Basic認証のユーザー名 | Basic認証使用時 |
| `KINTONE_BASIC_AUTH_PASSWORD` | `--basic-auth-password` | Basic認証のパスワード | Basic認証使用時 |

**設定例:**

環境変数:

```bash
# APIトークン認証 + Basic認証
export KINTONE_BASE_URL="https://example.cybozu.com"
export KINTONE_API_TOKEN="your-api-token"
export KINTONE_BASIC_AUTH_USERNAME="basic-user"
export KINTONE_BASIC_AUTH_PASSWORD="basic-password"
```

コマンドライン引数:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --api-token="your-api-token" \
  --basic-auth-username="basic-user" \
  --basic-auth-password="basic-password"
```

### 4. クライアント証明書認証

PFX形式のクライアント証明書を使用した認証を行います。クライアント証明書認証を使用する場合は、セキュアアクセス用のURLを使用する必要があります。

| 環境変数                    | コマンドライン引数    | 説明                    | 必須             |
| --------------------------- | --------------------- | ----------------------- | ---------------- |
| `KINTONE_PFX_FILE_PATH`     | `--pfx-file-path`     | PFXファイルのパス       | 証明書認証使用時 |
| `KINTONE_PFX_FILE_PASSWORD` | `--pfx-file-password` | PFXファイルのパスワード | 証明書認証使用時 |

**設定例:**

環境変数:

```bash
# APIトークン認証 + クライアント証明書
# 注意: クライアント証明書認証の場合は .s.cybozu.com ドメインを使用
export KINTONE_BASE_URL="https://example.s.cybozu.com"
export KINTONE_API_TOKEN="your-api-token"
export KINTONE_PFX_FILE_PATH="/path/to/certificate.pfx"
export KINTONE_PFX_FILE_PASSWORD="certificate-password"
```

コマンドライン引数:

```bash
kintone-mcp-server \
  --base-url="https://example.s.cybozu.com" \
  --api-token="your-api-token" \
  --pfx-file-path="/path/to/certificate.pfx" \
  --pfx-file-password="certificate-password"
```

**注意事項:**

- クライアント証明書認証を使用する場合、URLのドメインは `.s.cybozu.com` となります（例: `https://example.s.cybozu.com`）
- 通常のドメイン `.cybozu.com` ではクライアント証明書認証は使用できません

## ネットワーク設定

### プロキシ設定

企業環境などでプロキシサーバーを経由する必要がある場合に使用します。

| 環境変数      | コマンドライン引数 | 説明                  | 必須 |
| ------------- | ------------------ | --------------------- | ---- |
| `HTTPS_PROXY` | `--proxy`          | プロキシサーバーのURL | -    |

**設定例:**

環境変数:

```bash
export HTTPS_PROXY="http://proxy.example.com:8080"

# 認証が必要な場合
export HTTPS_PROXY="http://username:password@proxy.example.com:8080"
```

コマンドライン引数:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --api-token="your-api-token" \
  --proxy="http://proxy.example.com:8080"
```

## トラブルシューティング

### よくあるエラー

**エラー: "Either KINTONE_USERNAME/KINTONE_PASSWORD or KINTONE_API_TOKEN must be provided"**

- 原因：認証情報が設定されていない
- 解決策：ユーザー名・パスワードまたはAPIトークンのいずれかを設定する

**エラー: "Both KINTONE_PFX_FILE_PATH and KINTONE_PFX_FILE_PASSWORD must be provided together"**

- 原因：クライアント証明書のパスとパスワードの片方のみが設定されている
- 解決策：両方の環境変数を設定するか、両方とも削除する

**エラー: "API tokens must be comma-separated alphanumeric strings (max 9 tokens)"**

- 原因：APIトークンの形式が不正
- 解決策：英数字のみで構成されたトークンを使用し、9個以下に制限する

## 関連ドキュメント

- [kintone APIトークンの発行方法](https://jp.cybozu.help/k/ja/app/api/api_token.html)
