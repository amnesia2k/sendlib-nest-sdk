# Release process

## Before the first release

1. Confirm package ownership and enable npm trusted publishing.
2. Protect the release environment and `v*` tags.
3. Complete every release gate in `TODO.md`.
4. Test the packed artifact in real NestJS ESM and CommonJS fixtures.

## Prepare a release

Run the current quality and package-integrity gate:

```bash
bun run ci
bun run test:compatibility
```

These commands enforce coverage and validate packed ESM/CommonJS consumers against the minimum and
latest dependency matrices. The CI command also compiler-checks the example fixture and verifies
that the complete examples guide covers every public operation and error class. Do not publish
until every release item in `TODO.md` is complete.

Review the generated package contents, declarations, dependency ranges, changelog, and compatibility matrix. Never publish from a dirty worktree.

## Publish

Use Changesets and the protected release workflow. Prefer npm trusted publishing with provenance; do not store long-lived npm tokens when trusted publishing is available.

## Failed release

Do not overwrite an npm version. Fix forward with a new patch release. Deprecate a harmful version and document migration steps when necessary.
