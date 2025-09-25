import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteFormFields } from "../delete-form-fields.js";
import {
  createMockClient,
  mockToolCallbackOptions,
} from "../../../../__tests__/utils.js";

describe("deleteFormFields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("callback function", () => {
    it("should delete fields successfully", async () => {
      const mockClient = createMockClient();
      const mockDeleteFormFields = mockClient.app
        .deleteFormFields as ReturnType<typeof vi.fn>;

      const mockResponse = {
        revision: "5",
      };
      mockDeleteFormFields.mockResolvedValue(mockResponse);

      const result = await deleteFormFields.callback(
        {
          app: "1",
          fields: ["field1", "field2"],
          revision: "4",
        },
        mockToolCallbackOptions(mockClient),
      );

      expect(mockDeleteFormFields).toHaveBeenCalledWith({
        app: "1",
        fields: ["field1", "field2"],
        revision: "4",
      });

      expect(result.structuredContent).toEqual({
        revision: "5",
      });
      expect(result.content[0].text).toContain('"revision": "5"');
    });

    it("should delete fields without specifying revision", async () => {
      const mockClient = createMockClient();
      const mockDeleteFormFields = mockClient.app
        .deleteFormFields as ReturnType<typeof vi.fn>;

      const mockResponse = {
        revision: "3",
      };
      mockDeleteFormFields.mockResolvedValue(mockResponse);

      const result = await deleteFormFields.callback(
        {
          app: "2",
          fields: ["field3"],
        },
        mockToolCallbackOptions(mockClient),
      );

      expect(mockDeleteFormFields).toHaveBeenCalledWith({
        app: "2",
        fields: ["field3"],
        revision: undefined,
      });

      expect(result.structuredContent).toEqual({
        revision: "3",
      });
    });

    it("should delete 100 fields simultaneously", async () => {
      const mockClient = createMockClient();
      const mockDeleteFormFields = mockClient.app
        .deleteFormFields as ReturnType<typeof vi.fn>;

      const fields = Array.from({ length: 100 }, (_, i) => `field_${i}`);
      const mockResponse = {
        revision: "10",
      };
      mockDeleteFormFields.mockResolvedValue(mockResponse);

      const result = await deleteFormFields.callback(
        {
          app: "3",
          fields,
        },
        mockToolCallbackOptions(mockClient),
      );

      expect(mockDeleteFormFields).toHaveBeenCalledWith({
        app: "3",
        fields,
        revision: undefined,
      });

      expect(result.structuredContent).toEqual({
        revision: "10",
      });
    });

    it("should handle API errors appropriately", async () => {
      const mockClient = createMockClient();
      const mockDeleteFormFields = mockClient.app
        .deleteFormFields as ReturnType<typeof vi.fn>;

      mockDeleteFormFields.mockRejectedValue(new Error("API Error"));

      await expect(
        deleteFormFields.callback(
          {
            app: "1",
            fields: ["field1"],
          },
          mockToolCallbackOptions(mockClient),
        ),
      ).rejects.toThrow("API Error");
    });

    it("should handle permission errors appropriately", async () => {
      const mockClient = createMockClient();
      const mockDeleteFormFields = mockClient.app
        .deleteFormFields as ReturnType<typeof vi.fn>;

      const error = new Error("Permission denied");
      mockDeleteFormFields.mockRejectedValue(error);

      await expect(
        deleteFormFields.callback(
          {
            app: "1",
            fields: ["field1"],
          },
          mockToolCallbackOptions(mockClient),
        ),
      ).rejects.toThrow("Permission denied");
    });

    it("should handle revision mismatch errors appropriately", async () => {
      const mockClient = createMockClient();
      const mockDeleteFormFields = mockClient.app
        .deleteFormFields as ReturnType<typeof vi.fn>;

      const error = new Error("Revision mismatch");
      mockDeleteFormFields.mockRejectedValue(error);

      await expect(
        deleteFormFields.callback(
          {
            app: "1",
            fields: ["field1"],
            revision: "2",
          },
          mockToolCallbackOptions(mockClient),
        ),
      ).rejects.toThrow("Revision mismatch");
    });
  });
});
