use owox_core::db::{MetadataStore, ProjectRecord, SessionRecord};
use serde_json::json;
use sqlx::sqlite::SqlitePoolOptions;

async fn store() -> MetadataStore {
    MetadataStore::connect("sqlite::memory:").await.unwrap()
}

#[tokio::test]
async fn migration_is_idempotent() {
    let store = store().await;

    store.migrate().await.unwrap();
    store.migrate().await.unwrap();
}

#[tokio::test]
async fn migration_upgrades_legacy_terminal_session_schema() {
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect("sqlite::memory:")
        .await
        .unwrap();
    sqlx::query(
        "CREATE TABLE terminal_sessions (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            command TEXT NOT NULL,
            cwd TEXT NOT NULL,
            state TEXT NOT NULL,
            started_at INTEGER NOT NULL,
            ended_at INTEGER,
            log_id TEXT
        )",
    )
    .execute(&pool)
    .await
    .unwrap();

    let store = MetadataStore::from_pool(pool);
    store.migrate().await.unwrap();

    let project = ProjectRecord {
        id: "prj_repo".to_string(),
        name: "repo".to_string(),
        repo_kind: "git".to_string(),
        status: "available".to_string(),
        git_branch: None,
        last_opened_at: None,
    };
    store.projects().upsert(&project).await.unwrap();

    let session = SessionRecord {
        id: "ses_legacy".to_string(),
        project_id: "prj_repo".to_string(),
        command: "bash".to_string(),
        cwd: ".".to_string(),
        state: "running".to_string(),
        started_at: 1,
        ended_at: None,
        log_id: Some("log_legacy".to_string()),
        label: Some("terminal".to_string()),
        cols: Some(80),
        rows: Some(24),
        exit_code: None,
        pid: Some(123),
    };

    store.sessions().upsert(&session).await.unwrap();
    assert_eq!(
        store.sessions().get("ses_legacy").await.unwrap(),
        Some(session)
    );
}

#[tokio::test]
async fn project_repository_roundtrips_records() {
    let store = store().await;
    let record = ProjectRecord {
        id: "prj_repo".to_string(),
        name: "repo".to_string(),
        repo_kind: "git".to_string(),
        status: "available".to_string(),
        git_branch: Some("main".to_string()),
        last_opened_at: None,
    };

    store.projects().upsert(&record).await.unwrap();
    let projects = store.projects().list().await.unwrap();

    assert_eq!(projects, vec![record]);
}

#[tokio::test]
async fn ui_state_stores_json_without_project_repo_files() {
    let store = store().await;
    let project = ProjectRecord {
        id: "prj_repo".to_string(),
        name: "repo".to_string(),
        repo_kind: "git".to_string(),
        status: "available".to_string(),
        git_branch: None,
        last_opened_at: None,
    };
    store.projects().upsert(&project).await.unwrap();

    store
        .ui_state()
        .put_json("prj_repo", "surface", json!({"active": "terminal"}), 1)
        .await
        .unwrap();

    let value = store
        .ui_state()
        .get_json("prj_repo", "surface")
        .await
        .unwrap();
    assert_eq!(value, Some(json!({"active": "terminal"})));
}
