# Validation

## 目的

このファイルは、変更時に確認すべき検証方針を記録します。

## 読むべき場面

- 変更後に何をどう確認すべきか整理したいとき
- 検証観点を追加または更新したいとき

## 検証項目

## 仕様整合性

- いつ行うか: plugin API、plugin manifest、plugin UI、Work Contract、Context、Evidence、Event、状態遷移を追加または変更するとき。
- 何で検証するか: JSON Schema、plugin manifest validation、domain tests、plugin host tests、関連 docs の相互参照確認。
- 期待する結果: plugin contract、domain model、repo layout、docs の意味が一致する。
- 問題があった際にどうするか: 実装ではなく contract / spec を先に修正し、影響範囲を task に記録する。

## 回帰防止

- いつ行うか: Rust crate、WebUI、contracts、Verifier、Git 操作を変更するとき。
- 何で検証するか: `cargo check`, `cargo test`, `pnpm check`, schema validation, verifier test, harness validation。
- 期待する結果: 変更範囲の検証が成功し、必須 Evidence が task に残る。
- 問題があった際にどうするか: 失敗コマンド、失敗理由、次の修正 task を作業ログ Task に記録する。

## owlcore Acceptance / Rebuild

- いつ行うか: `.owox/owlcore/` layout、Event、Work Contract、Evidence、Policy、Verifier、acceptance flow を追加または変更するとき。
- 何で検証するか: acceptance fixture、JSON Schema validation、repo layout validation、rebuild test、Verifier rule fixture、Git diff fixture。
- 期待する結果: fresh clone の `.owox/owlcore/` から状態を再構築でき、required evidence と blocking policy が acceptance decision に反映される。
- 問題があった際にどうするか: 正本 `.owox/owlcore/` fixture、schema、spec の不一致箇所を特定し、実装修正前に contract / spec を更新する。

## Plugin 契約

- いつ行うか: plugin manifest、permission、command、UI mount、host capability を追加または変更するとき。
- 何で検証するか: manifest validation、plugin host fixture、permission denial test、UI mount fixture。
- 期待する結果: plugin の宣言、host capability、UI mount、command registration が `SPEC-plugin-host` と一致する。
- 問題があった際にどうするか: plugin API と host implementation の差分を task に記録し、片方だけの変更を禁止する。

## JSON Schema / Migration

- いつ行うか: entity / event / evidence / contract field、required、enum、schema_version を変更するとき。
- 何で検証するか: valid / invalid fixture、migration fixture、projection rebuild test。
- 期待する結果: v0 内の破壊的変更が検出され、enum 追加が plugin UI / Verifier fixture に反映される。
- 問題があった際にどうするか: migration 方針を spec に戻し、保存済み payload の読み込み互換性を確認する。

## Plugin UI 状態表示

- いつ行うか: `owox` shell、plugin UI component、Policy / Verifier 表示、Session stream、decision 操作を変更するとき。
- 何で検証するか: component fixture、UI state test、disabled 条件 test。
- 期待する結果: loading / empty / ready / error / forbidden と blocking violation disabled が表示・操作両方で一致する。
- 問題があった際にどうするか: UI 表示だけでなく command 実行前検査の欠落を確認する。

## Module / Crate 境界

- いつ行うか: Rust crate または package の public API、依存方向、orchestration を追加または変更するとき。
- 何で検証するか: crate-level tests、dependency graph review、protocol fixture parse / validation、testkit fixture。
- 期待する結果: `owox` host は plugin 固有 domain を内蔵せず、`owlcore-core` は DB / HTTP / process spawn / UI に依存せず、`owlcore-store` は cache に依存せず、cache は正本 write API を持たない。
- 問題があった際にどうするか: 実装ではなく crate spec の責務境界へ戻し、依存方向と public API を修正する。
