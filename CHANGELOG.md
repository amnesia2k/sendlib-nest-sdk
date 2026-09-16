# @sendlib/nest-sdk

This changelog records user-visible changes. Versions follow [Semantic Versioning](https://semver.org/) and release entries will be managed with Changesets.

## Unreleased

## 0.1.0 — 2026-09-16

- Initialize package identity, dependency policy, licensing, formatting, Changesets, and project
  documentation.
- Add the strict TypeScript, ESLint, Vitest, SWC, and tsup foundation with dual ESM/CommonJS builds
  and declarations.
- Add package export and packed-artifact validation with Publint and Are the Types Wrong.
- Add static and asynchronous NestJS module registration, public injection tokens, the injectable
  service provider, and coverage for every configuration strategy.
- Add direct service delegation for every Node SDK namespace, canonical Node SDK type and error
  re-exports, identity guarantees, and typed provider-override guidance.
- Add enforced coverage and packed ESM/CommonJS consumer matrices for the minimum and latest
  supported NestJS, Node SDK, reflection, and RxJS versions.
- Exclude NestJS 12.0.0 after compatibility testing confirmed its core package requires NestJS 11
  common; set the supported peer floor to 12.0.1.
- Document every callable operation, registration strategy, public error, testing pattern, and Node
  SDK migration path; add compiler and coverage guards for the examples.
