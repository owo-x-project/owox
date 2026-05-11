# owox / owlcore Product Restructure

## 背景

既存資料では、Owox は AI Agent、AI coding CLI、人間、外部ツールが Context、Work Contract、Evidence、Verifier、Policy、Event Log を共有する制御プレーンとして設計されている。

一方、新方針では AI Agent First Terminal Workspace を `owox` とし、現 owox の制御プレーン機能を公式 plugin `owlcore` として再配置する。これにより、実行・操作面と、repo-native な文脈・契約・検収管理を分ける。

この proposal は正式要件への入れ替え前の草案であり、採用済み仕様ではない。

## 提案内容

### Product boundary

- `owox` は Open Workspace Orchestrator とする。
- `owox` は AI Agent First Terminal Workspace、terminal session manager、plugin host、plugin UI host、agent/session/process 操作面を担当する。
- `owlcore` は現 owox の Context / Work / Evidence 制御プレーン思想を引き継ぐ公式 plugin とする。
- 正式名称は `owox` と `owlcore`。どちらも小文字始まりとする。
- 公式 plugin は `owl*` 命名規則を使う。

### owox responsibilities

- 複数 AI agent / AI CLI の起動、監視、操作。
- terminal session 管理。
- Git diff 表示、簡易 file tree、簡易 editor、preview、logs、approvals。
- plugin runtime。
- plugin 固有 UI の mount / routing / panel / command integration。
- project repo 作業時に、必要な plugin context を組み合わせて AI CLI に渡す orchestration。

### owlcore responsibilities

- project repo に紐づく context 管理。
- Work Order / Work Contract。
- Evidence。
- Verifier。
- Policy。
- Event Log。
- Artifact / Repo Registry 相当の repo-native metadata。
- AI agent 作業の検収・記録・再現性管理。
- `owlcore` CLI 相当のツールによる project context 操作。

### Serverless repo-native model

- `owlcore` は完全 serverless を前提にする。
- 必須 runtime は CLI / library / owox plugin とする。
- HTTP daemon / 常駐 server は必須にしない。
- 正本は project repo 内の `.owox/owlcore/` に置く。
- 既存 `.owox/` layout との互換性は不要。実装前なので破壊変更可とする。

### Plugin ecosystem

- `owox` plugin は VSCode extension のように、将来的に community plugin を作れる形を目指す。
- plugin は固有 UI を追加できる。
- plugin は必要に応じて CLI / library / schema / UI / command を持てる。
- `owlcore` は公式 plugin の第一候補とする。

### Brand repo / company context

- 会社・ブランド思想は継続する。
- ただし v0/v1 初期の `owlcore` project repo 管理には直接混ぜない。
- brand repo は v2 以降の追加機能候補とする。
- brand repo はブランド固有 context を持つ repo として扱う。
- brand repo を別公式 plugin にするか、`owlcore` を拡張するかは将来判断する。
- brand context を project repo 作業に注入・接続する orchestration は `owox` 本体の責務候補とする。

### Roadmap split

- v0: `owox` 本体先行。
  - terminal workspace。
  - AI CLI / agent session 操作。
  - plugin host。
  - plugin UI host。
  - approvals / diff / logs / preview の基礎。
- v1: `owlcore` 公式 plugin。
  - `.owox/owlcore/` repo-native layout。
  - `owlcore` CLI / library。
  - project context / Work Contract / Evidence / Verifier / Event Log。
  - `owox` への plugin UI 接続。
- v2 以降: brand repo / company context。
  - 別 plugin か `owlcore` 拡張かを判断。
  - brand repo context を project repo 作業に使う orchestration。

### Existing docs migration

- この proposal 採用後、既存 requirements / specs / architecture / plan を一括改訂する。
- 既存 `Owox` 制御プレーン設計は `owlcore` へ移す。
- 既存 Workbench / Session Monitor / Repo Editor の記述は `owox` 本体 UI と `owlcore` plugin UI に分解する。
- 既存 `owoxd` server / HTTP API / WebUI static 配信の前提は再評価する。

