# Specs

## 役割

このディレクトリは、要求を具体的な振る舞いへ落とし込む正本です。

## 置いてよいもの

- 入出力契約
- 状態遷移
- エラー条件
- 横断ルール
- 検証観点

## 置いてはいけないもの

- 要求の背景説明の大半
- 一時的な設計メモ
- ハーネス運用ルール

## 命名規則

- 共有仕様: `shared/SPEC-<category>-<short-title>.md`
- subproject 固有仕様: `<subproject>/SPEC-<category>-<short-title>.md`

## 参照ルール

- 2 つ以上の subproject にまたがる仕様は `shared/` に置く
- 1 つの subproject に閉じる仕様はその subproject 配下に置く

## 参照

- `shared/index.md`: 複数 subproject にまたがる共有仕様の入口
- `crates/index.md`: 旧 Owox 制御プレーン crate 仕様の入口。ADR-0003 採用後は `owlcore` crate / library 仕様へ再編対象
- `web/index.md`: 旧 WebUI 仕様の入口。ADR-0003 採用後は `owox` shell / plugin UI 仕様へ再編対象
- `contracts/index.md`: 旧 HTTP API / JSON Schema 契約仕様の入口。ADR-0003 採用後は plugin API / repo layout schema へ再編対象
