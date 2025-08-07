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
