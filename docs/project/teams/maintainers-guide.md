# Maintainers Guide

## 役割

Owox の正本、architecture、validation、初期 roadmap の整合を保つ暫定責任境界。

## 担当範囲

- `.agents/project.md` の project 定義。
- `docs/project/` の正本。
- Core before UI、documented acceptance の維持。
- integration と subproject 境界の初期判断。

## 固有ルール

- inbox 資料や Raw input は review なしに正本化しない。
- 技術選定、architecture、integration 境界を変える場合は ADR または task に判断理由を残す。
- 実チーム構成が決まるまで、`maintainers` は暫定境界として扱う。

## 固有知識

- Owox は AI coding CLI を置き換えず、WebUI Terminal Workspace / 簡易 IDE として実行・確認・編集・Git 操作面を提供する。
- 初期実装順序は Core、DB、API、Git、WebUI、Adapter の順。
