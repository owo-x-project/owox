//! Plugin extension point: manifest schema, parser, and command-contribution
//! loader for the v0 minimal extension surface.
//!
//! @spec SPEC-plugin-extension-point
//! @spec SPEC-shared-http-api (Plugin)
//! @spec ux-command-launcher
//!
//! v0 reserves the plugin surface but executes NO plugin code. A manifest is
//! parsed for its `id` / `name` / `version` and any `commands` it contributes;
//! every other field (`backend_hooks`, `capabilities`, `permissions`,
//! `ui_panels`, `settings`, `dependencies`, `activation_events`) is reserved for
//! a later phase. Reserved fields PARSE and are IGNORED at runtime
//! (parse-and-ignore, never execute); their presence emits a warning rather than
//! a hard error. There is intentionally no execution engine, no dispatch, and no
//! execute endpoint anywhere in v0 — a plugin never touches the filesystem,
//! process table, network, or repo canonical state without a declared, granted
//! capability, and that boundary is enforced simply by not implementing
//! execution at all. Plugin-specific domain logic stays OUT of core.

use serde::{Deserialize, Serialize};
use std::path::Path;
use thiserror::Error;

/// A parsed plugin manifest.
///
/// Only `id` / `name` / `version` / `commands` carry v0 runtime meaning. All
/// remaining fields are RESERVED: they deserialize so a future-shaped manifest
/// loads without error, but v0 never acts on them. Unknown top-level keys are
/// also tolerated (see [`parse_manifest`]) so newer manifests degrade
/// gracefully on an older host.
#[derive(Debug, Clone, PartialEq, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub commands: Vec<CommandContribution>,

    // --- RESERVED (parse-and-ignore; never executed in v0) ---
    /// RESERVED. Backend lifecycle hooks. v0 defines only the boundary type
    /// ([`BackendHook`]); there is no dispatch or execution engine.
    #[serde(default)]
    pub backend_hooks: Vec<BackendHook>,
    /// RESERVED. Host capabilities the plugin declares it needs.
    #[serde(default)]
    pub capabilities: Vec<String>,
    /// RESERVED. Permission grants. Not enforced/executed in v0.
    #[serde(default)]
    pub permissions: Vec<String>,
    /// RESERVED. UI panels. v0 has no generic plugin UI runtime.
    #[serde(default)]
    pub ui_panels: serde_json::Value,
    /// RESERVED. Plugin settings schema. Not executed in v0.
    #[serde(default)]
    pub settings: serde_json::Value,
    /// RESERVED. Inter-plugin dependencies. No resolution in v0.
    #[serde(default)]
    pub dependencies: serde_json::Value,
    /// RESERVED. Activation events. No activation runtime in v0.
    #[serde(default)]
    pub activation_events: Vec<String>,
}

/// A command contributed by a plugin, surfaced read-only in the command
/// launcher. Field set matches `SPEC-shared-http-api` (Plugin) exactly.
///
/// In v0 a contribution is DISPLAY / RESERVED only: it is never runnable, and
/// no execute endpoint exists. `capabilities` lists the host capabilities the
/// command requires; a command whose required capabilities are not all declared
/// by the manifest is treated as disabled (see [`load_plugins`]).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CommandContribution {
    pub id: String,
    pub plugin_id: String,
    pub title: String,
    pub category: String,
    #[serde(default)]
    pub capabilities: Vec<String>,
    #[serde(default)]
    pub when: Option<String>,
    #[serde(default)]
    pub args_schema: Option<serde_json::Value>,
    #[serde(default)]
    pub dangerous: bool,
}

/// RESERVED boundary definition for a backend lifecycle hook.
///
/// v0 reserves this type ONLY: it records the lifecycle name and a description
/// of the intended input / output plus the capability that a future host would
/// have to check before dispatch. There is NO execution engine and NO dispatch
/// in v0 — nothing reads these to run code. It exists so a later phase has a
/// stable shape to build on.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct BackendHook {
    /// Lifecycle point this hook would attach to (e.g. `"on_activate"`).
    pub lifecycle: String,
    /// Human description of the intended input payload. Not interpreted in v0.
    #[serde(default)]
    pub input: Option<String>,
    /// Human description of the intended output payload. Not interpreted in v0.
    #[serde(default)]
    pub output: Option<String>,
    /// Capability a future host MUST verify as granted before any dispatch.
    /// v0 performs no such dispatch; this is documentation only.
    #[serde(default)]
    pub required_capability: Option<String>,
}

/// Errors raised while parsing or loading plugin manifests.
#[derive(Debug, Error)]
pub enum PluginError {
    /// A manifest failed validation or JSON parsing — a "plugin load error".
    #[error("invalid plugin manifest: {0}")]
    Invalid(String),
    /// IO failure while scanning the plugins directory.
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
}

