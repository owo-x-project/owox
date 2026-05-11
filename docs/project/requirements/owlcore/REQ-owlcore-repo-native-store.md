---
id: REQ-owlcore-repo-native-store
status: 採用
related:
  - docs/project/requirements/owlcore/v1/REQ-owlcore-product-scope.md
  - docs/project/adr/active/ADR-0003-owox-owlcore-product-split.md
---

# owlcore Repo Native Store

## 目標

`owlcore` は project repo 内 `.owox/owlcore/` を Context、Work Contract、Evidence、Policy、Event Log の正本として扱う。

## 根拠

project に関する文脈と検収記録は、コード変更と同じ repo で review、diff、clone、rollback できるほうが再現性と監査性が高い。

## 対象範囲

- `.owox/owlcore/` layout を定義する。
- entity snapshot を JSON として保存する。
- Event を append-only JSONL として保存する。
- Evidence artifact を repo 内 path または content ref として扱う。
- schema validation を提供する。
- optional cache / index は正本から再構築可能にする。

## 対象外

- 旧 `.owox/` layout 互換。
- SQLite を正本にすること。
- remote database を必須にすること。
- brand repo layout。

## 成功指標

- fresh clone した repo から `owlcore` 状態を再構築できる。
- `.owox/owlcore/` の変更を Git diff で確認できる。
- Event Log が追記型として検査できる。
- schema validation で不正 payload を検出できる。

## 制約 / 品質条件

- 実装前の破壊変更として旧 `.owox/` 互換は不要。
- cache / index は正本ではない。
- secret 本体を保存しない。

## 関連資料

- `REQ-owlcore-product-scope.md`
- `../../../architecture.md`
