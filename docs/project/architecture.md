# Architecture

## 目的

このファイルは、プロジェクト全体で守る不変条件、責務分離、設計方針を定義します。

## 読むべき場面

- 共通原則を変えるとき
- 責務境界を見直すとき
- 仕様や実装に横断影響があるとき

## 不変条件

### owox

- `owox` は AI Agent First な Terminal Workspace / plugin host として扱う。
- `owox` は AI coding CLI や Git hosting を置き換えない。AI CLI / agent process の起動、監視、操作、terminal session、diff、preview、logs、approvals、plugin UI host を担当する。
- plugin 固有 UI は `owox` の中核拡張面として扱う。

### owlcore

- `owlcore` は server なしで project repo に紐づく。必須 runtime は CLI / library / owox plugin とし、常駐 HTTP daemon を前提にしない。
- Brand Repo / brand context は v2 以降の追加機能候補とし、v1 `owlcore` project repo 管理の中核には含めない。

## 責務分離



## 設計方針



## 関連資料

- `index.md`
- `validation.md`
- `tech-stack.md`
