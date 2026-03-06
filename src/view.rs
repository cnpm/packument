use std::collections::HashMap;

use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::de::{IgnoredAny, MapAccess, Visitor};
use serde::{Deserialize, Deserializer};
use sonic_rs::from_str;

use crate::package::{Human, Repository};

// ─── Custom deserializers ────────────────────────────────────────────

/// Versions: extract only keys, skip values with IgnoredAny.
fn deserialize_version_keys<'de, D>(deserializer: D) -> std::result::Result<Vec<String>, D::Error>
where
    D: Deserializer<'de>,
{
    struct VersionKeysVisitor;
    impl<'de> Visitor<'de> for VersionKeysVisitor {
        type Value = Vec<String>;
        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("a map of version strings to objects")
        }
        fn visit_map<M: MapAccess<'de>>(
            self,
            mut map: M,
        ) -> std::result::Result<Vec<String>, M::Error> {
            let mut keys = Vec::with_capacity(map.size_hint().unwrap_or(0));
            while let Some(key) = map.next_key::<String>()? {
                map.next_value::<IgnoredAny>()?;
                keys.push(key);
            }
            Ok(keys)
        }
    }
    deserializer.deserialize_map(VersionKeysVisitor)
}

/// Intermediate result from deserializing the `time` object.
#[derive(Default)]
struct TimeResult {
    time: Option<HashMap<String, String>>,
    is_unpublished: bool,
}

/// Time: parse string values + detect `unpublished` key.
///
/// The `unpublished` key can be either a string or an object in the registry.
/// Non-string values for normal time entries are skipped (consistent with
/// `Package::get_record_by_key` in package.rs which uses `filter_map`).
fn deserialize_time<'de, D>(deserializer: D) -> std::result::Result<TimeResult, D::Error>
where
    D: Deserializer<'de>,
{
    struct TimeVisitor;
    impl<'de> Visitor<'de> for TimeVisitor {
        type Value = TimeResult;
        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("a time object")
        }
        fn visit_map<M: MapAccess<'de>>(
            self,
            mut map: M,
        ) -> std::result::Result<Self::Value, M::Error> {
            let mut time_map = HashMap::new();
            let mut is_unpublished = false;
            while let Some(key) = map.next_key::<String>()? {
                if key == "unpublished" {
                    map.next_value::<IgnoredAny>()?;
                    is_unpublished = true;
                } else if let Ok(val) = map.next_value::<String>() {
                    time_map.insert(key, val);
                }
            }
            Ok(TimeResult {
                time: if time_map.is_empty() {
                    None
                } else {
                    Some(time_map)
                },
                is_unpublished,
            })
        }
    }
    deserializer.deserialize_map(TimeVisitor)
}

/// Repository: intentionally returns None on any deserialization error,
/// because npm registry data quality varies — `repository` may contain
/// arrays, numbers, or other unexpected types that we cannot represent.
fn deserialize_repo<'de, D>(deserializer: D) -> std::result::Result<Option<RepositoryRaw>, D::Error>
where
    D: Deserializer<'de>,
{
    Ok(Option::<RepositoryRaw>::deserialize(deserializer).unwrap_or(None))
}

#[derive(Deserialize)]
#[serde(untagged)]
enum RepositoryRaw {
    Str(String),
    Obj(Repository),
}

// ─── Serde struct: single-pass deserialization ───────────────────────

#[derive(Deserialize)]
struct MetaInfoRaw {
    name: Option<String>,
    description: Option<String>,
    readme: Option<String>,
    #[serde(default, deserialize_with = "deserialize_repo")]
    repository: Option<RepositoryRaw>,
    maintainers: Option<Vec<Human>>,
    #[serde(rename = "dist-tags")]
    dist_tags: Option<HashMap<String, String>>,
    #[serde(default, deserialize_with = "deserialize_time", rename = "time")]
    time_result: TimeResult,
    #[serde(default, deserialize_with = "deserialize_version_keys")]
    versions: Vec<String>,
}

// ─── N-API result type ───────────────────────────────────────────────

/// Top-level metadata extracted from a packument in a single pass.
///
/// Equivalent to reading `.name`, `.description`, `.readme`, `.repository`,
/// `.maintainers`, `.distTags`, `.time`, `.isUnpublished` individually,
/// but only traverses the JSON document once. The `versions` field extracts
/// only the version keys (using `IgnoredAny` to skip manifests).
#[napi(object)]
pub struct MetaInfo {
    pub name: Option<String>,
    pub description: Option<String>,
    pub readme: Option<String>,
    pub repository: Option<Either<String, Repository>>,
    pub maintainers: Option<Vec<Human>>,
    pub dist_tags: Option<HashMap<String, String>>,
    pub time: Option<HashMap<String, String>>,
    pub is_unpublished: bool,
    /// Only the version keys, without deserializing version manifests.
    pub version_keys: Vec<String>,
}

impl From<MetaInfoRaw> for MetaInfo {
    fn from(raw: MetaInfoRaw) -> Self {
        Self {
            name: raw.name,
            description: raw.description,
            readme: raw.readme,
            repository: raw.repository.map(|r| match r {
                RepositoryRaw::Str(s) => Either::A(s),
                RepositoryRaw::Obj(o) => Either::B(o),
            }),
            maintainers: raw.maintainers,
            dist_tags: raw.dist_tags,
            time: raw.time_result.time,
            is_unpublished: raw.time_result.is_unpublished,
            version_keys: raw.versions,
        }
    }
}

// ─── Public API ──────────────────────────────────────────────────────

pub fn parse_meta_info(raw_json: &str) -> Result<MetaInfo> {
    let raw: MetaInfoRaw =
        from_str(raw_json).map_err(|e| Error::new(Status::InvalidArg, e.to_string()))?;
    Ok(raw.into())
}
