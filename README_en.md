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

[日本語](README.md) | English

The official local MCP server for kintone.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
  - [DXT (Claude Desktop Package)](#dxt-claude-desktop-package)
  - [Docker Container Image](#docker-container-image)
  - [npm Package](#npm-package)
- [Usage](#usage)
  - [Example Configuration File Path](#example-configuration-file-path)
  - [Example Configuration File Content](#example-configuration-file-content)
- [Tools](#tools)
- [Limitations](#limitations)
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
   - `Kintone Base URL`: The base URL of your kintone (e.g., `https://example.cybozu.com`)
   - `Kintone Username`: Your kintone username
   - `Kintone Password`: Your kintone password

### Docker Container Image

You can run the MCP server using Docker.

#### Prerequisites

- Docker installed on your machine
- Docker daemon running

#### Run Image

To run the MCP server using Docker, use the following command:

```bash
docker run -i --rm ghcr.io/kintone/mcp-server \
  -e KINTONE_BASE_URL=https://example.cybozu.com \
  -e KINTONE_USERNAME=(username) \
  -e KINTONE_PASSWORD=(password)
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
  --kintone-base-url https://example.cybozu.com \
  --kintone-username (username) \
  --kintone-password (password)

# `--kintone-base-url`, `--kintone-username`, and `--kintone-password` can also be specified using environment variables:
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

## Tools

| Tool Name                        | Description                      |
| -------------------------------- | -------------------------------- |
| `kintone-get-apps`               | Get information of multiple apps |
| `kintone-get-app`                | Get details of a single app      |
| `kintone-get-form-fields`        | Get app field settings           |
| `kintone-get-process-management` | Get process management settings  |
| `kintone-get-records`            | Search and get records           |
| `kintone-add-records`            | Add new records                  |
| `kintone-update-records`         | Update existing records          |
| `kintone-delete-records`         | Delete records                   |
| `kintone-update-statuses`        | Change record statuses           |

## Limitations

As of 2025/08/05, attachment fields cannot be specified in the record add/update tool.
Also, for user selection fields, organization selection fields, and group selection fields, add/update is only possible if choices are set.

## Support Policy

This tool is not covered by the API support desk.

Please report bugs or request features via [Issues](https://github.com/kintone/mcp-server/issues/new/choose).

## Contribution

See the [Contributing Guide](CONTRIBUTING.md).

## License

Copyright 2025 Cybozu, Inc.

Licensed under the [Apache 2.0](LICENSE).
