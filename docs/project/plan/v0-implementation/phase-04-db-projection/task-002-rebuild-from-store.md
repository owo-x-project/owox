# Task 002 Rebuild From Store

## 目的

`.owox/` rebuild stream から projection DB を破棄再生成する。

## 前提条件

- Phase 03 Task 003 完了
- Task 001 完了

## 作業内容

- `rebuild_from_store` を実装する
- contexts / work orders / evidence / events / handoffs を projection へ投入する
- raw secret payload を保存しない

## 完了条件

- empty DB から rebuild できる
- rebuild 後の projection が fixture と一致する

## 検証方法

- `cargo test -p owox-db rebuild`

## 依存関係

- Phase 03 Task 003
- Task 001

## 成果物

- DB rebuild
