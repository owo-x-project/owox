# ADR-0001 Initial Architecture And Stack

## 状態

採用。具体 version 方針は `docs/project/tech-stack.md` で major 固定として管理する。

## 判断

Owox MVP は Rust daemon `owoxd` を中心とする monorepo とし、Rust crates、SvelteKit static WebUI、OpenAPI / JSON Schema contracts を分ける。採用技術と major version 方針は `docs/project/tech-stack.md` を正本とする。

## 背景

inbox 資料では、Owox を AI Agent / AI CLI / 人間 / 外部ツールの制御プレーンとして扱い、Context、Work Contract、Evidence、Diff Review を最初の核にする方針が繰り返し示されている。

## 代替案

- Web server を Node.js / SvelteKit server 中心にする: 本番 runtime の単純さと単一バイナリ配布方針に合わないため不採用。
- UI first で作る: 状態遷移、contract、verifier が後追いになりやすいため不採用。
- 自前 Git hosting / CI/CD / deployment を内蔵する: Owox の制御プレーン境界を広げすぎるため MVP では不採用。

## 理由

- Rust は状態遷移、policy、filesystem、Git 操作、検収ロジックを型で扱いやすい。
- Static WebUI を `owoxd` から配信すると、本番 runtime を単純に保てる。
- Contract first により AI CLI、WebUI、CLI、Verifier の境界を先に固定できる。
- SQLite と SQLx は個人セルフホスト MVP に合う。

## 影響

- `.agents/project.md` の Kind は `monorepo`。
- subproject は `crates`, `web`, `contracts`。
- `docs/project/specs/<subproject>/index.md` を維持する。
- 技術 version は major を `docs/project/tech-stack.md` で固定し、patch / minor は lockfile で固定する。

## 関連資料

- `../../architecture.md`
- `../../tech-stack.md`
- `../../validation.md`
