# Deployment

Canonical deployment guide for this repository (public frontend + admin frontend).

## Strategy

- Push to `develop` deploys to the `dev` environment.
- Push to `main` deploys to the `prod` environment.
- Deploys are per branch, not per app: a push runs both the frontend and admin jobs for that environment.
- Each environment has its own Linux VM inside the CMP network.
- GitHub does not connect inbound to the servers or need VPN access.
- Each VM runs a self-hosted GitHub Actions runner that keeps an outbound HTTPS connection to GitHub and waits for jobs.

## Workflow File

Deployment is defined in `.github/workflows/deploy.yml`.

Current jobs:

- `deploy-frontend-dev`
- `deploy-admin-dev`
- `deploy-frontend-prod`
- `deploy-admin-prod`

## Releasing

Each app is versioned and tagged independently. Releases are cut on `main`; pushing `main` is what deploys to prod.

1. Make sure `main` is up to date and contains everything that should ship (including any changes for the *other* app, since a push to `main` deploys both).
2. Make sure nothing else is staged. The release commit includes everything in the index, not just the version files.
3. Bump the version in the app's directory (`admin/` or `frontend/`):

   ```bash
   cd admin
   npm version patch --no-git-tag-version   # or minor / major
   ```

   Each app's `version` script in `package.json` then stages `package.json` and `package-lock.json`, commits them as `Admin X.Y.Z` / `Frontend X.Y.Z` (running the husky pre-commit lint and type-check), and tags the commit `admin-X.Y.Z` / `frontend-X.Y.Z`. `--no-git-tag-version` only disables npm's built-in commit and `vX.Y.Z` tag, so the app-prefixed tag is the only one created.
4. Push the branch and the tag:

   ```bash
   git push origin main
   git push origin admin-1.6.4
   ```

5. Watch the **Deploy** workflow in the repo's Actions tab and confirm the prod job succeeded.

When releasing both apps together, run `npm version` in each app directory, then push `main` and both tags once.

Versioning is bookkeeping only: the workflow deploys on any push to `main`/`develop` and does not check versions or tags, and pushing a tag alone does not deploy.

## GitHub Setup

### 1. Create environments

Create these GitHub Environments in repository settings:

- `dev`
- `prod`

### 2. Add environment variables

For each environment, add:

- `APP_DIR`: absolute path to the public frontend checkout directory
- `ADMIN_APP_DIR`: absolute path to the admin frontend checkout directory

Example values:

- `dev` -> `APP_DIR=/var/www/frontend` and `ADMIN_APP_DIR=/var/www/admin`
- `prod` -> `APP_DIR=/var/www/frontend` and `ADMIN_APP_DIR=/var/www/admin`

The paths do not need to match across environments, but each server must use the values configured for its environment.

### 3. Register self-hosted runners

Install one runner on the dev VM and one runner on the prod VM.

Recommended labels:

- Dev runner: `self-hosted`, `linux`, `dev`
- Prod runner: `self-hosted`, `linux`, `prod`

The workflow uses those labels to route jobs to the right machine.

## Server Setup

On each VM:

1. Ensure outbound HTTPS connectivity to GitHub.
2. Clone each app into the intended deployment directory (`APP_DIR` for public frontend, `ADMIN_APP_DIR` for admin frontend).
3. Install Node 24 LTS (see `.nvmrc` and each app's `package.json` `engines`). Install from NodeSource as recorded in `sys-configs/maps-dev/setup.yml` (server configs are applied manually).
4. Install and start the GitHub Actions self-hosted runner.
5. Ensure required server-side environment configuration exists before first automated build.

## Deploy Steps Per App

### Public frontend (`APP_DIR`)

The deploy job does:

```bash
cd "$APP_DIR"
git fetch origin
git checkout <branch>
git reset --hard origin/<branch>
npm ci
npm run build
```

`<branch>` is `develop` for dev deploys and `main` for prod deploys.

### Admin frontend (`ADMIN_APP_DIR`)

The deploy job does:

```bash
cd "$ADMIN_APP_DIR"
git fetch origin
git checkout <branch>
git reset --hard origin/<branch>
npm ci
npm run build
```

`<branch>` is `develop` for dev deploys and `main` for prod deploys.

## Assumptions

The current workflow assumes:

- The relevant checkout(s) already exist on each VM.
- The runner user can update those checkouts.
- Running `npm ci` and `npm run build` in each app directory is sufficient to produce deployable output.
- Any required `.env` or server-specific config already exists on the VM.

If Nginx or another web server serves from a location other than each app's build output, add a final copy/sync step after build.

## First Dev Test

Suggested first pass:

1. Install self-hosted runner on dev VM.
2. Add `dev` environment variables `APP_DIR` and `ADMIN_APP_DIR`.
3. Push workflow changes to GitHub.
4. Trigger via `workflow_dispatch` or push to `develop`.
5. Confirm both dev deploy jobs run on the dev runner.
6. Confirm both apps are updated on dev infrastructure.

## Security: Self-Hosted Runners on Public Repo

GitHub warns that self-hosted runners on public repos can be abused through fork PR workflows if untrusted code is executed on your infrastructure.

Current workflow avoids that risk because it only triggers on:

- `push` to `develop` / `main`
- `workflow_dispatch`

Both require write access to upstream repo branches.

### If PR triggers are added later

- Do not run PR jobs on self-hosted runners; use GitHub-hosted runners for PR checks.
- If self-hosted PR jobs are ever unavoidable, prefer `pull_request_target` and be extremely careful about checking out/building fork code.
- Enable fork PR approval gating in Actions settings.

Safest long-term split: GitHub-hosted runners for PR checks, self-hosted runners for deploy jobs only.

## Future Improvements

- Add `lint` and `type-check` gates before deploy.
- Add post-build sync/reload steps if required by runtime hosting layout.
- Move runners to dedicated deploy users.
- Run runners as system services.
