---
id: SPEC-shared-http-api
status: 採用
related:
  - docs/project/architecture.md
  - docs/project/requirements/owox/v0/REQ-owox-product-scope.md
  - docs/project/requirements/owox/v0/REQ-terminal-workspace.md
  - docs/project/requirements/owox/v0/REQ-git-workflow.md
subproject: owox
---

# HTTP API

## 概要

`owox` v0 の resource REST HTTP API endpoint、request / response field、range request の横断仕様。

## 関連要求

- `REQ-owox-product-scope`
- `REQ-terminal-workspace`
- `REQ-git-workflow`

## 入力

- resource id
- repo-relative path
- range request
- file operation request
- terminal session create request
- Git operation request

## 出力

- resource representation
- operation result
- typed payload reference
- range response
- validation / protocol error

## 挙動

- HTTP API は resource REST style とする。
- project / session / command は server 発行の opaque id で参照する。
- host absolute path や project path を client resource id として扱わない。
- large payload の本文取得は range request を使う。
- terminal 入出力と resize は WebSocket event を使う。
- project / workspace endpoint は `GET /api/projects` と `GET /api/projects/:project_id` を持つ。
- file / editor endpoint は selected project 配下の resource CRUD とする。
- terminal endpoint は session resource と log range read を持つ。
- Git endpoint は read REST + operation action とする。
- plugin endpoint は manifest / command contribution の read endpoint だけを持つ。
- plugin command contribution の execute endpoint は v0 では持たない。
- log endpoint は range read と manual delete を持つ。

## Endpoint 一覧

Success status:

- `GET`: `200 OK`
- `POST` create: `201 Created`
- `POST` operation accepted: `202 Accepted`
- `PUT`: `200 OK`
- `PATCH`: `200 OK`
- `DELETE`: `204 No Content`

Error response:

```json
{
  "error": {
    "kind": "validation",
    "message": "Invalid request",
    "target": "path",
    "recoverability": "user_action",
    "next_action": "Fix the path and retry",
    "log_ref": null,
    "request_id": "req_..."
  }
}
```

Validation error response:

```json
{
  "error": {
    "kind": "validation",
    "message": "Invalid request",
    "target": "request",
    "recoverability": "user_action",
    "next_action": "Fix the highlighted fields and retry",
    "log_ref": null,
    "request_id": "req_..."
  },
  "field_errors": [
    {
      "field": "path",
      "code": "boundary",
      "message": "Path is outside the selected project",
      "expected": "repo-relative path inside project",
      "actual": "../secret.txt"
    }
  ]
}
```

### Project

- `GET /api/projects`
- `GET /api/projects/:project_id`

Response project fields:

- `id`
- `name`
- `repo_kind`
- `git_branch`
- `status`
- `last_opened_at`
- `warnings`

Host absolute path は返さない。

Examples:

```http
GET /api/projects
```

```json
{
  "projects": [
    {
      "id": "prj_...",
      "name": "owox",
      "repo_kind": "git",
      "git_branch": "main",
      "status": "available",
      "last_opened_at": 1778630400000,
      "warnings": []
    }
  ]
}
```

```http
GET /api/projects/prj_...
```

```json
{
  "project": {
    "id": "prj_...",
    "name": "owox",
    "repo_kind": "git",
    "git_branch": "main",
    "status": "available",
    "last_opened_at": 1778630400000,
    "warnings": []
  }
}
```

### File / Editor

- `GET /api/projects/:project_id/files/tree`
- `GET /api/projects/:project_id/files/content`
- `PUT /api/projects/:project_id/files/content`
- `POST /api/projects/:project_id/files`
- `PATCH /api/projects/:project_id/files`
- `DELETE /api/projects/:project_id/files`

Request fields:

- `path`
- `kind`
- `content_ref`
- `content`
- `target_path`
- `expected_version`
- `confirm_token`

操作に不要な field は省略する。

Examples:

```http
GET /api/projects/prj_.../files/tree?path=src
```

```json
{
  "path": "src",
  "entries": [
    { "path": "src/main.rs", "kind": "file", "version": "v_..." }
  ],
  "version": "v_..."
}
```

```http
GET /api/projects/prj_.../files/content?path=src/main.rs&offset=0&limit=65536
```

```json
{
  "path": "src/main.rs",
  "kind": "text",
  "version": "v_...",
  "content": "fn main() {}\n",
  "truncated": false
}
```

```http
PUT /api/projects/prj_.../files/content
```

```json
{
  "path": "src/main.rs",
  "content": "fn main() {}\n",
  "expected_version": "v_..."
}
```

```json
{
  "path": "src/main.rs",
  "version": "v_...",
  "result": "saved"
}
```

