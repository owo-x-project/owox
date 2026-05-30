# owox

[日本語版はこちら](README.ja.md)

**Open Workspace Orchestrator** — A self-hosted workspace you open in your browser to manage terminals, files, and Git repositories from any device.

owox lets you run terminal sessions (including AI coding tools), browse and edit files, and perform Git operations — all through a browser-based interface that works on desktops, tablets, and smartphones.

> v0 is designed for personal self-hosting. Multi-user and team features are not included.

## Features

- **Terminal** — Run any command-line program in your browser. Sessions persist across page reloads, and input/output history is saved automatically.
- **AI Tool Integration** — Launch AI coding assistants (Claude Code, Codex, Gemini CLI, etc.) as regular terminal sessions. No special configuration required — if it runs in a terminal, it works in owox.
- **File Manager** — Browse your project files in a tree view and edit them with syntax highlighting. Concurrent edit conflicts are detected automatically.
- **Git Operations** — Stage, commit, diff, branch, push, pull, and more — equivalent to a standard source control panel. Destructive actions always require confirmation.
- **Multi-Device** — The interface adapts to your screen size. On phones, panels slide in as sheets so every feature remains accessible.
- **Multi-Project** — Point owox at a directory containing your Git repositories. It detects them automatically and lets you switch between projects.

## Install

### Download a Binary

Download the archive for your platform from [GitHub Releases](https://github.com/owoDra/owox/releases), extract it, and run the included `owox-server` executable. The `dist/` folder bundled in the archive provides the browser interface.

```bash
# Example: Linux x64
tar xzf owox-v0.1.0-x86_64-unknown-linux-gnu.tar.gz
cd owox
OWOX_WORKSPACE_ROOT=/path/to/your/repos ./owox-server
```

Open **http://localhost:3000** in your browser.

### Docker

```bash
docker compose up --build
# Open http://localhost:3000
```

Edit `compose.yaml` to mount your repository directory. Data is persisted in a named volume.

### Build from Source

Requirements: Rust 1.85+, Node.js 20+, Git, Bash.

```bash
git clone https://github.com/owoDra/owox.git
cd owox
npm install
npm run build
cargo build --release -p owox-server
OWOX_WORKSPACE_ROOT=/path/to/your/repos ./target/release/owox-server
```

Open **http://localhost:3000** in your browser.

## Usage

1. Set `OWOX_WORKSPACE_ROOT` to a directory that contains one or more Git repositories.
2. Start `owox-server`.
3. Open **http://localhost:3000** in your browser.
4. Select a project from the sidebar and start working — open terminals, edit files, or manage Git branches.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `OWOX_WORKSPACE_ROOT` | Current directory | Directory containing your Git repositories |
| `OWOX_DATABASE_URL` | `sqlite://owox.sqlite3?mode=rwc` | Path to the metadata database |
| `OWOX_DATA_DIR` | `.owox-data` | Directory for logs and runtime data |
| `OWOX_STATIC_DIR` | `dist` | Directory with the built browser interface |

The server listens on `0.0.0.0:3000`.

## Development

```bash
# Terminal A: Start the API server
OWOX_WORKSPACE_ROOT=/path/to/your/repos cargo run -p owox-server

# Terminal B: Start the frontend dev server (proxies API to port 3000)
npm run dev
```

Open **http://localhost:5173** in your browser.

### Tests and Checks

```bash
cargo test --workspace        # Rust tests
cargo clippy --workspace      # Rust linting
npm run typecheck             # TypeScript type checking
npm test                      # Frontend tests
npm run lint                  # Code style checks
```

## License

MIT License. See [LICENSE](LICENSE).
