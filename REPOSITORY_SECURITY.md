# Repository security configuration

This file defines the required security baseline for `amnesia2k/sendlib-nest-sdk`. The repository
contains secretless CI, dependency update, release, and package-scanning automation.

The hosted settings below were inspected through the GitHub API on 2026-09-16. They must be checked
again after the workflows reach `master` and before publication.

## Required GitHub controls

- Enable the dependency graph, Dependabot alerts, and Dependabot security updates.
- Enable secret scanning, push protection, and private vulnerability reporting.
- Protect the default branch with pull requests and required CI checks.
- Protect `v*` release tags from unauthorized creation, updates, and deletion.
- Require review for workflow changes.

## Verified current state

- Secret scanning and push protection are enabled.
- Dependabot security updates are disabled.
- Private vulnerability reporting is disabled.
- `master` has no branch protection and the repository has no rulesets.
- No GitHub environments are configured.

The unchecked controls below are therefore release blockers, not claims about the repository.

## Test credentials

Normal CI must remain secretless and must never send email. Any future live integration workflow must be manually dispatched through a protected environment using dedicated non-production credentials.

## Publishing

Use an `npm-production` environment requiring maintainer approval and restricted to protected `v*`
tags. Connect npm trusted publishing to `.github/workflows/release.yml`; use a short-lived granular
token only when bootstrapping the first package version. Pull-request workflows never reference the
publishing environment or credentials.

## Verification checklist

- [ ] GitHub dependency graph, Dependabot alerts, and Dependabot security updates are enabled.
- [ ] Secret scanning, push protection, and private vulnerability reporting are enabled.
- [ ] `master` requires pull requests and the `Node 22 quality`, `Node 24 quality`,
      `Nest compatibility`, and `Package integrity` checks.
- [ ] Force pushes and branch deletion are blocked; workflow changes require review.
- [ ] A `v*` ruleset prevents unauthorized tag creation, updates, and deletion.
- [ ] The `npm-production` environment requires approval and permits protected tags only.
- [ ] npm trusted publishing is connected after the initial package bootstrap.
