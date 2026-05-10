# Validation

## 目的

このファイルは、変更時に確認すべき検証方針を記録します。

## 読むべき場面

- 変更後に何をどう確認すべきか整理したいとき
- 検証観点を追加または更新したいとき

## 検証項目

## 仕様整合性

- いつ行うか: Work Contract、Context、Evidence、Event、API、状態遷移を追加または変更するとき。
- 何で検証するか: JSON Schema、OpenAPI、domain tests、API tests、関連 docs の相互参照確認。
- 期待する結果: contract、domain model、API DTO、docs の意味が一致する。
- 問題があった際にどうするか: 実装ではなく contract / spec を先に修正し、影響範囲を task に記録する。

## 回帰防止

- いつ行うか: Rust crate、WebUI、contracts、Verifier、Git 操作を変更するとき。
- 何で検証するか: `cargo check`, `cargo test`, `pnpm check`, schema validation, verifier test, harness validation。
- 期待する結果: 変更範囲の検証が成功し、必須 Evidence が task に残る。
- 問題があった際にどうするか: 失敗コマンド、失敗理由、次の修正 task を作業ログ Task に記録する。
