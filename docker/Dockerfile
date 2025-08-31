# build binaries
FROM node:22@sha256:6fe286835c595e53cdafc4889e9eff903dd3008a3050c1675809148d8e0df805 AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install --frozen-lockfile
RUN pnpm run build
# generate NOTICE file
RUN pnpm license:extract

RUN pnpm install --prod


FROM gcr.io/distroless/nodejs22-debian12:nonroot@sha256:be2a15ca96352149634f43fcca8d01c78b1beb6b95f31c25e53c8abb52903da8
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
