#!/bin/bash

set -e
cd "$(dirname "$0")/.."

pnpm clean
pnpm build

mkdir -p build/tmp

# buildに必要なものとdxtにパッケージングするものを列挙する
cp package.json \
   pnpm-lock.yaml \
   manifest.json \
   LICENSE \
   README.md \
   build/tmp/
cp -r dist build/tmp/

pnpm --prefix build/tmp install --prod --frozen-lockfile

pnpm dxt pack build/tmp build/kintone-mcp-server.dxt

echo "DXT package created successfully at build/kintone-mcp-server.dxt"
