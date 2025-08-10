#!/bin/bash

set -e
cd "$(dirname "$0")/.."

pnpm clean
pnpm build
pnpm license:extract

mkdir -p build/tmp

# buildに必要なものとdxtにパッケージングするものを列挙する
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

pnpm dxt pack build/tmp build/kintone-mcp-server.dxt

echo "DXT package created successfully at build/kintone-mcp-server.dxt"
