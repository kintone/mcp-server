# build binaries
FROM node:22@sha256:9e6918e8e32a47a58ed5fb9bd235bbc1d18a8c272e37f15d502b9db9e36821ee AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install --frozen-lockfile
RUN pnpm run build
# generate NOTICE file
RUN pnpm license:extract

RUN pnpm install --prod


FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:2a8c8af8bf7046d71efccaf1226e491f2ef934f3079dca9ad8ebbf36551f7fc5
LABEL org.opencontainers.image.source=https://github.com/kintone/mcp-server

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/LICENSE ./LICENSE
COPY --from=build /app/NOTICE ./NOTICE

# Entrypointにnodeが指定されているため、CMDにはオプション・ファイル名を指定する
# ref. https://github.com/GoogleContainerTools/distroless/tree/main/nodejs#usage
# > The entrypoint of this image is set to "node", so this image expects users to supply a path to a .js file in the CMD.
CMD ["dist/index.js"]
