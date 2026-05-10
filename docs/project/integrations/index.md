# Integrations

## 役割

このディレクトリは、外部 API やサービスとの接続境界と制約を管理する正本です。

## 置いてよいもの

- 外部依存の役割
- 接続境界
- 認証や制約
- 障害時の扱い

## 置いてはいけないもの

- 機密値そのもの
- 一回限りの接続メモ
- ハーネス運用ルール

## 命名規則

- `<integration>.md`

## 参照ルール

- integration を追加または変更したら `.agents/project.md` と validation 影響を確認する

## 参照

- `git-cli.md`: ローカル Git CLI 連携。
- `ai-cli.md`: 外部 AI coding CLI / Agent 連携。
