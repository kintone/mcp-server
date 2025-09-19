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

  describe("正常系", () => {
    it("フィールドを正常に削除できる", async () => {
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

    it("revisionを指定せずにフィールドを削除できる", async () => {
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

    it("100個のフィールドを同時に削除できる", async () => {
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
  });

  describe("異常系", () => {
    it("APIエラー時に適切なエラーを返す", async () => {
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

    it("権限エラー時に適切なエラーを返す", async () => {
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

    it("リビジョン不一致エラー時に適切なエラーを返す", async () => {
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
