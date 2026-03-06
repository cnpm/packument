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
    struct V;
    impl<'de> Visitor<'de> for V {
        type Value = Vec<String>;
        fn expecting(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
            f.write_str("a map")
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
    deserializer.deserialize_map(V)
}

/// Time: parse string values + detect `unpublished` key.
fn deserialize_time<'de, D>(
    deserializer: D,
) -> std::result::Result<(Option<HashMap<String, String>>, bool), D::Error>
where
    D: Deserializer<'de>,
{
    struct V;
    impl<'de> Visitor<'de> for V {
        type Value = (Option<HashMap<String, String>>, bool);
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
                } else {
                    let val: String = map.next_value().unwrap_or_default();
                    time_map.insert(key, val);
                }
            }
            Ok((
                if time_map.is_empty() {
                    None
                } else {
                    Some(time_map)
                },
                is_unpublished,
            ))
        }
    }
    deserializer.deserialize_map(V)
}

/// Repository: string or object.
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
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    readme: Option<String>,
    #[serde(default, deserialize_with = "deserialize_repo")]
    repository: Option<RepositoryRaw>,
    #[serde(default)]
    maintainers: Option<Vec<Human>>,
    #[serde(default, rename = "dist-tags")]
    dist_tags: Option<HashMap<String, String>>,
    #[serde(default, deserialize_with = "deserialize_time", rename = "time")]
    time_raw: (Option<HashMap<String, String>>, bool),
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

// ─── Public API ──────────────────────────────────────────────────────

pub fn parse_meta_info(data: &str) -> Result<MetaInfo> {
    let raw: MetaInfoRaw =
        from_str(data).map_err(|e| Error::new(Status::InvalidArg, e.to_string()))?;
    Ok(MetaInfo {
        name: raw.name,
        description: raw.description,
        readme: raw.readme,
        repository: raw.repository.map(|r| match r {
            RepositoryRaw::Str(s) => Either::A(s),
            RepositoryRaw::Obj(o) => Either::B(o),
        }),
        maintainers: raw.maintainers,
        dist_tags: raw.dist_tags,
        time: raw.time_raw.0,
        is_unpublished: raw.time_raw.1,
        version_keys: raw.versions,
    })
}
