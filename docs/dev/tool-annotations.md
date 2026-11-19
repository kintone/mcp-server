# Tool annotations

Every tool declares the four MCP tool annotations in `ToolConfig.annotations`: `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint`. Set all four explicitly as booleans. MCP clients treat an omitted hint as the pessimistic default of the specification: not read-only, destructive, not idempotent, and talking to the outside world.

## How to decide each value

| Hint              | `true` when                                                                                                                        | `false` when                               |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `readOnlyHint`    | The tool does not change any data in kintone                                                                                       | The tool adds, changes, or deletes data    |
| `destructiveHint` | The tool overwrites or deletes existing data                                                                                       | The tool only adds new data, or only reads |
| `idempotentHint`  | Calling it again with the same arguments has no additional effect. A record or app revision that moves forward counts as an effect | Each call has an effect                    |
| `openWorldHint`   | The tool talks to anything other than kintone                                                                                      | The tool talks only to kintone             |

A tool with `readOnlyHint: true` also sets `destructiveHint: false` and `idempotentHint: true`.

## Tools that are easy to get wrong

- `kintone-update-*` and `kintone-deploy-app`: they overwrite existing settings or data, so `destructiveHint` is `true`. Each call moves a revision forward, so `idempotentHint` is `false`.
- `kintone-update-statuses`: once the first call moves a record to the next status, a second call cannot take the same action again. `idempotentHint` is `false`.
- `kintone-delete-*`: a second call fails because the target is gone, and nothing changes, so `idempotentHint` is `true`.
- `kintone-download-file`: it saves a file locally, but it does not change anything in kintone and never overwrites an existing file, so `readOnlyHint` is `true`.

## When you add or change a tool

Update the expected values in `src/tools/__tests__/annotations.test.ts` and the tool tables in `README.md` and `README_en.md`. The tests fail if any of them disagrees with the tool definitions.
