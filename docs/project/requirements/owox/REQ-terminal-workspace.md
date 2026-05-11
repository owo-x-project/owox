---
id: REQ-terminal-workspace
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
---

# Terminal Workspace

## 目標

`owox` は AI agent と人間が同じ作業面で terminal、diff、file tree、editor、preview、logs、approvals を扱える Terminal Workspace を提供する。

## 根拠

AI CLI 作業は terminal と Git diff だけでなく、log、preview、approval、関連 file の確認が必要になる。これらを plugin が拡張できる workspace shell に集約する。

## 対象範囲

- workspace を開く。
- terminal session を作る。
- 複数 terminal session を切り替える。
- Git diff を表示する。
- 簡易 file tree を表示する。
- 簡易 editor を提供する。
- preview / logs / approvals の表示領域を提供する。
- plugin UI panel と共存する layout を提供する。

## 対象外

- 本格 IDE。
- LSP / debugger。
- Git hosting。
- CI/CD。
- `owlcore` の Context / Work Contract / Evidence domain。

## 成功指標

- ユーザーが project workspace を開き、terminal と diff を同じ画面で確認できる。
- plugin UI panel と terminal / diff / preview が同じ workspace 内で併用できる。
- AI CLI 作業中の log と approval 待ちが確認できる。

## 制約 / 品質条件

- `owox` 本体は plugin 固有 domain を持たない。
- editor は軽量確認・軽微修正に留める。
- terminal session 操作は Event または log として追跡可能にする。

## 関連資料

- `REQ-owox-product-scope.md`
- `REQ-plugin-host-ui.md`
