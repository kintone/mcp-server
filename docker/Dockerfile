# build binaries
FROM node:22@sha256:4973262386dc1cb70f7d6fc48a855027d8f12d2d3b1fe559b9db9a4fcb74668f AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install --frozen-lockfile
RUN pnpm run build
# generate NOTICE file
RUN pnpm license:extract

RUN pnpm install --prod


FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:bc5e1d871def8b8708ad24a895b14f0d13aad8261bb9fce070341b03d68eb74f
# ref. https://docs.github.com/ja/packages/working-with-a-github-packages-registry/working-with-the-container-registry#labelling-container-images
LABEL org.opencontainers.image.source=https://github.com/kintone/mcp-server
LABEL org.opencontainers.image.description="The official MCP Server for kintone"
LABEL org.opencontainers.image.licenses="Apache-2.0"

WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/LICENSE ./LICENSE
COPY --from=build /app/NOTICE ./NOTICE

# NOTE: Using ENTRYPOINT to include index.js because specifying index.js with CMD would be overwritten when CLI arguments are used
ENTRYPOINT [ "/nodejs/bin/node", "dist/index.js"]
