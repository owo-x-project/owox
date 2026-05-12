---
id: SPEC-ui-editor
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
  - docs/project/requirements/owox/v0/REQ-responsive-webui.md
subproject: owox
---

# Editor

## 概要

LSP なしの簡易 editor と syntax highlight の仕様。

## 関連要求

- `REQ-terminal-workspace`
- `REQ-responsive-webui`

## 入力

- selected project
- repo-relative file path
- text content
- create / save / rename / delete request

## 出力

- opened text document
- edited text document
- save result
- file operation result
- editor error

## 挙動

- v0 editor は text file の open / edit / save / create / rename / delete を扱う。
- syntax highlight を提供する。
- LSP / debugger は扱わない。
- mobile では file 選択後に full-screen editor として表示する。
- binary file は text editor で開かない。

## 状態遷移 / 不変条件

- editor の対象 path は常に selected project repo 内の repo-relative path とする。
- unsaved changes がある状態で close / path change / delete を行う場合は確認を挟む。
- save 成功後、file tree と diff view は対象 file の変更を反映できる。

## エラー / 例外

- boundary 外 path は拒否する。
- save conflict、permission error、not found、encoding error は error display に渡す。
- destructive file operation は destructive confirmation を経る。

## 横断ルール

- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- destructive confirmation は `SPEC-shared-destructive-confirmation.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- repo 内 text file を open / edit / save できる。
- create / rename / delete が repo boundary を越えない。
- unsaved changes が失われる操作で確認が出る。
- mobile で full-screen editor が操作不能にならない。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
- `../../requirements/owox/v0/REQ-responsive-webui.md`
