use std::collections::HashMap;

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sonic_rs::from_slice;
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

#[napi(js_name = "Package")]
pub struct JsPackage<'a> {
    root: LazyValue<'a>,
}

#[napi]
impl<'a> JsPackage<'a> {
    #[napi(constructor)]
    pub fn new(data: &'a [u8]) -> Result<Self> {
        let root: LazyValue =
            from_slice(data).map_err(|e| Error::new(Status::InvalidArg, e.to_string()))?;
        Ok(JsPackage { root })
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
        self.root
            .get("readme")
            .and_then(|v| v.as_str().map(|s| s.to_string()))
    }

    #[napi(getter)]
    pub fn time(&self) -> Option<HashMap<String, String>> {
        let Some(time) = self.root.get("time") else {
            return None;
        };
        let mut out = HashMap::default();
        for iter in to_object_iter(time.as_raw_str()) {
            if let Ok((key, value)) = iter {
                if let Some(value) = value.as_str() {
                    out.insert(key.to_string(), value.to_string());
                }
            }
        }
        Some(out)
    }

    #[napi(getter)]
    pub fn is_unpublished(&self) -> bool {
        let Some(time) = self.root.get("time") else {
            return false;
        };
        for iter in to_object_iter(time.as_raw_str()) {
            if let Ok((key, value)) = iter {
                if key == "unpublished" && value.is_str() {
                    return true;
                }
            }
        }
        false
    }
}
