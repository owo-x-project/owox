use serde::{Deserialize, Serialize};
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions};

#[derive(Debug, Clone)]
pub struct MetadataStore {
    pool: SqlitePool,
}

impl MetadataStore {
    pub async fn connect(database_url: &str) -> Result<Self, sqlx::Error> {
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await?;
        let store = Self { pool };
        store.migrate().await?;
        Ok(store)
    }

    pub fn from_pool(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }

    pub async fn migrate(&self) -> Result<(), sqlx::Error> {
        // @adr ADR-0004
        // Runtime metadata stays in the managed SQLite database, not in project repos.
        for statement in MIGRATIONS {
            sqlx::query(statement).execute(&self.pool).await?;
        }
        Ok(())
    }

    pub fn projects(&self) -> ProjectRepository {
        ProjectRepository {
            pool: self.pool.clone(),
        }
    }

    pub fn sessions(&self) -> SessionRepository {
        SessionRepository {
            pool: self.pool.clone(),
        }
    }

    pub fn logs(&self) -> LogRepository {
        LogRepository {
            pool: self.pool.clone(),
        }
    }

    pub fn ui_state(&self) -> UiStateRepository {
        UiStateRepository {
            pool: self.pool.clone(),
        }
    }
}

const MIGRATIONS: &[&str] = &[
    "CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        repo_kind TEXT NOT NULL,
        status TEXT NOT NULL,
        git_branch TEXT,
        last_opened_at INTEGER
    )",
    "CREATE TABLE IF NOT EXISTS terminal_sessions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        command TEXT NOT NULL,
        cwd TEXT NOT NULL,
        state TEXT NOT NULL,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        log_id TEXT,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )",
    "CREATE TABLE IF NOT EXISTS logs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        session_id TEXT,
        path TEXT NOT NULL,
        size_bytes INTEGER NOT NULL DEFAULT 0,
        redacted INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )",
    "CREATE TABLE IF NOT EXISTS ui_state (
        project_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(project_id, key),
        FOREIGN KEY(project_id) REFERENCES projects(id)
    )",
];

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProjectRecord {
    pub id: String,
    pub name: String,
    pub repo_kind: String,
    pub status: String,
    pub git_branch: Option<String>,
    pub last_opened_at: Option<i64>,
}

#[derive(Debug, Clone)]
pub struct ProjectRepository {
    pool: SqlitePool,
}

impl ProjectRepository {
    pub async fn upsert(&self, record: &ProjectRecord) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO projects (id, name, repo_kind, status, git_branch, last_opened_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                repo_kind = excluded.repo_kind,
                status = excluded.status,
                git_branch = excluded.git_branch,
                last_opened_at = excluded.last_opened_at",
        )
        .bind(&record.id)
        .bind(&record.name)
        .bind(&record.repo_kind)
        .bind(&record.status)
        .bind(&record.git_branch)
        .bind(record.last_opened_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn list(&self) -> Result<Vec<ProjectRecord>, sqlx::Error> {
        let rows = sqlx::query_as::<_, (String, String, String, String, Option<String>, Option<i64>)>(
            "SELECT id, name, repo_kind, status, git_branch, last_opened_at FROM projects ORDER BY name",
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows
            .into_iter()
            .map(
                |(id, name, repo_kind, status, git_branch, last_opened_at)| ProjectRecord {
                    id,
                    name,
                    repo_kind,
                    status,
                    git_branch,
                    last_opened_at,
                },
            )
            .collect())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SessionRecord {
    pub id: String,
    pub project_id: String,
    pub command: String,
    pub cwd: String,
    pub state: String,
    pub started_at: i64,
    pub ended_at: Option<i64>,
    pub log_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct SessionRepository {
    pool: SqlitePool,
}

impl SessionRepository {
    pub async fn upsert(&self, record: &SessionRecord) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO terminal_sessions (id, project_id, command, cwd, state, started_at, ended_at, log_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET
                state = excluded.state,
                ended_at = excluded.ended_at,
                log_id = excluded.log_id",
        )
        .bind(&record.id)
        .bind(&record.project_id)
        .bind(&record.command)
        .bind(&record.cwd)
        .bind(&record.state)
        .bind(record.started_at)
        .bind(record.ended_at)
        .bind(&record.log_id)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct LogRecord {
    pub id: String,
    pub project_id: String,
    pub session_id: Option<String>,
    pub path: String,
    pub size_bytes: i64,
    pub redacted: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone)]
pub struct LogRepository {
    pool: SqlitePool,
}

impl LogRepository {
    pub async fn upsert(&self, record: &LogRecord) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO logs (id, project_id, session_id, path, size_bytes, redacted, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(id) DO UPDATE SET
                size_bytes = excluded.size_bytes,
                redacted = excluded.redacted,
                updated_at = excluded.updated_at",
        )
        .bind(&record.id)
        .bind(&record.project_id)
        .bind(&record.session_id)
        .bind(&record.path)
        .bind(record.size_bytes)
        .bind(record.redacted)
        .bind(record.created_at)
        .bind(record.updated_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}

#[derive(Debug, Clone)]
pub struct UiStateRepository {
    pool: SqlitePool,
}

impl UiStateRepository {
    pub async fn put_json(
        &self,
        project_id: &str,
        key: &str,
        value: serde_json::Value,
        updated_at: i64,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            "INSERT INTO ui_state (project_id, key, value_json, updated_at)
             VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(project_id, key) DO UPDATE SET
                value_json = excluded.value_json,
                updated_at = excluded.updated_at",
        )
        .bind(project_id)
        .bind(key)
        .bind(value.to_string())
        .bind(updated_at)
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    pub async fn get_json(
        &self,
        project_id: &str,
        key: &str,
    ) -> Result<Option<serde_json::Value>, sqlx::Error> {
        let row = sqlx::query_as::<_, (String,)>(
            "SELECT value_json FROM ui_state WHERE project_id = ?1 AND key = ?2",
        )
        .bind(project_id)
        .bind(key)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.and_then(|(value,)| serde_json::from_str(&value).ok()))
    }
}
