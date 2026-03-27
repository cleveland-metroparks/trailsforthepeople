# Deployment

This project uses GitHub Actions with self-hosted runners that live on the target Linux VMs.

## Strategy

- Push to `develop` deploys to the `dev` environment.
- Push to `main` deploys to the `prod` environment.
- Each environment has its own Linux VM inside the CMP network.
- GitHub does not connect inbound to the servers or need VPN access.
- Instead, each VM runs a self-hosted GitHub Actions runner that maintains an outbound HTTPS connection to GitHub and waits for jobs.

This keeps the deployment model close to the current manual process:

1. Update the checked-out repo on the VM.
2. Install dependencies with `npm ci`.
3. Build with `npm run build`.

## Workflow File

The deployment workflow lives in the top-level repository `.github/workflows/deploy.yml` file, not inside the `new/` app folder.

It defines two jobs:

- `Deploy Dev`: runs when `develop` is pushed
- `Deploy Prod`: runs when `main` is pushed

Each job expects a GitHub Environment variable named `APP_DIR`, which should point to the full path of the repo checkout on that server.

## GitHub Setup

### 1. Create environments

Create these GitHub Environments in the repository settings:

- `dev`
- `prod`

Recommended:

- Leave `dev` unprotected while getting the flow working.
- Add required reviewers to `prod` later if you want manual approval before production deploys.

### 2. Add environment variables

For each environment, add:

- `APP_DIR`: absolute path to the checked-out app directory on that VM

Example values:

- `dev` -> `/var/www/new`
- `prod` -> `/var/www/new`

The paths do not need to match across environments, but each server must use the value configured for its environment.

### 3. Register self-hosted runners

Install one runner on the dev VM and one runner on the prod VM.

Recommended labels:

- Dev runner: `self-hosted`, `linux`, `dev`
- Prod runner: `self-hosted`, `linux`, `prod`

The workflow uses those labels to send jobs to the right machine.

## Server Setup

On each VM:

1. Ensure the machine can reach GitHub over outbound HTTPS.
2. Clone the repository into the intended deployment directory.
3. Make sure Node and npm are installed at versions compatible with `package.json`.
4. Install and start the GitHub Actions self-hosted runner.
5. Confirm the app's environment configuration is present on the server before the first automated build.

For the initial trial, using your existing user account is acceptable. Long term, a dedicated deploy user is safer and easier to reason about.

## What the Deploy Job Does

For `develop` on the dev VM:

```bash
cd "$APP_DIR"
git fetch origin
git checkout develop
git reset --hard origin/develop
npm ci
npm run build
```

For `main` on the prod VM, the branch name changes to `main`.

## Assumptions

The current workflow assumes:

- The repo is already cloned on each VM.
- The runner user has permission to update that checkout.
- Running `npm ci` and `npm run build` in `APP_DIR` is sufficient to update the deployed app.
- Any required `.env` or server-specific configuration already exists on the VM.

If the web server serves files from somewhere other than the repo's `dist/` directory, add a final copy or sync step after the build.

## First Dev Test

Suggested first pass:

1. Install the self-hosted runner on the dev VM.
2. Add the `dev` environment and set `APP_DIR`.
3. Push this workflow to GitHub.
4. Manually trigger the workflow with `workflow_dispatch` or push to `develop`.
5. Verify the Actions log shows the job running on the dev runner.
6. Confirm the built site is updated on the dev server.

## Security: Self-Hosted Runners on a Public Repo

GitHub warns that self-hosted runners on public repos can be exploited via forked PRs: a fork could open a PR that triggers a workflow run, executing the fork's code on your infrastructure.

**This workflow is not exposed to that risk.** It only triggers on `push` to `develop`/`main` and `workflow_dispatch` — both require write access to the upstream repo. A fork author cannot push to those branches, so no runner job is spawned.

### If PR triggers are added in the future

If you ever add a `pull_request` trigger to run checks (lint, type-check, etc.), follow these guidelines:

- **Do not run PR jobs on self-hosted runners.** Use GitHub-hosted runners for PR checks — they're free for public repos and fully isolated. Reserve self-hosted runners for deploy jobs on `develop`/`main` only.
- If a self-hosted runner is needed for a PR job, use `pull_request_target` (not `pull_request`) so the *base branch's* workflow code runs rather than the fork's. Be aware that even then, if the workflow checks out and builds the PR's code, a malicious `package.json` postinstall script could run arbitrary commands on the server.
- Enable fork PR approval gating: Settings → Actions → General → "Fork pull request workflows from outside collaborators" → require approval.

The safest long-term pattern: GitHub-hosted runners for all PR checks, self-hosted runners for deploys only.

## Future Improvements

Once the basic flow is working, consider:

- Add required approval on the `prod` environment.
- Run `npm run type-check` and `npm run lint` before deploy.
- Add a post-build sync step if the served web root differs from `dist/`.
- Move the runner to a dedicated deploy user.
- Run the self-hosted runner as a system service.
