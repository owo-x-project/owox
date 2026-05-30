# syntax=docker/dockerfile:1

# owox v0 self-host image.
#
# Single container = the Rust API/WS server (owox-server) + the built Solid
# WebUI (dist/), which the server serves as an SPA fallback behind the API.
#
# Build flow (multi-stage):
#   1. frontend-builder (node)  -> npm ci && npm run build  -> /app/dist
#   2. server-builder  (rust)   -> cargo build --release -p owox-server
#   3. runtime         (debian) -> server binary + dist + git + bash
#
# See docs/project/plan/v0/phase-06-plugin-packaging-release/PACKAGING.md

# ---------------------------------------------------------------------------
# Stage 1: frontend builder
# ---------------------------------------------------------------------------
FROM node:22-bookworm AS frontend-builder
WORKDIR /app

# Install JS deps from the lockfile first so this layer is cached unless the
# lockfile / manifest change.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the sources Vite/tsc need, then build the static assets.
# `npm run build` runs `tsc -b && vite build` and emits to ./dist (vite default
# outDir; vite.config.ts does not override it).
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
# tsconfig.json includes ["src", "tests"], so `tsc -b` type-checks tests too;
# copy them so the build sees exactly what it sees locally.
COPY tests ./tests
RUN npm run build
# Result: /app/dist (index.html + assets/)

# ---------------------------------------------------------------------------
# Stage 2: server builder
# ---------------------------------------------------------------------------
# Rust edition 2024 requires a recent toolchain; rust:1-bookworm tracks the
# latest stable 1.x on Debian bookworm.
FROM rust:1-bookworm AS server-builder
WORKDIR /src

# Build the release binary. We copy the whole workspace so the path
# dependency (owox-core) and the binary crate resolve correctly. The
# .dockerignore keeps target/, node_modules/, dist/, .git/, etc. out of the
# build context.
COPY Cargo.toml Cargo.lock ./
COPY crates ./crates
COPY apps ./apps
RUN cargo build --release -p owox-server
# Result: /src/target/release/owox-server

# ---------------------------------------------------------------------------
# Stage 3: runtime
# ---------------------------------------------------------------------------
FROM debian:bookworm-slim AS runtime

# Runtime OS deps:
#   git            - the Git workflow shells out to `git`
#   bash           - terminal sessions spawn $SHELL / /bin/bash via a PTY
#   ca-certificates- TLS roots for any outbound HTTPS (e.g. git over https)
# Without git + bash the app's Git and terminal features break at runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        bash \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Non-root runtime user. /data and /workspace are owned by it so the mounted
# SQLite/log dir and (when writable) the workspace are usable without root.
RUN useradd --create-home --uid 10001 --shell /bin/bash owox \
    && mkdir -p /app /data /workspace \
    && chown -R owox:owox /app /data /workspace

WORKDIR /app

# Copy the built artifacts from the earlier stages.
COPY --from=server-builder /src/target/release/owox-server /app/owox-server
COPY --from=frontend-builder /app/dist /app/dist

# Baked-in defaults (override at run time as needed):
#   OWOX_STATIC_DIR     - where the server finds the built WebUI to serve
#   OWOX_WORKSPACE_ROOT  - dir whose immediate Git repos become projects (mount)
#   OWOX_DATA_DIR       - logs etc. (persist via the /data volume)
#   OWOX_DATABASE_URL   - managed SQLite under /data (persist via the volume)
ENV OWOX_STATIC_DIR=/app/dist \
    OWOX_WORKSPACE_ROOT=/workspace \
    OWOX_DATA_DIR=/data \
    OWOX_DATABASE_URL="sqlite:///data/owox.sqlite3?mode=rwc"

USER owox

# Persist managed SQLite + logs. With no volume mounted here, /data lives only
# in the container's writable layer and is lost on `docker rm` (ADR-0004: no
# volume => no persistence guarantee).
VOLUME ["/data"]

# HTTP + WebSocket API and the WebUI.
EXPOSE 3000

# Liveness: the server exposes an unauthenticated /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/3000; \
        printf "GET /health HTTP/1.0\r\nHost: localhost\r\n\r\n" >&3; \
        grep -q "200" <&3' || exit 1

CMD ["/app/owox-server"]
