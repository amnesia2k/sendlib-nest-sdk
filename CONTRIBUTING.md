# Contributing to @sendlib/nest-sdk

## Development setup

Requirements: Node.js 22 or newer and the Bun version declared in `package.json`.

```bash
bun install
bun run ci
```

Useful focused commands include `bun run build`, `bun run lint`, `bun run typecheck`,
`bun run typecheck:examples`, `bun run check:examples`, `bun run test`, `bun run test:coverage`,
`bun run test:compatibility`, `bun run check:exports`, and `bun run pack:check`.

## Contribution workflow

1. Choose an unchecked item from `TODO.md` or open an issue.
2. Keep changes inside the NestJS integration boundary.
3. Add or update tests and documentation with behavior changes.
4. Run every quality command currently defined in `package.json`.
5. Add a Changeset for a user-visible change.

## Pull-request expectations

- Do not duplicate Node SDK transport, DTO, validation, retry, or error logic.
- Do not log module options or credentials.
- Keep Nest packages as peers and test every advertised compatibility range.
- Include a focused explanation and sanitized reproduction for bug fixes.
- Avoid unrelated formatting or refactoring.

## API changes

Changes to providers, injection tokens, registration options, exports, or supported peer ranges are public API changes. Record intentional decisions in `DECISIONS.md` and update `CONTRACT.md`.

## Community status

This is an unofficial community project. Contributions must not imply endorsement by SendLib or NestJS.
