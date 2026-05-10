# AI CLI

## 役割

OpenCode、Claude Code、Codex CLI、Ruflo、Roo Code などの外部 AI coding CLI / Agent を、Owox の作業者または外注 Worker として扱う。

## 接続境界

- Owox は Work Contract、Context Capsule、Execution Constraints、Required Evidence を渡す。
- AI CLI / Agent は diff、logs、test results、notes、artifacts、evidence を返す。
- Owox は AI CLI 本体、IDE、CI/CD、deployment 基盤を内蔵しない。

## 認証 / 権限

- 各 AI CLI の認証、利用権限、課金、rate limit は外部ツール側の責務。
- Owox 側の adapter 認証と権限制御は未確定。

## 制約

- AI CLI の自然文出力は権威にしない。
- Official Context への反映は Review / Policy Gate を通す。
- 完了扱いには Evidence と Verifier の検収を必要とする。

## 障害時の扱い

- AI CLI 実行失敗、timeout、証拠不足、契約違反は acceptance 不可として扱う。
- 再実行、別 Agent への委譲、人間レビューの判断は Work Contract と Event に残す。

## 関連資料

- `../architecture.md`
- `../validation.md`
- `../glossary/core.md`
