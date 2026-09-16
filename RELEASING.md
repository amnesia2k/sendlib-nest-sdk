# Release process

Releases are immutable, reviewed, and published without rebuilding. The first public version is
`0.1.0`.

## One-time npm bootstrap

Confirm that `amnesia2k` can create and publish the public package `@sendlib/nest-sdk` under the
`sendlib` npm organization. Keep npm account 2FA enabled.

An npm trusted publisher can be connected after the package exists. If npm requires a token for
the first publication, create a short-lived granular token restricted to `@sendlib/nest-sdk`, put
it only in the protected GitHub `npm-production` environment as `NPM_TOKEN`, publish `0.1.0`, then
revoke and delete it.

Configure the package's npm trusted publisher with:

- Provider: GitHub Actions
- GitHub user: `amnesia2k`
- Repository: `sendlib-nest-sdk`
- Workflow filename: `release.yml`
- Environment: `npm-production`

## Version preparation

Consumer-visible pull requests add a changeset with `bun run changeset`. After merging to `master`,
the **Version packages** workflow creates or updates a reviewed release pull request.

Before merging a release pull request, run:

```sh
bun run prepublishOnly
```

This checks formatting, builds, lints, type-checks code and examples, verifies documentation
coverage, enforces test coverage, validates exports and package types, scans for credentials, and
boots packed ESM/CommonJS Nest consumers against the minimum and latest dependency matrices.

## Publication

After merging the release commit, update local `master` and run:

```sh
git switch master
git pull --ff-only
bun run release:publish
```

The command requires a clean `master` matching `origin/master`. It runs every release check,
creates the matching `vX.Y.Z` tag, and pushes only that tag. The protected **Release** workflow
publishes with provenance and then creates the GitHub Release from the changelog.

Never move or reuse a published version's tag. For workflow recovery, manually dispatch
`release.yml` with the existing tag.

## Failed release

Do not overwrite or routinely unpublish a released version. Deprecate a harmful version, document
the problem, and publish a corrected immutable patch.