## 代替案

### 代替案 A: 現 owox をそのまま制御プレーン名として維持する

- 不採用候補。
- 理由: 新 `owox` を Terminal Workspace として使う方針と名称衝突する。
- 現資料を小修正で済ませられるが、product boundary が曖昧になる。

### 代替案 B: `owlcore` を `owox` 内部機能として実装する

- 不採用候補。
- 理由: `owlcore` の repo-native / CLI / library 利用が弱くなり、plugin ecosystem の第一例として機能しにくい。

### 代替案 C: brand repo を v1 の `owlcore` 中核に含める

- 保留または不採用候補。
- 理由: v1 の project repo context / contract / evidence だけでも十分大きい。brand repo は別 plugin または拡張として v2 以降に分けるほうが安全。

### 代替案 D: `.owlcore/` を repo root に置く

- 不採用。
- 理由: 採用方針は `.owox/owlcore/`。`owox` plugin 所有領域として整理しやすい。

## 利点

- `owox` と `owlcore` の責務が明確になる。
- terminal / session / editor / preview / approvals を `owox` 本体に集約できる。
- Context / Work Contract / Evidence / Verifier / Event Log を `owlcore` に閉じられる。
- `owlcore` は server なしで project repo に紐づくため、Git review、clone、rollback、再現性と相性が良い。
- plugin UI を中核に置くことで、将来の community plugin と公式 `owl*` plugin 群の拡張余地ができる。
- brand repo を v2 以降に送ることで、v0/v1 のスコープ肥大化を避けられる。

## リスク

- 既存資料の `Owox` 名称が広範囲に使われており、改訂範囲が大きい。
- `owox` 本体と `owlcore` plugin の API 境界が未定義だと、再び責務が混ざる。
- serverless 方針により、一覧・検索・横断 query の実装場所を再設計する必要がある。
- `.owox/owlcore/` への破壊変更により、既存 `.owox/` 設計資料はそのまま使えない。
- plugin UI host は新しい中核機能であり、既存資料には仕様がない。

## 未確定事項

- `owox` plugin manifest / permission / command / UI mount 仕様。
- `owlcore` CLI command set。
- `owlcore` schema layout under `.owox/owlcore/`。
- `owlcore` が optional local index / cache を持つか。
- `owox` 本体と plugin のプロセス境界。
- brand repo を別 plugin にするか、`owlcore` 拡張にするか。
- 既存 ADR を改訂するか、archive して新 ADR に置き換えるか。

## 正式化先候補

- `docs/project/architecture.md`
  - `owox` / `owlcore` / plugin / repo-native の責務境界。
- `docs/project/glossary/core.md`
  - `owox`, `owlcore`, `owox plugin`, `official owl* plugin`, `plugin UI`, `brand repo`。
- `docs/project/requirements/`
  - `owox` 本体 requirements。
  - `owlcore` plugin requirements。
  - plugin ecosystem requirements。
  - brand repo future requirements。
- `docs/project/specs/`
  - plugin host spec。
  - plugin UI spec。
  - `owlcore` repo layout spec。
  - `owlcore` CLI/library spec。
- `docs/project/adr/active/`
  - product split ADR。
  - serverless repo-native `owlcore` ADR。
  - plugin ecosystem ADR。
- `docs/project/plan/`
  - v0 `owox` implementation plan。
  - v1 `owlcore` implementation plan。
  - v2 brand repo exploration plan。

## 関連資料

- `../../architecture.md`
- `../../glossary/core.md`
- `../../requirements/owox/v0/index.md`
- `../../requirements/owlcore/v1/index.md`
- `../../requirements/brand-repo/v2/index.md`
- `../../specs/index.md`
- `../../plan/v0-implementation/index.md`
- `../../adr/active/ADR-0001-initial-architecture-and-stack.md`
- `../../adr/active/ADR-0002-repo-backed-owox-store.md`
