---
status: 採用
related:
  - docs/project/specs/contracts/SPEC-api-v0-contracts.md
  - docs/project/specs/shared/SPEC-permission-policy-gate.md
---

# Typed API Error

## 目的

UI、CLI、Verifier が失敗理由を機械的に扱えるようにする。

## 適用範囲

- API error
- Policy violation
- validation error
- command failure

## 適用しない範囲

- debug log

## パターン

API error は `code`, `message`, `details`, `violations`, `event_id`, `request_id` を持つ。

## 適用条件

- ユーザー判断や retry に影響する失敗。
- Policy / Verifier と接続する失敗。

## 例外 / 逸脱条件

- 内部 log は別途 tracing で扱う。

## 根拠

文字列 error だけでは Workbench の判断導線と監査に使いにくい。

## 関連資料

- `../specs/shared/SPEC-permission-policy-gate.md`
