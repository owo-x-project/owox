# Docker

## 役割

`owox` v0 の標準 self-host runtime。WebUI / API server を container として動かし、project repo と SQLite / log persistence を mount で扱う。

## 接続境界

- `owox` container は HTTP / WebSocket を公開する。
- project repo は host から container に mount する。
- owox managed SQLite と log は Docker volume で永続化できる。
- AI CLI を container 内で使うか host 側に委譲するかは、初期実装で安全境界を検証して決める。

## 認証 / 機密

- secret 本体を docs に保存しない。
- provider API key は owox 本体ではなく外部 AI CLI 側責務とする。
- Git remote credential は v0 Git 操作要件に合わせ、別途 spec 化する。

## 障害時の扱い

- volume なし運用では SQLite / log 永続化を保証しない。
- container restart 後の process 復元は v0 必須ではない。browser reload 後の reconnect を優先する。

## 関連資料

- `../architecture.md`
- `../validation.md`
- `../tech-stack.md`
