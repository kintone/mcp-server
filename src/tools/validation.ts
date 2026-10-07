// Some MCP clients cannot build arguments for an array that is required at the
// top level when its `items` schema declares `required` of its own. They never
// send `tools/call` and keep asking the user for the item keys instead. The same
// symptom is reported in https://github.com/mondaycom/mcp/issues/499.
//
// The affected tools therefore declare those item fields optional in their input
// schema, and `requireItemFields` holds the guarantee that they are required: a
// missing field is rejected before the kintone API is called, and the message
// names the item and the key that is missing.

/** Error thrown when an array item is missing a field its tool requires. */
export class MissingRequiredFieldsError extends Error {
  /** Paths of the missing fields, e.g. `records[0].id`. */
  readonly paths: readonly string[];

  constructor(paths: readonly string[]) {
    super(
      `Missing required field(s): ${paths.join(", ")}. ` +
        "These fields are declared optional in the input schema for client compatibility, " +
        "but they are required by this tool.",
    );
    this.name = "MissingRequiredFieldsError";
    this.paths = paths;
  }
}

export type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: Exclude<T[P], undefined>;
};

/**
 * Assert that every item of `items` carries all of `keys`.
 *
 * Every missing field is reported at once, so the caller does not have to fix
 * them one round trip at a time.
 *
 * @param items The array to check
 * @param arrayName Argument name of the array, used in the error message (e.g. `records`)
 * @param keys The keys to treat as required
 * @returns The same array, with `keys` narrowed to required
 */
export const requireItemFields = <T extends object, K extends keyof T & string>(
  items: readonly T[],
  arrayName: string,
  keys: readonly K[],
): Array<WithRequired<T, K>> => {
  const missing = items.flatMap((item, index) =>
    keys
      .filter((key) => item[key] === undefined)
      .map((key) => `${arrayName}[${index}].${key}`),
  );

  if (missing.length > 0) {
    throw new MissingRequiredFieldsError(missing);
  }

  // The check above rules out `undefined` for every key, which the type checker
  // cannot follow back to the element type. A type test pins the result.
  return items as Array<WithRequired<T, K>>;
};
