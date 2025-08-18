import { describe, it, expect, vi, beforeEach } from "vitest";
import { createServer } from "../server.js";

// Create mock tools with spies
const enabledToolMock = {
  name: "enabledTool",
  config: { description: "Always enabled tool" },
  callback: vi.fn(),
  disabled: undefined,
};

const disabledToolMock = {
  name: "disabledTool",
  config: { description: "Disabled tool" },
  callback: vi.fn(),
  disabled: vi.fn(() => true),
};

const conditionallyDisabledToolMock = {
  name: "conditionallyDisabledTool",
  config: { description: "Conditionally disabled tool" },
  callback: vi.fn(),
  disabled: vi.fn(() => false),
};

// Mock the tools module
vi.mock("../tools/index.js", () => ({
  get tools() {
    return [enabledToolMock, disabledToolMock, conditionallyDisabledToolMock];
  },
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

  it("should create server and register only enabled tools", () => {
    const server = createServer();

    expect(disabledToolMock.disabled).toHaveBeenCalledTimes(1);
    expect(conditionallyDisabledToolMock.disabled).toHaveBeenCalledTimes(1);

    // Verify server was created correctly
    expect(server).toBeDefined();
    expect(createServer).toBeDefined();
    expect(typeof createServer).toBe("function");

    // Verify disabled functions were called
    expect(disabledToolMock.disabled).toHaveBeenCalledOnce();
    expect(conditionallyDisabledToolMock.disabled).toHaveBeenCalledOnce();

    // Verify enabled tools were registered (including tools without disabled function)
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "enabledTool",
      enabledToolMock.config,
      enabledToolMock.callback,
    );
    expect(mockRegisterTool).toHaveBeenCalledWith(
      "conditionallyDisabledTool",
      conditionallyDisabledToolMock.config,
      conditionallyDisabledToolMock.callback,
    );

    // Verify disabled tool was not registered
    expect(mockRegisterTool).not.toHaveBeenCalledWith(
      "disabledTool",
      disabledToolMock.config,
      disabledToolMock.callback,
    );

    // Verify total number of registerTool calls (2 enabled tools)
    expect(mockRegisterTool).toHaveBeenCalledTimes(2);
  });
});
