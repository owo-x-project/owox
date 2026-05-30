# owox v0 Docker Packaging Runbook

Phase 06 / task-002. Produces one production image that builds the Solid
frontend and the Rust server, then runs a single container serving the WebUI +
API/WS, with project repos mounted from the host and SQLite/logs persisted via
a volume.

> Status: the Dockerfile / `.dockerignore` / `compose.yaml` were **authored**
> in this environment but **not built here** — no Docker daemon is available.
> The two underlying build commands (`npm run build`, `cargo build --release -p
> owox-server`) were run locally and verified to succeed (see "Local
> verification" below). The exact commands to build and smoke the image on a
> machine with Docker are given here.

## Owned files

- `Dockerfile` (repo root) — 3-stage build.
- `.dockerignore` (repo root) — keeps the build context small.
- `compose.yaml` (repo root) — runnable example.
- This runbook.

## What the image is

A single container is **server binary + built `dist/`**. The Rust server
(`owox-server`) reads `OWOX_STATIC_DIR` (default `dist`) and, when that
directory exists, serves it as an SPA fallback behind the API. So there is no
separate web server — the Rust process serves both the API/WebSocket and the
static WebUI on `0.0.0.0:3000`.

## Multi-stage build flow

1. **frontend-builder** (`node:22-bookworm`): `npm ci` then `npm run build`
   (`tsc -b && vite build`) → static assets at `/app/dist`.
2. **server-builder** (`rust:1-bookworm`, supports edition 2024): `cargo build
   --release -p owox-server` → `/src/target/release/owox-server`.
3. **runtime** (`debian:bookworm-slim`): installs `git`, `bash`,
   `ca-certificates`; copies the server binary and `dist`; creates a non-root
   user (`owox`, uid 10001); bakes env defaults; `WORKDIR /app`; `EXPOSE 3000`;
   `VOLUME ["/data"]`; `HEALTHCHECK` on `/health`; `CMD ["/app/owox-server"]`.

### Why `git` + `bash` are in the runtime image

This is the most common packaging mistake for this app, so it is called out
explicitly:

- **git** — the Git workflow (status/diff/commit/checkout) shells out to the
  `git` binary. No `git` ⇒ all Git features fail at runtime.
- **bash** — terminal sessions spawn `$SHELL` / `/bin/bash` through a PTY. No
  shell ⇒ the terminal feature is dead. `bash` is also used by the
  `HEALTHCHECK` (via `/dev/tcp`, so no `curl`/`wget` is needed in the image).

`ca-certificates` is included so outbound HTTPS (e.g. `git` over https) has TLS
roots.

## Environment variables (baked-in defaults)

| Variable | Image default | Meaning |
| --- | --- | --- |
| `OWOX_STATIC_DIR` | `/app/dist` | Built WebUI the server serves as SPA fallback. |
| `OWOX_WORKSPACE_ROOT` | `/workspace` | Dir whose immediate Git repos become projects. Mount the host repos here. |
| `OWOX_DATA_DIR` | `/data` | Logs etc. Persist via the `/data` volume. |
| `OWOX_DATABASE_URL` | `sqlite:///data/owox.sqlite3?mode=rwc` | Managed SQLite under `/data`. Persist via the volume. |
| `OWOX_PLUGINS_DIR` | (unset) | Optional plugin directory. |

The server listens on `0.0.0.0:3000` (not configured via the above).

### Where provider API keys live

Nowhere in owox. Per `docs/project/integrations/docker.md`, the **provider API
key is the external AI CLI's responsibility, not owox's**. Do not bake provider
keys into this image or set them in `compose.yaml`. They belong to whatever AI
CLI the user runs (in a terminal session or on the host), governed by that
CLI's own credential handling.

## Workspace-root mount semantics

`OWOX_WORKSPACE_ROOT` (`/workspace` in the image) is the **workspace root**.
Per `SPEC-shared-workspace-boundary`:

- Only the **immediate** subdirectories of the workspace root that are Git
  repos are discovered as projects (no deep recursion).
- File / Git / terminal command cwd is constrained to the selected project
  repo; `..` and symlinks may not escape the repo boundary.
- Clients reference projects/sessions/commands by server-issued opaque ids,
  not by host absolute paths.

Mount your host repos directory there read-write so Git and the file editor can
write back:

```
-v /absolute/path/to/your/repos:/workspace
```

Use `:ro` if you only want read-only browsing.

## SQLite / log persistence (volume vs no-volume)

owox manages project / session / log metadata and UI state in SQLite + logs
under `/data` (ADR-0004). The image declares `VOLUME ["/data"]`.

- **With a named volume** (compose's `owox-data`, or `-v owox-data:/data`):
  metadata and logs survive `docker rm` / `docker compose down` and container
  recreation.
- **Without a volume**: `/data` lives only in the container's writable layer.
  Per ADR-0004, **no volume ⇒ no persistence guarantee** — the SQLite DB and
  logs are lost when the container is removed.

Project **source code** is never stored in `/data`; it lives in the mounted
workspace repos. Runtime metadata is deliberately kept out of the repos.

## How to build

With Docker available:

```sh
# from the repo root
docker build -t owox:v0 .
```

or via compose:

```sh
docker compose build
```

## How to run

### docker compose (recommended)

1. Edit `compose.yaml`: replace the `./workspace` mount with the absolute path
   to your repos directory.
2. Start:

```sh
docker compose up --build
```

3. Open <http://localhost:3000>.

### plain docker run

```sh
docker run --rm \
  -p 3000:3000 \
  -v /absolute/path/to/your/repos:/workspace \
  -v owox-data:/data \
  owox:v0
```

Omitting `-v owox-data:/data` runs without persistence (see above).

## Container smoke procedure

Run this on a machine with Docker to confirm the image works end to end:

```sh
# 1. Build
docker build -t owox:v0 .

# 2. Prepare a workspace with at least one Git repo
mkdir -p /tmp/owox-ws/demo && git -C /tmp/owox-ws/demo init -q

# 3. Run
docker run -d --name owox-smoke \
  -p 3000:3000 \
  -v /tmp/owox-ws:/workspace \
  -v owox-data:/data \
  owox:v0

# 4. Health: expect HTTP 200
curl -fsS http://localhost:3000/health

# 5. WebUI: expect the SPA index.html (200 + HTML)
curl -fsS http://localhost:3000/ | head

# 6. Project discovery: the mounted `demo` repo should appear
curl -fsS http://localhost:3000/api/projects

# 7. Open http://localhost:3000 in a browser and confirm the `demo`
#    project is listed.

# cleanup
docker rm -f owox-smoke
```

The built-in `HEALTHCHECK` performs the equivalent of step 4 every 30s;
`docker ps` will show the container as `healthy` once it is serving.

## Local verification done in this environment (no Docker)

The Docker build could not be executed (no daemon), but the two build commands
the image relies on were run on this machine and both succeeded:

- `npm run build` → emitted `dist/index.html` + `dist/assets/` (Vite default
  `outDir`, not overridden in `vite.config.ts`).
- `cargo build --release -p owox-server` → emitted
  `target/release/owox-server` (Rust 1.95.0, edition 2024) — proving the
  server-builder stage's command and `-p` package selector are correct.

## References

- `docs/project/integrations/docker.md` — container boundary; provider keys are
  the external AI CLI's responsibility.
- `docs/project/specs/owox/SPEC-shared-workspace-boundary.md` — workspace root
  semantics.
- `docs/project/adr/active/ADR-0004-sqlite-managed-state.md` — no volume ⇒ no
  persistence guarantee.
- `docs/project/tech-stack.md` — Rust/Axum + Solid/Vite + SQLite + Docker.
