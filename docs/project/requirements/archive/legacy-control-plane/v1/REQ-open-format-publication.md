---
id: REQ-open-format-publication
status: 提案中
related:
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-work-contract.md
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-context-governance.md
  - docs/project/requirements/archive/legacy-control-plane/v0/REQ-evidence-verification.md
  - docs/project/specs/contracts/index.md
---

# Open Format 公開

## 目標

Owox v1 は、v0 で内部フォーマットとして運用した Work Contract、Context Capsule、Evidence Report を外部連携可能な Open Format として公開する準備を行う。

## 根拠

v0 は Open format の正式公開を対象外にする。実装と運用が固まった後、最初に Open Work Contract を切り出し、その後 Context Capsule と Evidence Report を公開するのが望ましい。

## 対象範囲

- Open Work Contract を定義する。
- Context Capsule format を定義する。
- Evidence Report format を定義する。
- CLI adapter protocol を定義する。
- MCP server 公開要件を整理する。

## 対象外

- 実装が固まる前に大きな規格群を標準として公開すること。
- Owox 内部状態をすべて外部 format に漏らすこと。
- 互換性維持方針がない format 公開。
- 外部ツールに Official Context の直接変更権限を与えること。

## 成功指標

- Open Work Contract の必須項目と optional 項目が明確である。
- Context Capsule と Evidence Report の公開境界が明確である。
- CLI adapter protocol が Work Contract、Evidence、Verifier と対応している。
- format versioning と互換性方針を確認できる。

## 制約 / 品質条件

- 最初に公開する format は Open Work Contract を優先する。
- 公開 format は内部 schema と実運用の安定後に切り出す。
- 外部公開後も Policy、Verifier、Event Log の監査性を維持する。

## 関連資料

- `../v0/REQ-work-contract.md`
- `../v0/REQ-context-governance.md`
- `../v0/REQ-evidence-verification.md`
- `../../specs/contracts/index.md`
