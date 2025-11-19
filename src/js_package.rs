use std::collections::HashMap;

use napi::bindgen_prelude::*;
use napi_derive::napi;

use crate::package::Package;

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
pub struct JsPackage {
    package: Package,
}

#[napi]
impl JsPackage {
    #[napi(constructor)]
    pub fn new(data: &[u8]) -> Result<Self> {
        Ok(JsPackage {
            package: Package::from_data(data)
                .map_err(|e| napi::Error::new(napi::Status::InvalidArg, e.to_string()))?,
        })
    }

    #[napi(getter)]
    pub fn name(&self) -> String {
        self.package.name().to_string()
    }

    #[napi(getter)]
    pub fn description(&self) -> Option<String> {
        self.package.description().map(|s| s.to_string())
    }

    #[napi(getter)]
    pub fn readme(&self) -> Option<String> {
        self.package.readme().map(|s| s.to_string())
    }

    #[napi(getter)]
    pub fn time(&self) -> HashMap<String, String> {
        let time = self.package.time();
        let mut out = HashMap::default();
        for (key, value) in time.iter() {
            out.insert(key.to_string(), value.to_string());
        }
        out
    }

    #[napi(getter)]
    pub fn is_unpublished(&self) -> bool {
        self.package.is_unpublished()
    }
}
