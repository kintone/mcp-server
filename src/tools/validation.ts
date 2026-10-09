// Some MCP clients cannot build arguments for an array that is required at the
// top level when its `items` schema declares `required` of its own: they never
// send `tools/call` and keep asking the user for the item keys instead. The
// affected tools therefore declare those item fields optional in their input
// schema, and the guarantee that they are required lives here.
// https://github.com/mondaycom/mcp/issues/499

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

type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: Exclude<T[P], undefined>;
};

/**
 * Assert that every item of an array carries the fields its tool requires.
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
  // cannot follow back to the element type.
  return items as Array<WithRequired<T, K>>;
};
