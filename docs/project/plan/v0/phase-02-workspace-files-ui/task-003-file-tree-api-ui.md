# Task 003: File Tree API UI

## 目的

project repo 内の file tree を安全に表示し、file selection を workspace state に接続する。

## 前提条件

- workspace shell がある。
- file access boundary が利用できる。

## 作業内容

- file tree API を実装する。
- ignored / hidden / binary file の扱いを仕様に合わせる。
- file tree UI、expand / collapse、selection を実装する。

## 完了条件

- project repo 内 tree が表示される。
- boundary 外 file は表示・取得されない。
- file selection が editor / diff へ渡せる。

## 検証方法

- file tree route fixture test。
- tree state unit test。

## 依存関係

- `task-002-workspace-shell-layout.md`
- `../../../specs/owox/SPEC-ui-file-tree.md`

## 成果物

- file tree API。
- file tree UI。
