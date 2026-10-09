import { describe, expect, expectTypeOf, it } from "vitest";
import {
  MissingRequiredFieldsError,
  requireItemFields,
} from "../validation.js";

describe("requireItemFields", () => {
  it("returns the items unchanged when every key is present", () => {
    const items = [
      { id: "1", record: {} },
      { id: "2", record: {} },
    ];

    expect(requireItemFields(items, "records", ["id", "record"])).toBe(items);
  });

  it("reports every missing field across every item at once", () => {
    const items = [{ id: "1", record: {} }, { record: {} }, { id: "3" }];

    try {
      requireItemFields(items, "records", ["id", "record"]);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(MissingRequiredFieldsError);
      expect((error as MissingRequiredFieldsError).paths).toEqual([
        "records[1].id",
        "records[2].record",
      ]);
      expect((error as Error).message).toContain(
        "Missing required field(s): records[1].id, records[2].record",
      );
    }
  });

  it("treats an explicit undefined as missing but keeps other falsy values", () => {
    const items = [{ app: "", revision: undefined }];

    expect(requireItemFields(items, "apps", ["app"])).toBe(items);
    expect(() => requireItemFields(items, "apps", ["revision"])).toThrow(
      "apps[0].revision",
    );
  });

  it("accepts an empty array", () => {
    expect(requireItemFields([], "records", ["id"])).toEqual([]);
  });

  // The return goes through a type assertion, so tsc is what checks this.
  it("narrows only the asserted keys to required", () => {
    const items: Array<{ id?: string; record?: object; revision?: string }> = [
      { id: "1", record: {} },
    ];

    const narrowed = requireItemFields(items, "records", ["id", "record"]);

    expectTypeOf(narrowed[0].id).toEqualTypeOf<string>();
    expectTypeOf(narrowed[0].record).toEqualTypeOf<object>();
    expectTypeOf(narrowed[0].revision).toEqualTypeOf<string | undefined>();
  });
});
