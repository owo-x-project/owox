use serde::de::DeserializeOwned;
use serde::ser::SerializeTuple;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::Value;

pub const WS_SCHEMA_VERSION: u16 = 1;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum EventType {
    #[serde(rename = "term.create")]
    TermCreate,
    #[serde(rename = "term.input")]
    TermInput,
    #[serde(rename = "term.resize")]
    TermResize,
    #[serde(rename = "term.output")]
    TermOutput,
    #[serde(rename = "term.state")]
    TermState,
    #[serde(rename = "term.close")]
    TermClose,
    #[serde(rename = "git.status")]
    GitStatus,
    #[serde(rename = "git.diff")]
    GitDiff,
    #[serde(rename = "git.op.start")]
    GitOpStart,
    #[serde(rename = "git.op.done")]
    GitOpDone,
    #[serde(rename = "file.tree")]
    FileTree,
    #[serde(rename = "file.open")]
    FileOpen,
    #[serde(rename = "file.write")]
    FileWrite,
    #[serde(rename = "file.change")]
    FileChange,
    #[serde(rename = "log.chunk")]
    LogChunk,
    #[serde(rename = "log.state")]
    LogState,
    #[serde(rename = "ui.surface")]
    UiSurface,
    #[serde(rename = "ui.sheet")]
    UiSheet,
    #[serde(rename = "cmd.result")]
    CommandResult,
    #[serde(rename = "err.show")]
    ErrorShow,
    #[serde(rename = "sub.ack")]
    SubscriptionAck,
}

#[derive(Debug, Clone, PartialEq)]
pub struct WsEnvelope {
    pub schema_version: u16,
    pub event_type: EventType,
    pub event_id: String,
    pub project_id: Option<String>,
    pub session_id: Option<String>,
    pub server_epoch_ms: i64,
    pub stream_sequence: Option<u64>,
    pub payload: Value,
}

impl WsEnvelope {
    pub fn new(event_type: EventType, payload: Value) -> Self {
        Self {
            schema_version: WS_SCHEMA_VERSION,
            event_type,
            event_id: format!("evt_{}", uuid::Uuid::new_v4().simple()),
            project_id: None,
            session_id: None,
            server_epoch_ms: 0,
            stream_sequence: None,
            payload,
        }
    }

    pub fn to_msgpack(&self) -> Result<Vec<u8>, rmp_serde::encode::Error> {
        rmp_serde::to_vec_named(self)
    }

    pub fn from_msgpack<T: AsRef<[u8]>>(bytes: T) -> Result<Self, rmp_serde::decode::Error> {
        rmp_serde::from_slice(bytes.as_ref())
    }

    pub fn payload_as<T: DeserializeOwned>(&self) -> serde_json::Result<T> {
        serde_json::from_value(self.payload.clone())
    }
}

impl Serialize for WsEnvelope {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        // @spec SPEC-shared-websocket-events
        // Fixed tuple order: [v,t,id,p,s,ts,q,pl].
        let mut tuple = serializer.serialize_tuple(8)?;
        tuple.serialize_element(&self.schema_version)?;
        tuple.serialize_element(&self.event_type)?;
        tuple.serialize_element(&self.event_id)?;
        tuple.serialize_element(&self.project_id)?;
        tuple.serialize_element(&self.session_id)?;
        tuple.serialize_element(&self.server_epoch_ms)?;
        tuple.serialize_element(&self.stream_sequence)?;
        tuple.serialize_element(&self.payload)?;
        tuple.end()
    }
}

impl<'de> Deserialize<'de> for WsEnvelope {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let (
            schema_version,
            event_type,
            event_id,
            project_id,
            session_id,
            server_epoch_ms,
            stream_sequence,
            payload,
        ) = <(
            u16,
            EventType,
            String,
            Option<String>,
            Option<String>,
            i64,
            Option<u64>,
            Value,
        )>::deserialize(deserializer)?;

        Ok(Self {
            schema_version,
            event_type,
            event_id,
            project_id,
            session_id,
            server_epoch_ms,
            stream_sequence,
            payload,
        })
    }
}
