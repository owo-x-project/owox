---
id: REQ-terminal-workspace
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
---

# Terminal Workspace

## 目標

`owox` は AI agent と人間が同じ作業面で terminal、log、Git、diff、file tree、簡易 editor を扱える Terminal Workspace を提供する。

## 根拠

AI CLI 作業は terminal だけでは完結しない。log、Git change、関連 file、diff を browser 上で横断確認できる作業面が必要である。

## 対象範囲

- workspace を開く。
- terminal session を作る。
- AI CLI を含む任意 command を terminal session として起動する。
- 複数 terminal session を切り替える。
- session log を表示する。
- Git status / diff と連動する。
- 簡易 file tree を表示する。
- syntax highlight 付き簡易 editor を提供する。
- browser reload 後に session / log を再表示する。

## 対象外

- 本格 IDE。
- LSP / debugger。
- Git hosting。
- CI/CD。
- 外部仕様管理、作業契約、証拠正本化、検収自動化。
- AI CLI 固有 adapter。
- agent runtime。
- agent CLI ごとの特殊 UI。

## 成功指標

- ユーザーが project workspace を開き、terminal と diff を同じ画面で確認できる。
- terminal、log、file tree、editor、diff を同じ workspace 内で併用できる。
- AI CLI を固有 adapter なしで汎用 terminal session として起動、監視できる。
- browser reload 後も session / log を追跡できる。

## 制約 / 品質条件

- `owox` 本体は plugin 固有 domain を持たない。
- editor は LSP なしの簡易 editor とする。
- terminal session 操作は Event または log として追跡可能にする。
- agent CLI ごとの特殊 UI は後続 plugin / integration に委譲する。

## 関連資料

- `REQ-owox-product-scope.md`
- `REQ-agent-session-runtime.md`
