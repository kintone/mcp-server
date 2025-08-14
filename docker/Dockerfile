# build binaries
FROM node:24@sha256:71f5f2de0f2d4f9337ed7843bd343e76470c70261d8b98ba93812ec657153509 AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install --frozen-lockfile
RUN pnpm run build
# generate NOTICE file
RUN pnpm license:extract

RUN pnpm install --prod


FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:8929dbab735ee399ff886ba7d81419dbe7df002993a7d69715e1c16b7d41c531
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
