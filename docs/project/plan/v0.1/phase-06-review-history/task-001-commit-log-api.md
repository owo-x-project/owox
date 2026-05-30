# Task 001: コミットログ API 呼び出し + データモデル

## 目的

バックエンドの git log API を呼び出し、コミット履歴データをフロントエンドで利用可能にする。

## 前提条件

- バックエンドに git log API が存在する (なければバックエンド修正が先行タスク)

## 作業内容

- バックエンド API の確認:
  - `GET /projects/:id/git/log?offset=&limit=` の存在確認
  - レスポンス形式: `{ commits: [{ hash, author, date, message, ... }] }`
  - API が存在しない場合 → バックエンド追加を別 task として起票
- `GitApi` に `log()` メソッドを追加:
  ```typescript
  log(offset?: number, limit?: number): Promise<CommitLog>
  ```
- コミットデータモデルの定義:
  ```typescript
  interface Commit {
    hash: string;
    shortHash: string;
    author: string;
    authorEmail: string;
    date: string;
    message: string;
    parentHashes: string[];
  }
  ```
- コミット diff 取得: 既存の `diff()` API を `commit:<hash>` モードで呼び出し

## 完了条件

- `GitApi.log()` がコミット一覧を返す
- データモデルが定義されている
- コミット diff が取得できる

## 検証方法

- DevTools の Network タブで API 呼び出し確認

## 依存関係

- バックエンド git log API

## 成果物

- `src/features/git/api.ts` (変更)
- `src/features/git/commit-model.ts` (新規)