```http
POST /api/projects/prj_.../files
```

```json
{
  "path": "src/new.rs",
  "kind": "file",
  "content": ""
}
```

```json
{
  "path": "src/new.rs",
  "kind": "file",
  "version": "v_..."
}
```

```http
PATCH /api/projects/prj_.../files
```

```json
{
  "path": "src/new.rs",
  "target_path": "src/lib.rs",
  "expected_version": "v_..."
}
```

```json
{
  "path": "src/lib.rs",
  "version": "v_...",
  "result": "renamed"
}
```

```http
DELETE /api/projects/prj_.../files
```

```json
{
  "path": "src/lib.rs",
  "confirm_token": "confirm_..."
}
```

### Terminal

- `GET /api/projects/:project_id/sessions`
- `POST /api/projects/:project_id/sessions`
- `GET /api/projects/:project_id/sessions/:session_id`
- `DELETE /api/projects/:project_id/sessions/:session_id`
- `GET /api/projects/:project_id/sessions/:session_id/log`

POST session request fields:

- `cwd`
- `command`
- `args`
- `env`
- `cols`
- `rows`
- `label`

Terminal input / resize は HTTP endpoint ではなく WebSocket event を使う。

Examples:

```http
GET /api/projects/prj_.../sessions
```

```json
{
  "sessions": [
    {
      "id": "ses_...",
      "label": "terminal",
      "state": "running",
      "cwd": ".",
      "created_at": 1778630400000
    }
  ]
}
```

```http
POST /api/projects/prj_.../sessions
```

```json
{
  "cwd": ".",
  "command": "bash",
  "args": [],
  "env": {},
  "cols": 120,
  "rows": 32,
  "label": "terminal"
}
```

```json
{
  "session": {
    "id": "ses_...",
    "state": "creating",
    "label": "terminal"
  }
}
```

```http
GET /api/projects/prj_.../sessions/ses_...
```

```json
{
  "session": {
    "id": "ses_...",
    "state": "running",
    "exit_code": null,
    "started_at": 1778630400000,
    "ended_at": null
  }
}
```

```http
DELETE /api/projects/prj_.../sessions/ses_...
```

```http
GET /api/projects/prj_.../sessions/ses_.../log?offset=0&limit=65536
```

```json
{
  "log_id": "log_...",
  "offset": 0,
  "limit": 65536,
  "total": 2048,
  "chunks": [{ "offset": 0, "data": "..." }],
  "truncated": false
}
```

### Git

- `GET /api/projects/:project_id/git/status`
- `GET /api/projects/:project_id/git/diff`
- `GET /api/projects/:project_id/git/branches`
- `POST /api/projects/:project_id/git/operations`

POST operation request fields:

- `op`
- `paths`
- `message`
- `branch`
- `remote`
- `confirm_token`
- `options`

`op` は stage、unstage、discard、commit、branch checkout / create、fetch、pull、push、sync を表す enum とする。

Examples:

```http
GET /api/projects/prj_.../git/status
```

```json
{
  "branch": "main",
  "ahead": 0,
  "behind": 0,
  "files": [
    { "path": "src/main.rs", "state": "modified", "staged": false }
  ],
  "counts": { "modified": 1, "staged": 0, "untracked": 0 }
}
```

```http
GET /api/projects/prj_.../git/diff?mode=unstaged&path=src/main.rs
```

```json
{
  "summary": { "files": 1, "additions": 2, "deletions": 1 },
  "diff_ref": { "kind": "diff", "id": "diff_...", "offset": 0, "length": 65536 }
}
```

```http
GET /api/projects/prj_.../git/branches
```

```json
{
  "current": "main",
  "branches": [
    { "name": "main", "current": true, "remote": false }
  ]
}
```

```http
POST /api/projects/prj_.../git/operations
```

```json
{
  "op": "stage",
  "paths": ["src/main.rs"],
  "options": {}
}
```

```json
{
  "command_id": "cmd_...",
  "status": "queued"
}
```

### Plugin

- `GET /api/plugins`
- `GET /api/plugins/commands`

Command contribution fields:

- `id`
- `plugin_id`
- `title`
- `category`
- `capabilities`
- `when`
- `args_schema`
- `dangerous`

Examples:

```http
GET /api/plugins
```

```json
{
  "plugins": [
    {
      "id": "owlcore",
      "name": "owlcore",
      "version": "1.0.0",
      "capabilities": []
    }
  ]
}
```

```http
GET /api/plugins/commands
```

