import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServer } from "../server.js";

// Create mock tools
const enabledToolMock = {
  name: "enabledTool",
  config: { description: "Always enabled tool" },
  callback: vi.fn(),
};

const excludedToolMock = {
  name: "excluded-tool",
  config: { description: "Tool that gets excluded" },
  callback: vi.fn(),
};

const anotherEnabledToolMock = {
  name: "anotherEnabledTool",
  config: { description: "Another enabled tool" },
  callback: vi.fn(),
};

// Mock the tools module
vi.mock("../tools/index.js", () => ({
  get tools() {
    return [enabledToolMock, excludedToolMock, anotherEnabledToolMock];
  },
}));

// Mock the config module
vi.mock("../config/index.js", () => {
  const mockParseKintoneClientConfig = vi.fn();
  return {
    PACKAGE_NAME: "test-package",
    parseKintoneClientConfig: mockParseKintoneClientConfig,
  };
});

// Mock the tool-filters module
vi.mock("../tool-filters.js", () => ({
  shouldEnableTool: vi.fn((toolName) => {
    // Mock filter logic for tests - exclude specific tool regardless of config
    return toolName !== "excluded-tool";
  }),
}));

// Mock McpServer to track registerTool calls
const mockRegisterTool = vi.fn();
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    registerTool: mockRegisterTool,
  })),
}));

describe("server", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register only non-excluded tools", async () => {
    // Import and get the mocked function
    const { parseKintoneClientConfig } = await import("../config/index.js");
    const mockParseKintoneClientConfig = parseKintoneClientConfig as any;
    mockParseKintoneClientConfig.mockReturnValue({ isApiTokenAuth: false });

    const server = createServer();

    // Verify server was created correctly
    expect(server).toBeDefined();
    expect(createServer).toBeDefined();
    expect(typeof createServer).toBe("function");

    // Verify only non-excluded tools were registered
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "enabledTool",
      enabledToolMock.config,
      enabledToolMock.callback,
    );
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "anotherEnabledTool",
      anotherEnabledToolMock.config,
      anotherEnabledToolMock.callback,
    );

    // Verify excluded-tool was not registered
    expect(mockRegisterTool).not.toHaveBeenCalledWith(
      "excluded-tool",
      excludedToolMock.config,
      excludedToolMock.callback,
    );

    // Verify total number of registerTool calls (2 tools)
    expect(mockRegisterTool).toHaveBeenCalledTimes(2);
  });
});
