# Task 002: Docker Selfhost Packaging

## 目的

個人セルフホスト用 Docker packaging を実装する。

## 前提条件

- server / client build が可能。
- SQLite DB と workspace root 設定がある。

## 作業内容

- Dockerfile と compose example を追加する。
- workspace root mount、SQLite volume、config env を整理する。
- production build と static asset serving を接続する。

## 完了条件

- container から WebUI を開ける。
- mounted workspace root の project repo を認識する。
- volume あり / なしの metadata 挙動が説明可能。

## 検証方法

- Docker build smoke。
- container health check。
- mounted fixture repo smoke。

## 依存関係

- `../phase-01-foundation-contracts/task-001-app-scaffold.md`
- `../../../integrations/docker.md`

## 成果物

- Dockerfile。
- compose example。
- packaging docs。
