---
status: 採用
related:
  - docs/project/specs/contracts/SPEC-api-v0-contracts.md
---

# Command Endpoint

## 目的

状態遷移を明示し、Policy、Event、Verifier と接続する。

## 適用範囲

- Context Proposal accept / reject
- Contract revision 作成
- Session start / cancel / retry / submit
- Verification 実行
- Acceptance accept / reject / needs_revision

## 適用しない範囲

- read-only resource 取得

## パターン

GET は resource endpoint、状態変更は command endpoint とする。

## 適用条件

- Event を発行する操作。
- Policy check が必要な操作。

## 例外 / 逸脱条件

- 純粋な一覧、詳細、検索は resource endpoint とする。

## 根拠

Owox の主要操作は監査対象であり、CRUD より command として扱うほうが状態遷移を固定しやすい。

## 関連資料

- `../specs/contracts/SPEC-api-v0-contracts.md`
