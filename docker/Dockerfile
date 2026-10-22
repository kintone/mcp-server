# build binaries
FROM node:22@sha256:82693da96a4e38b8c0e2bf0c5df58fcb86d2d25e5a235c07748f09bfa38567c2 AS build

COPY . /app
WORKDIR /app

RUN corepack enable

RUN pnpm install --frozen-lockfile
RUN pnpm run build
# generate NOTICE file
RUN pnpm license:extract

RUN pnpm install --prod


FROM gcr.io/distroless/nodejs22-debian13:nonroot@sha256:b0b1352373f14fe86376d423e6d283ea6b85b912ff55ca89bed8d2fe11c257b8
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

EXPOSE 3000

# NOTE: Using ENTRYPOINT to include index.js because specifying index.js with CMD would be overwritten when CLI arguments are used
ENTRYPOINT [ "/nodejs/bin/node", "dist/index.js"]