```json
{
  "commands": [
    {
      "id": "owlcore.example",
      "plugin_id": "owlcore",
      "title": "Example Command",
      "category": "plugin",
      "capabilities": [],
      "when": "workspace",
      "args_schema": null,
      "dangerous": false
    }
  ]
}
```

### Log

- `GET /api/logs/:log_id`
- `DELETE /api/logs/:log_id`

GET log request query:

- `offset`
- `limit`

GET log response fields:

- `log_id`
- `offset`
- `limit`
- `total`
- `chunks`
- `truncated`

Examples:

```http
GET /api/logs/log_...?offset=0&limit=65536
```

```json
{
  "log_id": "log_...",
  "offset": 0,
  "limit": 65536,
  "total": 2048,
  "chunks": [{ "offset": 0, "data": "..." }],
  "truncated": false
}
```

```http
DELETE /api/logs/log_...
```

## Error examples

`boundary`:

```json
{
  "error": {
    "kind": "boundary",
    "message": "Path is outside the selected project",
    "target": "path",
    "recoverability": "user_action",
    "next_action": "Use a repo-relative path inside the project",
    "log_ref": null,
    "request_id": "req_..."
  }
}
```

`not_found`:

```json
{
  "error": {
    "kind": "not_found",
    "message": "Resource not found",
    "target": "project",
    "recoverability": "user_action",
    "next_action": "Refresh the project list",
    "log_ref": null,
    "request_id": "req_..."
  }
}
```

`permission`:

```json
{
  "error": {
    "kind": "permission",
    "message": "Permission denied",
    "target": "file",
    "recoverability": "user_action",
    "next_action": "Check filesystem permissions",
    "log_ref": "log_...",
    "request_id": "req_..."
  }
}
```

`timeout`:

```json
{
  "error": {
    "kind": "timeout",
    "message": "Operation timed out",
    "target": "command",
    "recoverability": "retry",
    "next_action": "Retry or inspect the command log",
    "log_ref": "log_...",
    "request_id": "req_..."
  }
}
```

`auth`:

```json
{
  "error": {
    "kind": "auth",
    "message": "Authentication failed",
    "target": "git_remote",
    "recoverability": "user_action",
    "next_action": "Check Git remote credentials",
    "log_ref": "log_...",
    "request_id": "req_..."
  }
}
```

`conflict`:

```json
{
  "error": {
    "kind": "conflict",
    "message": "Operation conflicts with current state",
    "target": "working_tree",
    "recoverability": "user_action",
    "next_action": "Review changes and retry",
    "log_ref": "log_...",
    "request_id": "req_..."
  }
}
```

`network`:

```json
{
  "error": {
    "kind": "network",
    "message": "Network request failed",
    "target": "git_remote",
    "recoverability": "retry",
    "next_action": "Check connectivity and retry",
    "log_ref": "log_...",
    "request_id": "req_..."
  }
}
```

`unknown`:

```json
{
  "error": {
    "kind": "unknown",
    "message": "Unexpected error",
    "target": "operation",
    "recoverability": "inspect_log",
    "next_action": "Inspect the log and retry if safe",
    "log_ref": "log_...",
    "request_id": "req_..."
  }
}
```

## 状態遷移 / 不変条件

- API request は workspace boundary を越えない。
- request 内 path は repo-relative path とし、server 側で正規化する。
- range request は offset / limit を持つ。
- success status は REST 標準に従う。
- error response は typed error body とする。
- validation error は field errors を返す。
- write / destructive operation は confirmation token または destructive confirmation flow と接続する。
- operation action は command execution result と接続する。

## エラー / 例外

- boundary violation は validation error とする。
- unknown resource id は not found とする。
- invalid range は validation error とする。
- destructive confirmation 不足時、対象 operation は実行しない。

## 横断ルール

- workspace boundary は `SPEC-shared-workspace-boundary.md` に従う。
- command execution は `SPEC-shared-command-execution.md` に従う。
- destructive confirmation は `SPEC-shared-destructive-confirmation.md` に従う。
- error display は `SPEC-shared-error-display.md` に従う。
- large payload ref は `SPEC-shared-websocket-events.md` と同じ typed ref を使う。

## 検証観点

- host absolute path を id として返さない。
- range request で log / file / diff を部分取得できる。
- terminal 入出力が HTTP ではなく WebSocket に流れる。
- Git operation action が command execution result と接続する。
- plugin command read endpoint が launcher に接続できる。
- plugin command execute endpoint が存在しない。

## 関連資料

- `index.md`
- `../../architecture.md`
- `../../requirements/owox/v0/REQ-owox-product-scope.md`
- `../../requirements/owox/v0/REQ-terminal-workspace.md`
- `../../requirements/owox/v0/REQ-git-workflow.md`
