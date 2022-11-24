# Contributing

:wave: Thanks for your interest in `lambda-params-secrets`.

Please submit [Bug Reports](https://github.com/fedonev/lambda-params-secrets/issues/new/choose) and [Feature Requests](https://github.com/fedonev/lambda-params-secrets/issues/new/choose) as issues.
:tada: Pull Requests are also welcome!

Please ask questions about the AWS Lambda Parameters and Secrets Extension or other AWS services on [Stack Overflow](https://stackoverflow.com/questions/tagged/aws-lambda).

## Commits
The project uses the [Release Please](https://github.com/google-github-actions/release-please-action) GitHub Action to manage releases.
Commits must be [Conventional Commits](https://github.com/google-github-actions/release-please-action#how-should-i-write-my-commits) for this to work properly.  Commits should be [atomic](https://en.wikipedia.org/wiki/Atomic_commit#Atomic_commit_convention), meaning they should have exactly one working functional change.
A PR should have either a single commit or be squashable into one.

Valid message subjects match the pattern:

```regex
^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)!?(\([a-z0-9-]*\))?:\ .{3,}$|^[iI]nitial [cC]ommit$
```

Version-changing subjects start with `fix:` (patch), `feat:` (minor), `fix!:` (major) and `feat!:` (major).
These commit messages should include an issue reference (`Fixes: #X` or `Closes: #X`) in the body, which GitHub will helpfully extract.
Scope is optional.

```
fix: something broken now works

Fixes: #21
```

## Linting

The project puts [ESLint](https://eslint.org) in charge of linting.
It applies the [Prettier](https://prettier.io/docs/en/integrating-with-linters.html) rules.
Before pushing your code changes, make sure there are no linting errors with `npm run lint`.
To fix any errors, run `npm run lint -- --fix`.
The repo has VSCode lint-on-save settings in `.vscode/settings.json`.

## Testing

New functionality should be covered by a test.
The project uses [Jest](https://jestjs.io/docs/getting-started) for unit testing.
Ensure tests are passing with `npm test`.


## CI/CD Setup

The project follows the [Trunk-Based Development](https://trunkbaseddevelopment.com) model.
The trunk branch is `main`.
Commits are merged to `main` by rebasing (or squashing if necessary), but never with merge commits.  This keeps the history linear.
Upon a release the `stable` branch is updated.

### GitHub Workflows
- When a Pull Request is opened or changed, the `check-pr.yml` workflow (a) lints the commit message, (b) lints the code, and (c) runs the unit tests.
- When a commit is pushed to `main`, the `release-please.yml` workflow runs. The [release-please-action](https://github.com/google-github-actions/release-please-action) conditionally creates or updates a [Release PR](https://github.com/googleapis/release-please#whats-a-release-pr) to keep track of new version-changing commits.  Release Please relies on the commit message to determine which changes are release-worthy.
- When the Release PR is merged to `main` (a manual step), `release-please.yml` runs again, updating `CHANGELOG.md` and `package.json` with a `chore(main): release X.X.X` commit.  It then creates a tag and publishes a release.
- When a Release is published, three workflows run in parallel. They (a) publish the package to npm,  (b) publish the docs to GitHub pages, and (c) merge the new Release onto the `stable` branch.

### npm Package Publishing

The `publish-npm.yml` workflow publishes the [lambda-params-secrets](https://www.npmjs.com/package/lambda-params-secrets) package to npm upon each Release.

### Documentation Publishing

The [docs](https://fedonev.github.io/lambda-params-secrets/) are updated upon each Release by the `publish-docs.yml` workflow.
The workflow builds the docs with [TypeDoc](https://typedoc.org) and publishes them to GitHub Pages.


## Versioning

Post-`v1.0.0` versions follow SemVer rules.
Pre-`v1.0.0` breaking changes do not bump a major version.