/// A per-manifest load failure recorded while scanning the plugins directory.
/// A single bad manifest never crashes the loader.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct LoadError {
    /// Best-effort reference to the offending manifest (relative path or id).
    pub plugin_ref: String,
    pub message: String,
}

/// Result of scanning a plugins directory.
#[derive(Debug, Clone, Default, PartialEq, Serialize)]
pub struct PluginLoad {
    pub plugins: Vec<PluginManifest>,
    /// Enabled (capability-satisfied) command contributions, flattened across
    /// all loaded plugins.
    pub command_contributions: Vec<CommandContribution>,
    /// Non-fatal warnings (reserved fields present, capability-gated commands
    /// disabled, unknown keys, …).
    pub warnings: Vec<String>,
    /// Per-manifest load failures. Present manifests that failed to parse /
    /// validate are recorded here; the rest still load.
    pub load_errors: Vec<LoadError>,
}

// PluginManifest serializes back out for the read endpoints; reserved fields are
// not part of the wire contract, so only the runtime-relevant ones are emitted.
impl Serialize for PluginManifest {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        use serde::ser::SerializeStruct;
        let mut state = serializer.serialize_struct("PluginManifest", 4)?;
        state.serialize_field("id", &self.id)?;
        state.serialize_field("name", &self.name)?;
        state.serialize_field("version", &self.version)?;
        state.serialize_field("capabilities", &self.capabilities)?;
        state.end()
    }
}

/// Top-level keys that v0 understands (runtime + reserved). Anything else is an
/// unknown reserved field and produces a warning, not a hard error.
const KNOWN_KEYS: &[&str] = &[
    "id",
    "name",
    "version",
    "commands",
    "backend_hooks",
    "capabilities",
    "permissions",
    "ui_panels",
    "settings",
    "dependencies",
    "activation_events",
];

/// Parse and validate a single manifest from a JSON string.
///
/// Validation rules:
/// - `id`, `name`, `version` must be non-empty.
/// - each command `id` must be namespaced under the plugin id as
///   `"{plugin_id}.{suffix}"` with a non-empty suffix.
/// - each command must carry a non-empty `title`, and its `plugin_id` (when
///   present) must equal the manifest id.
///
/// Returns the parsed manifest plus a list of non-fatal warnings (reserved
/// fields present, unknown keys). A JSON or validation failure is returned as
/// [`PluginError::Invalid`] (a "plugin load error").
pub fn parse_manifest(json: &str) -> Result<(PluginManifest, Vec<String>), PluginError> {
    let raw: serde_json::Value =
        serde_json::from_str(json).map_err(|e| PluginError::Invalid(e.to_string()))?;

    let mut warnings = Vec::new();

    if let Some(object) = raw.as_object() {
        for key in object.keys() {
            if !KNOWN_KEYS.contains(&key.as_str()) {
                warnings.push(format!("unknown field `{key}` reserved; not executed in v0"));
            }
        }
        warn_reserved(object, "backend_hooks", &mut warnings);
        warn_reserved(object, "permissions", &mut warnings);
        warn_reserved(object, "ui_panels", &mut warnings);
        warn_reserved(object, "settings", &mut warnings);
        warn_reserved(object, "dependencies", &mut warnings);
        warn_reserved(object, "activation_events", &mut warnings);
    }

    let manifest: PluginManifest =
        serde_json::from_value(raw).map_err(|e| PluginError::Invalid(e.to_string()))?;

    if manifest.id.trim().is_empty() {
        return Err(PluginError::Invalid("`id` must not be empty".into()));
    }
    if manifest.name.trim().is_empty() {
        return Err(PluginError::Invalid("`name` must not be empty".into()));
    }
    if manifest.version.trim().is_empty() {
        return Err(PluginError::Invalid("`version` must not be empty".into()));
    }

    let prefix = format!("{}.", manifest.id);
    for command in &manifest.commands {
        if command.title.trim().is_empty() {
            return Err(PluginError::Invalid(format!(
                "command `{}` must have a non-empty title",
                command.id
            )));
        }
        if !command.plugin_id.is_empty() && command.plugin_id != manifest.id {
            return Err(PluginError::Invalid(format!(
                "command `{}` plugin_id `{}` does not match manifest id `{}`",
                command.id, command.plugin_id, manifest.id
            )));
        }
        // Namespacing: id must be `{plugin_id}.{suffix}` with a real suffix.
        if !command.id.starts_with(&prefix) || command.id.len() <= prefix.len() {
            return Err(PluginError::Invalid(format!(
                "command id `{}` must be namespaced as `{}{{name}}`",
                command.id, prefix
            )));
        }
    }

    Ok((manifest, warnings))
}

