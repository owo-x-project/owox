# Core Glossary

このファイルは、プロジェクト全体で必読となる共通用語を置きます。

## Owox

AI Agent、AI coding CLI、人間、外部ツールが、必要最小限の文脈、作業契約、証拠、検収結果を共有しながら作業するためのセルフホスト型制御プレーン。

## Context

AI Agent や人間が作業判断に使う文脈情報。Raw、Proposed、Official の状態を分け、Official だけを継続参照する。

## Work Contract

AI CLI や人間に渡す作業契約。目的、許可パス、禁止パス、必要文脈、期待成果物、必須 Evidence、受け入れ条件を含む。

## Evidence

作業完了を検収するための証拠。diff、ログ、テスト結果、成果物、確認記録などを含む。

## Verifier

Work Contract と Evidence に基づき、scope、policy、必須証拠、テスト結果、契約準拠を検査する仕組み。

## Official Context

Review や Policy Gate を通過し、正本として継続参照してよい文脈。
