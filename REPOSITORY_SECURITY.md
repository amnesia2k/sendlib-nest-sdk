# Repository security configuration

This file defines the required repository-security baseline. Update it after the repository and automation are configured.

## Required GitHub controls

- Enable the dependency graph, Dependabot alerts, and Dependabot security updates.
- Enable secret scanning, push protection, and private vulnerability reporting.
- Protect the default branch with pull requests and required CI checks.
- Protect `v*` release tags from unauthorized creation, updates, and deletion.
- Require review for workflow changes.

## Test credentials

Normal CI must remain secretless and must never send email. Any future live integration workflow must be manually dispatched through a protected environment using dedicated non-production credentials.

## Publishing

Use a protected npm production environment restricted to release tags. Prefer trusted publishing and provenance. Pull-request workflows must never receive publishing credentials.
