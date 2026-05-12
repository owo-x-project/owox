---
id: REQ-owox-product-scope
status: 採用
related:
  - docs/project/adr/active/ADR-0001-owox-owlcore-boundary.md
  - docs/project/architecture.md
---

# owox v0 Product Scope

## 目標

`owox` v0 は、AI Agent First な WebUI ベース Terminal Workspace / 簡易 IDE を提供する。

## 根拠

AI 駆動開発では、browser から project repo を開き、terminal、log、Git、file tree、editor、diff を一体で操作できる作業面が必要である。

## 対象範囲

- owox workspace root 直下の複数 project repo を一覧できる。
- project workspace を browser から開ける。
- terminal session を作成、表示、終了できる。
- AI CLI を含む任意 command を汎用 terminal session として起動、監視、log 表示できる。
- Git 操作を VS Code 標準 Source Control 相当で扱える。
- 簡易 file tree と簡易 editor を扱える。
- diff view を提供する。
- PC、tablet、smartphone で主要操作を完了できる。
- plugin manifest、command contribution、backend hook 予約を最小 extension point として持つ。

## 対象外

- `owlcore` の Context / Work Contract / Evidence / Verifier の完全実装。
- AI CLI 固有 adapter / agent runtime。
- agent CLI ごとの特殊 UI。
- team / multi-user 権限管理。
- community marketplace。
- 本格 IDE。
- LSP / debugger。
- 汎用 plugin UI 実行基盤。
- Git hosting / CI/CD / deployment service の再実装。

## 成功指標

- ユーザーが browser から project workspace を開き、terminal session と任意 command としての AI CLI を操作できる。
- Git status / diff / stage / commit / branch / remote sync 系操作を WebUI から実行できる。
- file tree、簡易 editor、diff view、log が同じ workspace 内で辿れる。
- PC、tablet、smartphone で主要操作を完了できる。

## 制約 / 品質条件

- `owox` 本体は owlcore domain を内蔵しない。
- AI CLI の出力を無検収で正本化しない。
- WebUI から利用できることを必須条件とする。
- v0 は個人セルフホストを対象にする。

## 関連資料

- `../../../architecture.md`
- `../../../adr/active/ADR-0001-owox-owlcore-boundary.md`
