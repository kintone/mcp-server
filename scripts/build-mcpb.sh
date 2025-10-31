#!/bin/bash

set -e
cd "$(dirname "$0")/.."

pnpm clean
pnpm build
pnpm license:extract

mkdir -p build/tmp

# buildに必要なものとmcpbにパッケージングするものを列挙する
cp package.json \
   pnpm-lock.yaml \
   manifest.json \
   icon.png \
   LICENSE \
   NOTICE \
   README.md \
   build/tmp/
cp -r dist build/tmp/

pnpm --prefix build/tmp install --prod --frozen-lockfile --shamefully-hoist

pnpm mcpb pack build/tmp build/kintone-mcp-server.mcpb

echo "MCPB package created successfully at build/kintone-mcp-server.mcpb"
