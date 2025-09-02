import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { shouldEnableTool, type Condition } from "./tool-filters.js";
import { getKintoneClient, type KintoneClientConfig } from "../client/index.js";
import { createToolCallback, getTools } from "../tools/index.js";

export class ServerBuilder {
  private packageName: string | undefined = undefined;
  private version: string | undefined = undefined;
  private apiClientConfig: KintoneClientConfig | undefined = undefined;
  private toolConditionConfig: Condition | undefined = undefined;

  withPackageName(name: string): ServerBuilder {
    this.packageName = name;
    return this;
  }

  withVersion(version: string): ServerBuilder {
    this.version = version;
    return this;
  }

  withApiClientConfig(apiClientConfig: KintoneClientConfig): ServerBuilder {
    this.apiClientConfig = apiClientConfig;
    return this;
  }

  withToolConditionConfig(toolConditionConfig: Condition): ServerBuilder {
    this.toolConditionConfig = toolConditionConfig;
    return this;
  }

  build(): McpServer {
    if (!this.apiClientConfig) {
      throw new Error("Server config is not set.");
    }
    if (!this.toolConditionConfig) {
      throw new Error("Tool condition config is not set.");
    }
    if (!this.packageName) {
      throw new Error("Package name is not set.");
    }
    if (!this.version) {
      throw new Error("Version is not set.");
    }

    const server = new McpServer(
      {
        name: this.packageName,
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    const client = getKintoneClient(this.apiClientConfig);
    const tools = getTools();
    tools
      .filter((tool) => shouldEnableTool(tool.name, this.toolConditionConfig!))
      .forEach((tool) =>
        server.registerTool(
          tool.name,
          tool.config,
          createToolCallback(tool.callback, { client }),
        ),
      );

    return server;
  }
}
