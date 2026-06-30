import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("../command-line.js", () => ({
  parse: vi.fn(),
}));

// Import after mock setup
import { parse } from "../command-line.js";
import { parseTransportConfig } from "../parser.js";

const mockedParse = vi.mocked(parse);

describe("parseTransportConfig", () => {
  beforeEach(() => {
    mockedParse.mockReturnValue({});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return default values when no CLI args are provided", () => {
    mockedParse.mockReturnValue({});

    const result = parseTransportConfig();

    expect(result).toEqual({
      transport: "stdio",
      port: 3000,
      hostname: "127.0.0.1",
    });
  });

  it("should override transport with CLI arg", () => {
    mockedParse.mockReturnValue({ transport: "http" });

    const result = parseTransportConfig();

    expect(result).toEqual({
      transport: "http",
      port: 3000,
      hostname: "127.0.0.1",
    });
  });

  it("should override port with CLI arg", () => {
    mockedParse.mockReturnValue({ port: "8080" });

    const result = parseTransportConfig();

    expect(result).toEqual({
      transport: "stdio",
      port: 8080,
      hostname: "127.0.0.1",
    });
  });

  it("should override hostname with CLI arg", () => {
    mockedParse.mockReturnValue({ hostname: "0.0.0.0" });

    const result = parseTransportConfig();

    expect(result).toEqual({
      transport: "stdio",
      port: 3000,
      hostname: "0.0.0.0",
    });
  });

  it("should override all values with CLI args", () => {
    mockedParse.mockReturnValue({
      transport: "http",
      port: "9090",
      hostname: "0.0.0.0",
    });

    const result = parseTransportConfig();

    expect(result).toEqual({
      transport: "http",
      port: 9090,
      hostname: "0.0.0.0",
    });
  });

  it("should throw on invalid transport value", () => {
    mockedParse.mockReturnValue({ transport: "websocket" });

    expect(() => parseTransportConfig()).toThrow(
      "Invalid transport configuration",
    );
  });

  it("should throw on invalid port (out of range)", () => {
    mockedParse.mockReturnValue({ port: "99999" });

    expect(() => parseTransportConfig()).toThrow(
      "Invalid transport configuration",
    );
  });

  it("should throw on invalid port (non-numeric)", () => {
    mockedParse.mockReturnValue({ port: "abc" });

    expect(() => parseTransportConfig()).toThrow(
      "Invalid transport configuration",
    );
  });

  it("should throw on port 0", () => {
    mockedParse.mockReturnValue({ port: "0" });

    expect(() => parseTransportConfig()).toThrow(
      "Invalid transport configuration",
    );
  });
});
