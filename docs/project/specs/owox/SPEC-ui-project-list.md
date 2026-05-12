---
id: SPEC-ui-project-list
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/requirements/owox/v0/REQ-responsive-webui.md
subproject: owox
---

# Project List

## 概要

owox workspace root 配下の project repo 一覧と workspace 切替の仕様。

## 関連要求

- `REQ-owox-product-scope`
- `REQ-responsive-webui`

## 入力

- configured owox workspace root
- directory entries directly under workspace root
- selected project id / path

## 出力

- project list
- selected project
- project open result
- project detection errors

## 挙動

- owox workspace root 直下の `.git` を持つ directory を project repo として検出する。
- 再帰探索は v0 では行わない。
- project 選択後、workspace shell は selected project に切り替わる。
- brand repo / brand context は v0 では扱わない。

## 状態遷移 / 不変条件

- selected project は常に owox workspace root 直下の Git repo である。
- selected project が失われた場合、workspace shell は project list に戻る。

## エラー / 例外

- workspace root が存在しない場合は project list を表示せず error を表示する。
- `.git` を持つ directory がない場合は empty state を表示する。
- workspace root 直下の directory を読めない場合は対象 directory を skipped として扱い、error log に記録する。

## 横断ルール

- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- workspace root 直下の Git repo だけが project list に出る。
- nested Git repo は v0 では自動検出されない。
- selected project 切替で terminal / files / review context が切り替わる。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-owox-product-scope.md`
- `../../requirements/owox/v0/REQ-responsive-webui.md`
