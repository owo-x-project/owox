use owox_core::db::{MetadataStore, ProjectRecord};
use serde_json::json;

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
