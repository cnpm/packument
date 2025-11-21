use serde::Deserialize;
use std::collections::HashMap;

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sonic_rs::{from_slice, from_str};
use sonic_rs::{to_object_iter, JsonValueTrait, LazyValue};

/// Diff two packages
/// source implement from cnpmcore <https://github.com/cnpm/cnpmcore/blob/master/app/core/service/PackageSyncerService.ts#L682>
/// return the diff versions from local to remote
// pub fn diff(local: &Package, remote: &Package) -> Vec<&str> {
//     let local_versions = local.versions();
//     let remote_versions = remote.versions();
//     let mut diff = Vec::new();
//     for (version, _) in local_versions {
//         if remote_versions.get(version).is_none() {
//             diff.push(version);
//         }
//     }
//     for (version, _) in remote_versions {
//         if local_versions.get(version).is_none() {
//             diff.push(version);
//         }
//     }
//     diff
// }

/// Package metadata document, sometimes informally called a "packument" or "doc.json".
/// @see <https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md>
#[napi]
pub struct Package<'a> {
    root: LazyValue<'a>,
}

#[napi]
impl<'a> Package<'a> {
    #[napi(constructor)]
    pub fn new(data: &'a [u8]) -> Result<Self> {
        let root: LazyValue =
            from_slice(data).map_err(|e| Error::new(Status::InvalidArg, e.to_string()))?;
        Ok(Package { root })
    }

    #[napi(getter)]
    pub fn name(&self) -> Option<String> {
        self.root
            .get("name")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
    }

    #[napi(getter)]
    pub fn description(&self) -> Option<String> {
        self.root
            .get("description")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
    }

    #[napi(getter)]
    pub fn readme(&self) -> Option<String> {
        // max readme length is 64KB: 64 * 1024
        // https://github.com/npm/marky-markdown/issues/268
        // https://github.com/npm/npm-registry-couchapp/commit/ff64eac716a980aa446346d70ecc57d6b979948a#diff-12e8e4be37ef9a7734b14da361001597de99b907d2eee34e5980f949e551bf13R28
        self.root
            .get("readme")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
    }

    #[napi(getter)]
    pub fn readme_position(&self) -> Option<(u32, u32)> {
        let Some(readme) = self.root.get("readme") else {
            return None;
        };
        let offset =
            readme.as_raw_str().as_ptr() as usize - self.root.as_raw_str().as_ptr() as usize;
        Some((offset as u32, (offset + readme.as_raw_str().len()) as u32))
    }

    #[napi(getter)]
    pub fn time(&self) -> Option<HashMap<String, String>> {
        let Some(time) = self.root.get("time") else {
            return None;
        };
        let mut out = HashMap::default();
        for (key, value) in to_object_iter(time.as_raw_str()).flatten() {
            if let Some(value) = value.as_str() {
                out.insert(key.to_string(), value.to_string());
            }
        }
        Some(out)
    }

    #[napi(getter)]
    pub fn is_unpublished(&self) -> bool {
        let Some(time) = self.root.get("time") else {
            return false;
        };
        for (key, value) in to_object_iter(time.as_raw_str()).flatten() {
            if key == "unpublished" && value.is_str() {
                return true;
            }
        }
        false
    }

    #[napi(getter)]
    pub fn versions(&self) -> Result<HashMap<String, Version>> {
        let mut out = HashMap::default();
        let Some(versions) = self.root.get("versions") else {
            return Ok(out);
        };
        for (key, value) in to_object_iter(versions.as_raw_str()).flatten() {
            let version: Version = from_str(value.as_raw_str())
                .map_err(|e| Error::new(Status::InvalidArg, e.to_string()))?;
            out.insert(key.to_string(), version);
        }
        Ok(out)
    }

    #[napi]
    pub fn get_latest_version(&self) -> Option<Version> {
        let Some(tags) = self.root.get("dist-tags") else {
            return None;
        };
        let mut latest_version = None;
        for (key, value) in to_object_iter(tags.as_raw_str()).flatten() {
            if key == "latest" {
                if let Some(version) = value.as_str() {
                    latest_version = Some(version.to_string());
                    break;
                }
            }
        }
        let Some(latest_version) = latest_version else {
            return None;
        };

        let Some(versions) = self.root.get("versions") else {
            return None;
        };
        for (key, value) in to_object_iter(versions.as_raw_str()).flatten() {
            if key == latest_version {
                if let Ok(version) = from_str(value.as_raw_str()) {
                    return Some(version);
                }
            }
        }
        None
    }
}

/// Version metadata
/// @see <https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#version>
#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Version {
    pub name: Option<String>,
    pub version: Option<String>,
    pub homepage: Option<String>,
    pub dist: Option<Dist>,
}

/// Distribution metadata
/// @see <https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#dist>
#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Dist {
    pub tarball: Option<String>,
    pub shasum: Option<String>,
    pub integrity: Option<String>,
    #[serde(rename = "fileCount")]
    pub file_count: Option<u32>,
    #[serde(rename = "unpackedSize")]
    pub unpacked_size: Option<u32>,
    pub signatures: Option<Vec<Signature>>,
    pub attestations: Option<Attestation>,
}

#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Signature {
    pub sig: Option<String>,
    pub keyid: Option<String>,
}

#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Attestation {
    pub url: Option<String>,
    pub provenance: Option<Provenance>,
}

#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Provenance {
    #[serde(rename = "predicateType")]
    pub predicate_type: Option<String>,
}
