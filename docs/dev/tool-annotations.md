# Tool annotations

Every tool declares the four MCP tool annotations in `ToolConfig.annotations`: `readOnlyHint`, `destructiveHint`, `idempotentHint`, and `openWorldHint`. Set all four explicitly as booleans. MCP clients treat an omitted hint as the pessimistic default of the specification: not read-only, destructive, not idempotent, and talking to the outside world.

## How to decide each value

| Hint              | `true` when                                                                                                                                                                                           | `false` when                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `readOnlyHint`    | The tool does not change any data in kintone                                                                                                                                                          | The tool adds, changes, or deletes data    |
| `destructiveHint` | The tool overwrites or deletes existing data                                                                                                                                                          | The tool only adds new data, or only reads |
| `idempotentHint`  | Calling it again with the same arguments has no additional effect. Any state in kintone that changes on each call counts as an effect, such as a revision, a modified time, or a change history entry | Each call has an effect                    |
| `openWorldHint`   | The tool talks to anything other than kintone                                                                                                                                                         | The tool talks only to kintone             |

A tool with `readOnlyHint: true` also sets `destructiveHint: false` and `idempotentHint: true`.

Under this rule, a write that succeeds again on a second call is idempotent only if you can confirm that it changes none of this state. A write whose second call fails and changes nothing, such as `kintone-delete-*`, is idempotent.

## Tools that are easy to get wrong

- `kintone-update-*`: they overwrite existing settings or data, so `destructiveHint` is `true`. A second call with the same arguments succeeds again, so `idempotentHint` is `false`. `kintone-update-space` has no revision, but each call updates the modified time of the space.
- `kintone-deploy-app`: it overwrites the production settings with the preview settings and cannot be undone, so `destructiveHint` is `true`. What a second call with the same arguments does depends on the pending changes in the preview environment, so `idempotentHint` is `false`.
- `kintone-update-statuses`: after the first call moves a record to the next status, a second call fails if the new status has no action of the same name. If it has one, for example when an approval has several steps, the second call succeeds and moves the record further. `idempotentHint` is `false`.
- `kintone-delete-*`: a second call fails because the target is gone, and nothing changes, so `idempotentHint` is `true`.
- `kintone-add-form-fields`: a second call with the same field codes fails because the fields already exist, and nothing changes, so `idempotentHint` is `true`. The other `kintone-add-*` tools create a new app, record, comment, or space on each call, so `idempotentHint` is `false`.
- `kintone-download-file`: it saves a file locally, but it does not change anything in kintone and never overwrites an existing file, so `readOnlyHint` is `true`.

## When you add or change a tool

Update the expected values in `src/tools/__tests__/annotations.test.ts` and the tool tables in `README.md` and `README_en.md`. The tests fail if any of them disagrees with the tool definitions.
