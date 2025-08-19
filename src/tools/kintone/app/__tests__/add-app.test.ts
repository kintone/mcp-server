import { describe, expect, it, vi } from "vitest";
import { addApp } from "../add-app.js";
import { mockExtra } from "../../../../__tests__/utils.js";

const mockAddApp = vi.fn();

vi.mock("@kintone/rest-api-client", () => ({
  KintoneRestAPIClient: vi.fn().mockImplementation(() => ({
    app: { addApp: mockAddApp },
  })),
}));

vi.mock("../../../../config.js", () => ({
  parseKintoneClientConfig: vi.fn().mockReturnValue({
    KINTONE_BASE_URL: "https://example.cybozu.com",
    KINTONE_USERNAME: "test-user",
    KINTONE_PASSWORD: "test-password",
  }),
  PACKAGE_NAME: "@kintone/mcp-server",
}));

vi.mock("../../../../version.js", () => ({
  version: "0.0.1",
}));

describe("addApp", () => {
  it("should create an app with name only", async () => {
    const mockResponse = {
      app: "123",
      revision: "1",
    };
    mockAddApp.mockResolvedValue(mockResponse);

    const result = await addApp.callback({ name: "Test App" }, mockExtra);

    expect(mockAddApp).toHaveBeenCalledWith({ name: "Test App" });
    expect(result.structuredContent).toEqual(mockResponse);
  });

  it("should create an app with space and thread IDs", async () => {
    const mockResponse = {
      app: "124",
      revision: "1",
    };
    mockAddApp.mockResolvedValue(mockResponse);

    const result = await addApp.callback(
      { name: "Test App with Space", space: 10, thread: 20 },
      mockExtra,
    );

    expect(mockAddApp).toHaveBeenCalledWith({
      name: "Test App with Space",
      space: 10,
      thread: 20,
    });
    expect(result.structuredContent).toEqual(mockResponse);
  });

  it("should handle optional parameters correctly", async () => {
    const mockResponse = {
      app: "125",
      revision: "1",
    };
    mockAddApp.mockResolvedValue(mockResponse);

    const result = await addApp.callback(
      { name: "Test App", space: 5 },
      mockExtra,
    );

    expect(mockAddApp).toHaveBeenCalledWith({
      name: "Test App",
      space: 5,
    });
    expect(result.structuredContent).toEqual(mockResponse);
  });
});
