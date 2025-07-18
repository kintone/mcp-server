# build binaries
FROM node:22@sha256:0c0734eb7051babbb3e95cd74e684f940552b31472152edf0bb23e54ab44a0d7 AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install --prod

FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:2a8c8af8bf7046d71efccaf1226e491f2ef934f3079dca9ad8ebbf36551f7fc5
LABEL org.opencontainers.image.source=https://github.com/kintone/mcp-server

WORKDIR /app
COPY --from=build /app/src ./src
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Entrypointにnodeが指定されているため、CMDにはオプション・ファイル名を指定する
# ref. https://github.com/GoogleContainerTools/distroless/tree/main/nodejs#usage
# > The entrypoint of this image is set to "node", so this image expects users to supply a path to a .js file in the CMD.
CMD ["--experimental-strip-types", "src/index.ts"]
