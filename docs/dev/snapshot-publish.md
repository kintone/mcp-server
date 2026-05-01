# Docker snapshot images

PR-stage container images for verifying mcp-server changes in environments outside CI before merging.

| Method                                                     | Trigger             | Cleanup                                    |
| ---------------------------------------------------------- | ------------------- | ------------------------------------------ |
| [Label-driven (`snapshot/docker`)](#label-driven-snapshot) | PR label            | Automatic on label removal / PR close      |
| [Manual dispatch (legacy)](#manual-dispatch-legacy)        | `workflow_dispatch` | Manual / via [bulk cleanup](#bulk-cleanup) |

---

## Label-driven snapshot

Add the `snapshot/docker` label to a PR to publish a container image of the
PR's HEAD to `ghcr.io/kintone/mcp-server`. Pushing additional commits to the
labeled PR refreshes the image. Removing the label or closing the PR cleans up
the published images automatically.

Implementation:

- [`.github/workflows/docker-snapshot.yaml`](../../.github/workflows/docker-snapshot.yaml) — publish + cleanup entrypoint
- [`.github/workflows/reusable-cleanup-docker-snapshots.yaml`](../../.github/workflows/reusable-cleanup-docker-snapshots.yaml) — per-branch cleanup
- [`.github/workflows/cleanup-all-docker-snapshots.yaml`](../../.github/workflows/cleanup-all-docker-snapshots.yaml) — bulk cleanup with branch filter and dry-run
- [`.github/actions/sanitize-snapshot-branch/`](../../.github/actions/sanitize-snapshot-branch/action.yaml) — branch-name sanitiser
- [`.github/workflows/reusable-publish-image.yaml`](../../.github/workflows/reusable-publish-image.yaml) — image build / push (existing)

### Usage

1. Add the `snapshot/docker` label to a PR.
2. The workflow builds the container image and pushes it to GHCR.
3. A PR comment is posted (and updated on subsequent pushes) with the image,
   tags, and a `docker pull` command.

```text
### mcp-server snapshot image published

| Key | Value |
| --- | --- |
| Image | `ghcr.io/kintone/mcp-server` |
| Immutable tag | `feat-new-tool-20260501123045-abc1234` |
| Moving tag | `snapshot-feat-new-tool` |
| Commit | abc1234 |
```

Pull the latest build for the branch:

```bash
docker pull ghcr.io/kintone/mcp-server:snapshot-feat-new-tool
```

Pin a specific build:

```bash
docker pull ghcr.io/kintone/mcp-server:feat-new-tool-20260501123045-abc1234
```

### Cleanup

Cleanup runs automatically when:

- The `snapshot/docker` label is removed from the PR.
- The PR is closed or merged (cleanup then strips the label).

The cleanup deletes every package version whose tags include either the moving
tag (`snapshot-<branch>`) or any tag starting with the immutable prefix
(`<branch>-`).

### Tag scheme

| Type      | Format                                            | Example                                |
| --------- | ------------------------------------------------- | -------------------------------------- |
| Immutable | `{sanitized-branch}-{YYYYMMDDHHMMSS}-{short-sha}` | `feat-new-tool-20260501123045-abc1234` |
| Moving    | `snapshot-{sanitized-branch}`                     | `snapshot-feat-new-tool`               |

Branch sanitisation:

1. Replace `[^a-zA-Z0-9-]` with `-` (`/`, `_`, etc.).
2. Collapse repeated `-`.
3. Trim leading / trailing `-`.
4. Truncate to 50 characters.

Example: `feat/new-tool_v2` → `feat-new-tool-v2`.

### Workflow detail

**Publish:**

```
PR labeled with snapshot/docker (or push to a labeled PR)
       │
       ▼
  sanitise branch → compute tags
       │
       ▼
  reusable-publish-image (push immutable + moving tags together)
       │
       ▼
  PR comment created / updated
```

- Concurrent runs on the same PR cancel earlier executions.
- The PR comment is identified by the HTML marker `<!-- snapshot-docker -->`
  and updated in place.

**Cleanup:**

```
Label removed (or labeled PR closed)
       │
       ▼
  list ghcr versions, filter by moving tag or immutable prefix
       │
       ▼
  delete each version (up to 3 retries)
       │
       ▼
  PR comment updated
```

When the PR is closed, the `snapshot/docker` label is removed after a
successful cleanup.

---

## Bulk cleanup

[`cleanup-all-docker-snapshots.yaml`](../../.github/workflows/cleanup-all-docker-snapshots.yaml)
can be invoked from the Actions tab to remove leftover snapshot images, either
for a specific branch or every branch that ever had a snapshot.

| Input     | Required | Default | Description                                                                                                        |
| --------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------ |
| `branch`  | No       | `""`    | If set, only this branch is cleaned. Empty means every branch found in moving tags or labeled PRs.                 |
| `dry-run` | No       | `true`  | When true, lists what would be deleted without performing any destructive action. **Defaults to true** for safety. |

Recommended workflow: run with `dry-run: true` first to verify the target
list, then re-run with `dry-run: false` to delete.

The job also strips the `snapshot/docker` label from open PRs that still carry
it (or lists them only when `dry-run: true`).

---

## Manual dispatch (legacy)

[`publish-snapshot-image.yaml`](../../.github/workflows/publish-snapshot-image.yaml)
is the original `workflow_dispatch` flow. Prefer the label-driven workflow
above; this one stays for compatibility and edge cases (e.g. publishing from a
branch without a PR). Cleanup is **not** automatic — use the [bulk
cleanup](#bulk-cleanup) workflow.

---

## Operational notes

- **Avoid mixing the legacy and label-driven flows on the same branch.** The
  cleanup matches every tag with the `<branch>-` prefix, including images
  produced by the legacy workflow on the same branch. Once a branch is on the
  label-driven flow, do not also publish via `workflow_dispatch` for it.
- The `snapshot/docker` label must exist in the repository before the workflow
  can be triggered. Create it once via the Labels settings if it is missing.
- Branch names longer than 50 characters get truncated; refer to the PR
  comment for the exact tag in use.
- **Fork PRs are skipped.** `pull_request` from a fork runs with a read-only
  `GITHUB_TOKEN` and no access to secrets, so the workflow would fail at the
  registry login or push step. The publish and cleanup jobs are gated on the
  PR head being from the same repository.
- **Snapshots are not releases.** They are dev-only artifacts built from a PR
  HEAD, may contain unstable or experimental code, and are deleted when the
  PR is closed. Do not use them in production. Stable releases come from the
  release workflow with semver tags.
- **Sensitive branch names become public tags.** A branch name like
  `fix-CVE-2025-XXXX` would appear in the immutable tag pushed to the public
  registry. Don't add `snapshot/docker` to PRs related to embargoed
  vulnerabilities until they are disclosed.

### First-time setup

The first push creates the `mcp-server` container package on GHCR. By default
it is private. To allow anonymous pulls (which is the typical usage), a
maintainer needs to flip the visibility to public once:

> Repository → Packages → `mcp-server` → Package settings → Change package
> visibility → Public

This step is only needed once; subsequent pushes inherit the visibility.
