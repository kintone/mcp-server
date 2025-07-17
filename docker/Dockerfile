# build binaries
FROM node:22@sha256:0c0734eb7051babbb3e95cd74e684f940552b31472152edf0bb23e54ab44a0d7 AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install

# https://pnpm.io/ja/cli/deploy
RUN pnpm --filter @kintone/mcp-server --prod deploy pruned

FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:8d8b9363b0c9d1153f845824f9b754fdb050ada4fa190583eca2da13fdd3138c
LABEL org.opencontainers.image.source=https://github.com/kintone/mcp-server

WORKDIR /app
COPY --from=build /app/pruned/src ./src
COPY --from=build /app/pruned/node_modules ./node_modules
COPY --from=build /app/pruned/package.json ./package.json

# Entrypointにnodeが指定されているため、CMDにはオプション・ファイル名を指定する
# ref. https://github.com/GoogleContainerTools/distroless/tree/main/nodejs#usage
# > The entrypoint of this image is set to "node", so this image expects users to supply a path to a .js file in the CMD.
CMD ["--experimental-strip-types", "src/index.ts"]
