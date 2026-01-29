# build binaries
FROM node:22@sha256:cd7bcd2e7a1e6f72052feb023c7f6b722205d3fcab7bbcbd2d1bfdab10b1e935 AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install --frozen-lockfile
RUN pnpm run build
# generate NOTICE file
RUN pnpm license:extract

RUN pnpm install --prod


FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:80dab95b787dc01d567ece51520a5d634cb5f205a278f7a2a2744d253a2cc33b
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
