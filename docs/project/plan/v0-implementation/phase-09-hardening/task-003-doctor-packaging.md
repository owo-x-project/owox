# Task 003 Doctor Packaging

## 目的

`owoxd doctor` と配布用 packaging を整える。

## 前提条件

- `owoxd serve` が実装済み
- WebUI static build ができる

## 作業内容

- doctor checks を実装する
- Dockerfile / compose example を追加する
- README に起動手順を記載する

## 完了条件

- doctor が Git / workspace / DB / schema 状態を表示する
- Docker image を build できる

## 検証方法

- `cargo run -p owox-cli -- doctor`
- `docker build -t owoxd:local .`

## 依存関係

- Phase 06
- Phase 07

## 成果物

- doctor / packaging
