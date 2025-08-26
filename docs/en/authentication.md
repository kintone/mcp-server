# Authentication Configuration

The Kintone MCP Server provides multiple authentication methods. Configure the appropriate authentication method using environment variables.

**Configuration Priority:**

- Authentication methods: When password authentication and API token authentication are specified simultaneously, password authentication takes priority
- Configuration values: When both command-line arguments and environment variables are specified, command-line arguments take priority

## Authentication Methods

### 1. Password Authentication

Authenticate using Kintone login credentials.

| Command-line Argument | Environment Variable | Description            | Required |
| --------------------- | -------------------- | ---------------------- | -------- |
| `--username`          | `KINTONE_USERNAME`   | Kintone login username | ✓        |
| `--password`          | `KINTONE_PASSWORD`   | Kintone login password | ✓        |

**Configuration Example:**

Environment variables:

```bash
export KINTONE_BASE_URL="https://example.cybozu.com"
export KINTONE_USERNAME="user@example.com"
export KINTONE_PASSWORD="your-password"
```

Command-line arguments:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --username="user@example.com" \
  --password="your-password"
```

### 2. API Token Authentication

Authenticate using API tokens issued per application.

| Command-line Argument | Environment Variable | Description                               | Required |
| --------------------- | -------------------- | ----------------------------------------- | -------- |
| `--api-token`         | `KINTONE_API_TOKEN`  | API token (comma-separated, max 9 tokens) | ✓        |

**Configuration Example:**

Environment variables:

```bash
export KINTONE_BASE_URL="https://example.cybozu.com"
export KINTONE_API_TOKEN="token1,token2,token3"
```

Command-line arguments:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --api-token="token1,token2,token3"
```

**Notes:**

- API tokens must consist of alphanumeric characters only
- Multiple API tokens can be specified separated by commas
- Maximum of 9 tokens can be specified

### 3. Basic Authentication (Additional Authentication)

Use when Basic authentication is configured in your Kintone environment. Must be configured in conjunction with one of the above authentication methods.

| Command-line Argument   | Environment Variable          | Description                   | Required              |
| ----------------------- | ----------------------------- | ----------------------------- | --------------------- |
| `--basic-auth-username` | `KINTONE_BASIC_AUTH_USERNAME` | Basic authentication username | When using Basic auth |
| `--basic-auth-password` | `KINTONE_BASIC_AUTH_PASSWORD` | Basic authentication password | When using Basic auth |

**Configuration Example:**

Environment variables:

```bash
# API Token Authentication + Basic Authentication
export KINTONE_BASE_URL="https://example.cybozu.com"
export KINTONE_API_TOKEN="your-api-token"
export KINTONE_BASIC_AUTH_USERNAME="basic-user"
export KINTONE_BASIC_AUTH_PASSWORD="basic-password"
```

Command-line arguments:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --api-token="your-api-token" \
  --basic-auth-username="basic-user" \
  --basic-auth-password="basic-password"
```

### 4. Client Certificate Authentication

Authenticate using a client certificate in PFX format. When using client certificate authentication, you must use the secure access URL.

| Command-line Argument | Environment Variable        | Description       | Required                    |
| --------------------- | --------------------------- | ----------------- | --------------------------- |
| `--pfx-file-path`     | `KINTONE_PFX_FILE_PATH`     | Path to PFX file  | When using certificate auth |
| `--pfx-file-password` | `KINTONE_PFX_FILE_PASSWORD` | PFX file password | When using certificate auth |

**Configuration Example:**

Environment variables:

```bash
# API Token Authentication + Client Certificate
# Note: Use .s.cybozu.com domain for client certificate authentication
export KINTONE_BASE_URL="https://example.s.cybozu.com"
export KINTONE_API_TOKEN="your-api-token"
export KINTONE_PFX_FILE_PATH="/path/to/certificate.pfx"
export KINTONE_PFX_FILE_PASSWORD="certificate-password"
```

Command-line arguments:

```bash
kintone-mcp-server \
  --base-url="https://example.s.cybozu.com" \
  --api-token="your-api-token" \
  --pfx-file-path="/path/to/certificate.pfx" \
  --pfx-file-password="certificate-password"
```

**Notes:**

- When using client certificate authentication, the URL domain must be `.s.cybozu.com` (e.g., `https://example.s.cybozu.com`)
- Client certificate authentication cannot be used with the regular `.cybozu.com` domain

## Network Configuration

### Proxy Configuration

Use when you need to connect through a proxy server in corporate environments.

| Command-line Argument | Environment Variable | Description      | Required |
| --------------------- | -------------------- | ---------------- | -------- |
| `--proxy`             | `HTTPS_PROXY`        | Proxy server URL | -        |

**Configuration Example:**

Environment variables:

```bash
export HTTPS_PROXY="http://proxy.example.com:8080"

# If authentication is required
export HTTPS_PROXY="http://username:password@proxy.example.com:8080"
```

Command-line arguments:

```bash
kintone-mcp-server \
  --base-url="https://example.cybozu.com" \
  --api-token="your-api-token" \
  --proxy="http://proxy.example.com:8080"
```

## Troubleshooting

### Common Errors

**Error: "Either KINTONE_USERNAME/KINTONE_PASSWORD or KINTONE_API_TOKEN must be provided"**

- Cause: Authentication credentials not configured
- Solution: Configure either username & password or API token

**Error: "Both KINTONE_PFX_FILE_PATH and KINTONE_PFX_FILE_PASSWORD must be provided together"**

- Cause: Only one of the client certificate path or password is configured
- Solution: Configure both environment variables or remove both

**Error: "API tokens must be comma-separated alphanumeric strings (max 9 tokens)"**

- Cause: Invalid API token format
- Solution: Use tokens consisting only of alphanumeric characters and limit to 9 or fewer

## Related Documentation

- [How to Issue Kintone API Tokens](https://jp.cybozu.help/k/en/app/api/api_token.html)
