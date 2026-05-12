---
id: SPEC-shared-destructive-confirmation
status: 採用
related:
  - docs/project/requirements/owox/v0/REQ-git-workflow.md
  - docs/project/validation.md
subproject: owox
---

# Destructive Confirmation

## 概要

破壊的操作の確認 UI / API の横断仕様。

## 関連要求

- `REQ-git-workflow`

## 入力

- destructive operation type
- affected project
- affected path / branch / target list
- confirmation phrase or token

## 出力

- confirmed / cancelled result
- confirmation audit log

## 挙動

- 破壊的操作は強確認を必須とする。
- confirmation UI は操作種別、対象 project、対象 path / branch / target list、不可逆性を表示する。
- 操作によっては対象名入力などの confirmation phrase を要求する。
- confirmation 完了前に API は破壊的操作を実行しない。

## 状態遷移 / 不変条件

- confirmation は特定 operation request に紐づく。
- confirmation token は別操作に再利用できない。
- confirmation 後に対象が変化した場合、再確認を要求する。

## エラー / 例外

- confirmation phrase が一致しない場合は実行しない。
- 対象一覧取得に失敗した場合は実行しない。

## 横断ルール

- Git discard、file delete、overwrite、dirty tree checkout は destructive confirmation を必須とする。
- error display は `SPEC-shared-error-display.md` に従う。

## 検証観点

- destructive operation が confirmation なしに実行されない。
- 対象名入力が必要な操作で phrase mismatch が拒否される。
- confirmation 後に対象が変化した場合、再確認になる。

## 関連資料

- `index.md`
- `../../requirements/owox/v0/REQ-git-workflow.md`
- `../../validation.md`
