# Maintainers Guide

## 役割

Owox の正本、contract、architecture、validation、初期 roadmap の整合を保つ暫定責任境界。

## 担当範囲

- `.agents/project.md` の project 定義。
- `docs/project/` の正本。
- Contract first、Core before UI、Evidence based acceptance の維持。
- integration と subproject 境界の初期判断。

## 固有ルール

- inbox 資料や Raw input は直接 Official Context にしない。
- 技術選定、architecture、integration 境界を変える場合は ADR または task に判断理由を残す。
- 実チーム構成が決まるまで、`maintainers` は暫定境界として扱う。

## 固有知識

- Owox は AI coding CLI を置き換えず、作業契約、文脈、証拠、検収、監査を管理する。
- 初期実装順序は Contract、Core、DB、API、Git / Verifier、WebUI、Adapter の順。
