# Kintone MCP Server

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

[日本語](README.md) | English

The official local MCP server for Kintone.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Kintone MCP Server](#kintone-mcp-server)
  - [Installation](#installation)
    - [DXT (Claude Desktop Package)](#dxt-claude-desktop-package)
    - [Docker Container Image](#docker-container-image)
      - [Prerequisites](#prerequisites)
      - [Run Image](#run-image)
    - [npm Package](#npm-package)
      - [Prerequisites](#prerequisites-1)
      - [Install Package](#install-package)
      - [Run Server](#run-server)
  - [Usage](#usage)
    - [Example Configuration File Path](#example-configuration-file-path)
    - [Example Configuration File Content](#example-configuration-file-content)
  - [Configuration](#configuration)
    - [Configuration Options](#configuration-options)
    - [Proxy Configuration](#proxy-configuration)
  - [Tools](#tools)
  - [Documentation](#documentation)
  - [Limitations](#limitations)
    - [Record Operation Limitations](#record-operation-limitations)
    - [Other Limitations](#other-limitations)
  - [Support Policy](#support-policy)
  - [Contribution](#contribution)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

### DXT (Claude Desktop Package)

DXT files can be installed as an extension for Claude Desktop.
Follow these steps to install:

1. Go to the [Releases page](https://github.com/kintone/mcp-server/releases)
2. Download `kintone-mcp-server.dxt` from the latest release
3. Open Claude Desktop
4. Go to Settings → Desktop Apps → Extensions
5. Drag and drop the downloaded `kintone-mcp-server.dxt` file onto the Claude Desktop screen
6. A confirmation dialog will appear, select "Install"
7. A settings dialog will appear, enter the required information:
   - `Kintone Base URL`: The base URL of your Kintone (e.g., `https://example.cybozu.com`)
   - `Kintone Username`: Your Kintone username
   - `Kintone Password`: Your Kintone password

### Docker Container Image

You can run the MCP server using Docker.

#### Prerequisites

- Docker installed on your machine
- Docker daemon running

#### Run Image

To run the MCP server using Docker, use the following command:

```bash
docker run -i --rm \
  -e KINTONE_BASE_URL=https://example.cybozu.com \
  -e KINTONE_USERNAME=(username) \
  -e KINTONE_PASSWORD=(password) \
  ghcr.io/kintone/mcp-server
```

### npm Package

You can install the MCP server as an npm package.

#### Prerequisites

- Node.js installed on your machine

#### Install Package

Use the following command to install:

```bash
npm install -g @kintone/mcp-server
```

#### Run Server

To run the MCP server, use the following command:

```bash
kintone-mcp-server \
  --base-url https://example.cybozu.com \
  --username (username) \
  --password (password)

# `--base-url`, `--username`, and `--password` can also be specified using environment variables:
# KINTONE_BASE_URL, KINTONE_USERNAME, and KINTONE_PASSWORD.
```

## Usage

If you installed the DXT file, no additional steps are required to use it.
For other installation methods, you need to create a configuration file.

Please refer to the documentation of the AI tool you are using for details on how to create the configuration file.

### Example Configuration File Path

- Claude Code: `.mcp.json` \[[ref](https://docs.anthropic.com/en/docs/claude-code/mcp)]
- Cursor: `.cursor/mcp.json` \[[ref](https://docs.cursor.com/en/context/mcp)]

### Example Configuration File Content

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

## Configuration

### Configuration Options

| Command-line Argument   | Environment Variable          | Description                                                               | Required |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------------- | -------- |
| `--base-url`            | `KINTONE_BASE_URL`            | Base URL of your Kintone environment (e.g., `https://example.cybozu.com`) | ✓        |
| `--username`            | `KINTONE_USERNAME`            | Kintone login username                                                    | ※1       |
| `--password`            | `KINTONE_PASSWORD`            | Kintone login password                                                    | ※1       |
| `--api-token`           | `KINTONE_API_TOKEN`           | API token (comma-separated, max 9 tokens)                                 | ※1       |
| `--basic-auth-username` | `KINTONE_BASIC_AUTH_USERNAME` | Basic authentication username                                             | -        |
| `--basic-auth-password` | `KINTONE_BASIC_AUTH_PASSWORD` | Basic authentication password                                             | -        |
| `--pfx-file-path`       | `KINTONE_PFX_FILE_PATH`       | Path to PFX file (for client certificate authentication)                  | -        |
| `--pfx-file-password`   | `KINTONE_PFX_FILE_PASSWORD`   | PFX file password                                                         | -        |
| `--proxy`               | `HTTPS_PROXY`                 | HTTPS proxy URL (e.g., `http://proxy.example.com:8080`)                   | -        |
| `--attachments-dir`     | `KINTONE_ATTACHMENTS_DIR`     | Directory to save downloaded files                                        | -        |

※1: Either `KINTONE_USERNAME` & `KINTONE_PASSWORD` or `KINTONE_API_TOKEN` is required

**Notes:**

- When using client certificate authentication, the URL domain must be `.s.cybozu.com` (e.g., `https://example.s.cybozu.com`)
- When password authentication and API token authentication are specified simultaneously, password authentication takes priority
- When both command-line arguments and environment variables are specified, command-line arguments take priority
- For detailed authentication configuration, refer to the [Authentication Configuration Guide](./docs/en/authentication.md)

### Proxy Configuration

If you need to connect through a proxy server in corporate environments, set the `HTTPS_PROXY` environment variable.

```bash
export HTTPS_PROXY="http://proxy.example.com:8080"

# If authentication is required
export HTTPS_PROXY="http://username:password@proxy.example.com:8080"
```

## Tools

| Tool Name                        | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `kintone-get-apps`               | Get information of multiple apps                   |
| `kintone-get-app`                | Get details of a single app                        |
| `kintone-get-form-fields`        | Get app field settings                             |
| `kintone-get-form-layout`        | Get app form layout                                |
| `kintone-get-process-management` | Get process management settings                    |
| `kintone-get-app-deploy-status`  | Check app settings deployment status to production |
| `kintone-get-general-settings`   | Get general settings of an app                     |
| `kintone-get-records`            | Get multiple records                               |
| `kintone-add-records`            | Add multiple records                               |
| `kintone-update-records`         | Update multiple records                            |
| `kintone-delete-records`         | Delete multiple records                            |
| `kintone-update-statuses`        | Update status of multiple records                  |
| `kintone-download-file`          | Download and save a file from an attachment field  |

## Documentation

- [Authentication Configuration Guide](./docs/en/authentication.md) - Detailed authentication methods and examples

## Notes

### `kintone-download-file` Tool

- Downloaded files are saved to the directory specified by `--attachments-dir` or `KINTONE_ATTACHMENTS_DIR`.
- If `--attachments-dir` or `KINTONE_ATTACHMENTS_DIR` is not specified, an error will occur when executing the tool.
- If a non-existent directory is specified for `--attachments-dir` or `KINTONE_ATTACHMENTS_DIR`, a new directory will be created and files will be saved there.

## Limitations

### Record Operation Limitations

- **Attachment fields**: Attachment fields cannot be specified in the record add/update tool
- **Selection fields**: For user selection fields, organization selection fields, and group selection fields, add/update is only possible if choices are set

### Other Limitations

- **Guest space not supported**: Cannot access apps within guest spaces

## Support Policy

The Kintone local MCP server is not covered by the API support desk.

Please report bugs or request features via [Issues](https://github.com/kintone/mcp-server/issues/new/choose).

## Contribution

See the [Contributing Guide](CONTRIBUTING.md).

## License

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).
