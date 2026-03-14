## 2026-03-12 - [pnpm Monorepo CI and Lockfile Integrity]
**Learning:** In a pnpm monorepo, having `workspaces` in `package.json` is not sufficient for `pnpm` if `pnpm-workspace.yaml` is missing. This causes CI build failures as it fails to link local packages correctly. Additionally, running `pnpm install` without `--frozen-lockfile` in a misconfigured workspace or with a version mismatch can lead to massive, destructive `pnpm-lock.yaml` regressions (e.g., swapping entire frameworks if the lockfile version is bumped).
**Action:** Always verify if `pnpm-workspace.yaml` exists in a monorepo. Use `--frozen-lockfile` in CI and be extremely cautious when `pnpm-lock.yaml` changes significantly without `package.json` changes.

## 2026-03-12 - [Registry Lookup Optimization]
**Learning:** Transitioning from O(N) array searching (`Array.find`) to O(1) `Map` lookups in core registry classes (like `GLBRegistry`) provides a measurable performance gain in hot paths like the world tick loop.
**Action:** Audit registry-like classes for linear lookups and replace with hash maps where appropriate.