/// Emit a warning when a reserved field is present and non-null. `Value::Null`
/// (the serde default for the json-typed reserved fields) is treated as absent.
fn warn_reserved(
    object: &serde_json::Map<String, serde_json::Value>,
    key: &str,
    warnings: &mut Vec<String>,
) {
    match object.get(key) {
        None | Some(serde_json::Value::Null) => {}
        Some(serde_json::Value::Array(items)) if items.is_empty() => {}
        Some(_) => warnings.push(format!("{key} reserved; not executed in v0")),
    }
}

/// Scan a plugins directory and load every manifest it finds.
///
/// Manifest files are matched as either `*/plugin.json` (one directory per
/// plugin) or top-level `*.plugin.json` files. A manifest that fails to parse or
/// validate is recorded in [`PluginLoad::load_errors`] and skipped — it never
/// crashes the loader. An absent directory yields an empty [`PluginLoad`].
///
/// Capability gating: a contributed command is ENABLED only when every
/// capability it requires is also declared in its plugin's manifest
/// `capabilities`. A command requiring an undeclared capability is left OUT of
/// [`PluginLoad::command_contributions`] (disabled) and a warning is recorded.
pub fn load_plugins(dir: &Path) -> PluginLoad {
    let mut load = PluginLoad::default();

    let read_dir = match std::fs::read_dir(dir) {
        Ok(read_dir) => read_dir,
        // Absent directory (or unreadable) → empty lists, not an error.
        Err(_) => return load,
    };

    let mut manifest_paths: Vec<std::path::PathBuf> = Vec::new();
    for entry in read_dir.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let candidate = path.join("plugin.json");
            if candidate.is_file() {
                manifest_paths.push(candidate);
            }
        } else if path
            .file_name()
            .and_then(|n| n.to_str())
            .is_some_and(|n| n.ends_with(".plugin.json"))
        {
            manifest_paths.push(path);
        }
    }
    manifest_paths.sort();

    for path in manifest_paths {
        let plugin_ref = path
            .strip_prefix(dir)
            .unwrap_or(&path)
            .to_string_lossy()
            .to_string();

        let text = match std::fs::read_to_string(&path) {
            Ok(text) => text,
            Err(e) => {
                load.load_errors.push(LoadError {
                    plugin_ref,
                    message: e.to_string(),
                });
                continue;
            }
        };

        match parse_manifest(&text) {
            Ok((manifest, warnings)) => {
                for warning in warnings {
                    load.warnings.push(format!("{}: {warning}", manifest.id));
                }
                let declared: std::collections::HashSet<&str> =
                    manifest.capabilities.iter().map(String::as_str).collect();

                for command in &manifest.commands {
                    let missing: Vec<&str> = command
                        .capabilities
                        .iter()
                        .map(String::as_str)
                        .filter(|cap| !declared.contains(cap))
                        .collect();
                    if missing.is_empty() {
                        let mut contribution = command.clone();
                        // Normalize plugin_id so it is always populated on the wire.
                        contribution.plugin_id = manifest.id.clone();
                        load.command_contributions.push(contribution);
                    } else {
                        load.warnings.push(format!(
                            "{}: command `{}` disabled; missing capability {:?}",
                            manifest.id, command.id, missing
                        ));
                    }
                }
                load.plugins.push(manifest);
            }
            Err(e) => {
                load.load_errors.push(LoadError {
                    plugin_ref,
                    message: e.to_string(),
                });
            }
        }
    }

    load
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_json() -> &'static str {
        r#"{
            "id": "example-plugin",
            "name": "Example Plugin",
            "version": "1.0.0",
            "commands": [
                {
                    "id": "example-plugin.example",
                    "plugin_id": "example-plugin",
                    "title": "Example Command",
                    "category": "plugin",
                    "capabilities": [],
                    "when": "workspace",
                    "args_schema": null,
                    "dangerous": false
                }
            ]
        }"#
    }

    #[test]
    fn parses_valid_manifest() {
        let (manifest, warnings) = parse_manifest(valid_json()).unwrap();
        assert_eq!(manifest.id, "example-plugin");
        assert_eq!(manifest.commands.len(), 1);
        assert_eq!(manifest.commands[0].id, "example-plugin.example");
        assert!(warnings.is_empty());
    }

    #[test]
    fn missing_required_field_is_invalid() {
        let json = r#"{ "id": "", "name": "X", "version": "1.0.0" }"#;
        assert!(matches!(parse_manifest(json), Err(PluginError::Invalid(_))));
        let json = r#"{ "name": "X", "version": "1.0.0" }"#;
        assert!(matches!(parse_manifest(json), Err(PluginError::Invalid(_))));
    }

    #[test]
    fn reserved_fields_parse_and_warn() {
        let json = r#"{
            "id": "p",
            "name": "P",
            "version": "1.0.0",
            "ui_panels": { "main": {} },
            "settings": { "x": 1 },
            "activation_events": ["onStartup"]
        }"#;
        let (manifest, warnings) = parse_manifest(json).unwrap();
        // Parsed but ignored: no command contributions are produced from them.
        assert!(manifest.commands.is_empty());
        assert!(warnings.iter().any(|w| w.contains("ui_panels")));
        assert!(warnings.iter().any(|w| w.contains("settings")));
        assert!(warnings.iter().any(|w| w.contains("activation_events")));
    }

    #[test]
    fn unknown_reserved_field_warns_not_errors() {
        let json = r#"{
            "id": "p", "name": "P", "version": "1.0.0",
            "future_thing": { "a": 1 }
        }"#;
        let (_manifest, warnings) = parse_manifest(json).unwrap();
        assert!(warnings.iter().any(|w| w.contains("future_thing")));
    }

    #[test]
    fn command_namespacing_is_enforced() {
        let json = r#"{
            "id": "p", "name": "P", "version": "1.0.0",
            "commands": [
                { "id": "other.cmd", "plugin_id": "p", "title": "T", "category": "plugin" }
            ]
        }"#;
        assert!(matches!(parse_manifest(json), Err(PluginError::Invalid(_))));
    }

    #[test]
    fn capability_gated_command_is_disabled_without_capability() {
        let temp = tempfile::tempdir().unwrap();
        let plugin_dir = temp.path().join("gated");
        std::fs::create_dir_all(&plugin_dir).unwrap();
        std::fs::write(
            plugin_dir.join("plugin.json"),
            r#"{
                "id": "gated", "name": "Gated", "version": "1.0.0",
                "capabilities": [],
                "commands": [
                    { "id": "gated.run", "plugin_id": "gated", "title": "Run",
                      "category": "plugin", "capabilities": ["process"] }
                ]
            }"#,
        )
        .unwrap();

        let load = load_plugins(temp.path());
        assert_eq!(load.plugins.len(), 1);
        // Command requires `process` which is not declared → disabled.
        assert!(load.command_contributions.is_empty());
        assert!(load.warnings.iter().any(|w| w.contains("disabled")));
    }

    #[test]
    fn capability_declared_command_is_enabled() {
        let temp = tempfile::tempdir().unwrap();
        let plugin_dir = temp.path().join("ok");
        std::fs::create_dir_all(&plugin_dir).unwrap();
        std::fs::write(
            plugin_dir.join("plugin.json"),
            r#"{
                "id": "ok", "name": "Ok", "version": "1.0.0",
                "capabilities": ["process"],
                "commands": [
                    { "id": "ok.run", "plugin_id": "ok", "title": "Run",
                      "category": "plugin", "capabilities": ["process"] }
                ]
            }"#,
        )
        .unwrap();

        let load = load_plugins(temp.path());
        assert_eq!(load.command_contributions.len(), 1);
        assert_eq!(load.command_contributions[0].id, "ok.run");
    }

    #[test]
    fn absent_directory_yields_empty_load() {
        let load = load_plugins(Path::new("/no/such/owox/plugins/dir"));
        assert!(load.plugins.is_empty());
        assert!(load.command_contributions.is_empty());
        assert!(load.load_errors.is_empty());
    }

    #[test]
    fn bad_manifest_is_load_error_not_crash() {
        let temp = tempfile::tempdir().unwrap();
        std::fs::write(temp.path().join("broken.plugin.json"), "{ not json").unwrap();
        let good = temp.path().join("good");
        std::fs::create_dir_all(&good).unwrap();
        std::fs::write(good.join("plugin.json"), valid_json()).unwrap();

        let load = load_plugins(temp.path());
        assert_eq!(load.plugins.len(), 1, "good plugin still loads");
        assert_eq!(load.load_errors.len(), 1, "bad manifest recorded");
    }

    #[test]
    fn backend_hook_is_reserved_boundary_only() {
        let json = r#"{
            "id": "h", "name": "H", "version": "1.0.0",
            "backend_hooks": [
                { "lifecycle": "on_activate", "required_capability": "process" }
            ]
        }"#;
        let (manifest, warnings) = parse_manifest(json).unwrap();
        assert_eq!(manifest.backend_hooks.len(), 1);
        assert_eq!(manifest.backend_hooks[0].lifecycle, "on_activate");
        // Declaring a hook never produces a runnable contribution.
        assert!(manifest.commands.is_empty());
        assert!(warnings.iter().any(|w| w.contains("backend_hooks")));
    }
}
