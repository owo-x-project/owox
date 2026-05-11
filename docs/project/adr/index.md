# ADR

## 役割

このディレクトリは、重要な判断とその理由を記録する正本です。

## 置いてよいもの

- 継続的な影響を持つ判断
- 代替案と採否理由
- 後続資料への関連付け

## 置いてはいけないもの

- 単なる作業ログ
- 会議メモだけの記録
- 手順詳細

## 命名規則

- `active/ADR-<NNN>-<short-title>.md`
- `archive/ADR-<NNN>-<short-title>.md`

## 参照ルール

- 現在有効な判断は `active/`
- 参照優先度を落とした過去資料は `archive/`
- 置換関係は状態名ではなく本文または front matter の関連情報で示す

## 参照

- `active/`: 現在有効な ADR の配置先
- `active/ADR-0001-initial-architecture-and-stack.md`: 初期 architecture と technology stack。ADR-0003 採用後は現 owox 制御プレーン前提の置換対象を含む
- `active/ADR-0002-repo-backed-owox-store.md`: project repo 内 `.owox/` を正本、SQLite を projection/cache とする判断。ADR-0003 採用後は `owlcore` の `.owox/owlcore/` 方針へ継承する
- `active/ADR-0003-owox-owlcore-product-split.md`: `owox` を Terminal Workspace / plugin host、`owlcore` を serverless repo-native 公式 plugin とする判断
- `archive/`: 参照優先度を落とした ADR の配置先。現在は個票なし
