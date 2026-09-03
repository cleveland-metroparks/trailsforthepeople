# Admin Security Review — Remaining Follow-ups

Findings from the security pass on the admin app that were **not** fixed in code,
captured here so they can be actioned later. Two findings from that pass are already
resolved on `develop`:

- **#3 Production source maps** → `sourcemap: false` (commit `13687ee5`)
- **#2 `VITE_SKIP_LOGIN` in prod builds** → Vite config now throws on `build` if set (commit `6292a019`)

## Framing

This is a SPA. The client-side guards (`ProtectedRoute`, the 401 interceptor,
`VITE_SKIP_LOGIN`) are **UX, not security** — anyone can edit JS in their browser and
render any route. The only real security boundary is the API: every `api/v1/*` endpoint
must independently authenticate the session cookie and authorize the action. Most items
below are therefore either backend work or defense-in-depth.

Severity legend: **Medium** = worth scheduling; **Low** = defense-in-depth / hygiene.

---

## #1 — Token endpoints: verify server-side authorization (Medium)

**Where:** `src/routes/user.tsx` — `revokeToken()` posts `{ token_id }` to `/tokens/revoke`
(line ~193); `createToken()` posts to `/tokens/create` (line ~110) and never sets abilities.

**Risk (IDOR):** The client trusts the API to confirm the token belongs to the calling
user. If `/tokens/revoke` revokes by ID without scoping to the authenticated user, any
logged-in user can revoke anyone's tokens. Because the UI never sends `abilities`, the
**server** is choosing what a new token can do — confirm the default is not `*` ("All").

**Not fixable in this repo** — the frontend cannot enforce authorization; a client-side
check would be trivially bypassed. Fix lives in the Laravel `maps-api` backend (not in this
checkout).

**To verify / fix (backend):**
- `/tokens/revoke` must scope the lookup to the authenticated user
  (e.g. `$request->user()->tokens()->where('id', $id)`), not a global `PersonalAccessToken::find($id)`.
- `/tokens/create` must grant least-privilege abilities by default (not `['*']`) — ideally
  let the caller request a scoped set and validate it.
- Confirm both endpoints require an authenticated session (and appropriate role, if the
  admin app is privileged).

---

## #4 — Stored-XSS handoff via the rich text editor (Medium, cross-repo)

**Where:** `src/routes/trailEdit.tsx` and `src/routes/markerEdit.tsx` save raw HTML via
`editor.getHTML()` (`form.setFieldValue("description"/"content", …)`).

**Risk:** The admin app never renders this HTML, so **this repo is safe**. But the public
`frontend` app does. If it renders trail/marker descriptions with `dangerouslySetInnerHTML`
without sanitization, persisted `<img onerror=…>` / `<script>` executes for every public
visitor. The injection point lives here; the impact lands there.

**To verify / fix:**
- Backend: sanitize HTML on write (allowlist tags/attributes; strip event handlers, `javascript:`).
- Public `frontend`: sanitize on render (e.g. DOMPurify) before any `dangerouslySetInnerHTML`.
- Defense-in-depth: a CSP (see #6) blunts execution even if markup slips through.

---

## #5 — Logout is best-effort; server session may survive (Low)

**Where:** `src/routes/logout.tsx` — on a failed `POST /logout`, the `.catch` still calls
`onLogout()`, clearing local state and navigating to `/login`.

**Risk:** If the logout request fails (network/server), the HttpOnly session cookie is still
valid server-side; a reload or another tab remains authenticated. The UI says "logged out"
when the session isn't actually killed.

**Options:**
- Surface the failure to the user (notification) instead of silently treating it as success, or
- Retry the logout, and/or
- Accept current UX but document that true session termination depends on the server call
  succeeding. (Server-side `SESSION_LIFETIME` still bounds the window.)

---

## #9 — Fresh-load `/logout` skips server-side session invalidation entirely (Medium)

From the security review of commit `b5f883d4` (server-validated session rewrite). Related to
#5 but distinct: #5 is a *failed* logout request; this is the request deterministically
**never being sent**.

**Where:** `src/routes/logout.tsx:12-29` — the effect only sends `POST /logout` when `user`
is truthy in the auth context. Regression introduced by the `useAuth.tsx` rewrite: `user`
used to hydrate synchronously from localStorage; it now starts `null` while the async boot
probe (`GET /user`) is in flight, and `/logout` is not wrapped in `ProtectedRoute`.

**Risk:** On any fresh document load of `/logout` (typed URL, bookmark, restored tab,
middle-click/cmd-click on the Logout nav link), the effect runs with `user === null`, takes
the "no user" branch, and navigates to `/login` **without ever invalidating the Sanctum
session**. The component unmounts before the probe resolves, so the POST never fires late.
The still-running boot probe then resolves 200 and `login.tsx` (`if (user) return
<Navigate to="/" />`) bounces the user back into the authenticated app. On a shared/kiosk
machine, the HttpOnly cookie stays valid for the full `SESSION_LIFETIME` — the next person
is fully authenticated as the admin.

**Fix (this repo):**
- Send `POST /logout` unconditionally before `onLogout()` (a 401 for an anonymous session
  is a harmless no-op), or
- Gate on `status` instead of `user`: render a spinner while `status === "loading"` and only
  decide after the boot probe resolves, or
- Best: move the server call into `onLogout` in `useAuth.tsx` so client and server logout
  can't diverge. (Also addresses the surface of #5 in one place.)

---

## #6 — No Content-Security-Policy (Low, defense-in-depth)

**Where:** no CSP meta in `index.html` and (presumably) no CSP response header.

**Risk:** No backstop for #4 or any future injection.

**Fix:** Add a CSP via the serving host (headers preferred over a meta tag). Start in
`Content-Security-Policy-Report-Only` to tune against the app's real needs (Mapbox, the API
origin, inline styles from Mantine/Emotion) before enforcing.

---

## #7 — Mapbox token hygiene (Low)

**Where:** `VITE_MAPBOX_TOKEN` (public `pk.` token) is inlined into the bundle — normal and
expected for Mapbox public tokens.

**Fix:** In the Mapbox account, URL-restrict the production token to your domains so it can't
be lifted from the bundle and used elsewhere on your quota.

---

## #8 — Server error messages echoed to the UI (Low)

**Where:** `src/routes/login.tsx` and `src/routes/user.tsx` render
`error.response.data.message` directly.

**Risk:** Low in an authenticated admin tool, but can leak backend internals.

**Fix:** Keep messages user-friendly; ensure the API never returns stack traces / internal
detail in production responses.

---

## Suggested order

1. **#1** — backend authorization on token endpoints (real privilege/IDOR risk).
2. **#9** — fix the fresh-load `/logout` skip (deterministic, trivial fix; folds in #5).
3. **#4** — sanitize rich-text HTML on write + render (stored XSS reaching the public site).
4. **#6** — add a CSP (backstops #4).
5. **#5, #7, #8** — hygiene, low effort.
