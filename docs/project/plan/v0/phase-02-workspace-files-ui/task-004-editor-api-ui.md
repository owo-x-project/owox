# Task 004: Editor API UI

## 目的

LSP なしの簡易 editor と file read / write API を実装する。

## 前提条件

- file tree から file selection できる。
- CodeMirror 6 採用方針が有効。

## 作業内容

- file read / write API を実装する。
- CodeMirror editor、syntax highlight、dirty state、save action を実装する。
- save conflict / binary / large file error を表示する。

## 完了条件

- text file を開き、編集、保存できる。
- dirty state と保存失敗が UI に出る。
- boundary 外 file と binary file は仕様どおり拒否される。

## 検証方法

- file read / write route test。
- editor state unit test。
- save conflict fixture test。

## 依存関係

- `task-003-file-tree-api-ui.md`
- `../../../specs/owox/SPEC-ui-editor.md`

## 成果物

- editor API。
- CodeMirror editor UI。
