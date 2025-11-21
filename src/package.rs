use serde::Deserialize;
use std::collections::{HashMap, HashSet};

use napi::bindgen_prelude::*;
use napi_derive::napi;
use sonic_rs::{from_slice, from_str};
use sonic_rs::{to_object_iter, JsonValueTrait, LazyValue};

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

    /// Find the diff versions between the local package and the remote package
    /// source implement from cnpmcore <https://github.com/cnpm/cnpmcore/blob/master/app/core/service/PackageSyncerService.ts#L682>
    /// return the diff versions from local to remote
    ///
    /// ### Parameters
    /// - `Vec<String>`: the exists versions of the local package
    /// ### Return
    /// - `DiffResult`: the diff versions
    /// - `String`: the version
    /// - `(u32, u32)`: the version meta data position
    /// ### Example
    /// ```ts
    /// const existsVersions = ['1.0.0', '1.0.1'];
    /// const remotePkg = new Package(remoteBuffer);
    /// const diff = remotePkg.diff(existsVersions);
    /// console.log(diff);
    ///
    /// // read version meta data from buffer
    /// const versionData = remoteBuffer.subarray(position[0], position[1]);
    /// const version = JSON.parse(versionData);
    /// ```
    /// ### Output
    /// ```ts
    /// {
    ///   added_versions: [
    ///     ["1.1.0", [100992, 119796]],
    ///     ["1.2.0", [119797, 138592]],
    ///   ],
    ///   removed_versions: [
    ///     ["1.0.1", [100992, 119796]],
    ///   ],
    /// }
    /// ```
    #[napi]
    pub fn diff(&self, exists_versions: Vec<String>) -> Result<DiffResult> {
        let mut added_versions = Vec::new();
        let mut removed_versions = Vec::new();
        let Some(versions) = self.root.get("versions") else {
            return Ok(DiffResult {
                added_versions,
                removed_versions,
            });
        };

        let exists_versions_set = exists_versions
            .iter()
            .map(|s| s.as_str())
            .collect::<HashSet<_>>();
        let mut all_versions = HashMap::new();
        for (key, value) in to_object_iter(versions.as_raw_str()).flatten() {
            all_versions.insert(key, self.position(&value));
        }

        // remove the versions that exist in the local package but not in the remote package
        for version in exists_versions_set.iter() {
            let version = *version;
            if all_versions.get(version).is_none() {
                removed_versions.push(version.to_string());
            }
        }

        // add the versions that do not exist in the local package but in the remote package
        for (version, value) in all_versions {
            if !exists_versions_set.contains(version.as_ref()) {
                added_versions.push((version.to_string(), value));
            }
        }
        Ok(DiffResult {
            added_versions,
            removed_versions,
        })
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
        let readme = self.root.get("readme")?;
        Some(self.position(&readme))
    }

    #[napi(getter)]
    pub fn time(&self) -> Option<HashMap<String, String>> {
        let time = self.root.get("time")?;
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
        let tags = self.root.get("dist-tags")?;
        let mut latest_version = None;
        for (key, value) in to_object_iter(tags.as_raw_str()).flatten() {
            if key == "latest" {
                if let Some(version) = value.as_str() {
                    latest_version = Some(version.to_string());
                    break;
                }
            }
        }
        let latest_version = latest_version?;

        let versions = self.root.get("versions")?;
        for (key, value) in to_object_iter(versions.as_raw_str()).flatten() {
            if key == latest_version {
                if let Ok(version) = from_str(value.as_raw_str()) {
                    return Some(version);
                }
            }
        }
        None
    }

    fn position(&self, value: &LazyValue) -> (u32, u32) {
        let offset =
            value.as_raw_str().as_ptr() as usize - self.root.as_raw_str().as_ptr() as usize;
        (offset as u32, (offset + value.as_raw_str().len()) as u32)
    }
}

#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct DiffResult {
    pub added_versions: Vec<(String, (u32, u32))>,
    pub removed_versions: Vec<String>,
}

/// Version metadata
/// @see <https://github.com/npm/registry/blob/main/docs/REGISTRY-API.md#version>
#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Version {
    pub name: Option<String>,
    pub version: Option<String>,
    // pub author: Option<Human>,
    // pub license: Option<String>,
    // pub _id: Option<String>,
    pub maintainers: Option<Vec<Human>>,
    // pub homepage: Option<String>,
    // pub bugs: Option<Bugs>,
    pub dist: Option<Dist>,
    // pub main: Option<String>,
    // pub r#type: Option<String>,
    // pub _from: Option<String>,
    // pub types: Option<String>,
    // pub unpkg: Option<String>,
    // pub module: Option<String>,
    // pub exports: Option<HashMap<String, ExportTarget>>,
    pub funding: Option<Vec<String>>,
    pub scripts: Option<HashMap<String, String>>,
    // pub _npmUser: Option<Human>,
    // pub jsdelivr: Option<String>,
    // pub prettier: Option<String>,
    // pub _resolved: Option<String>,
    // pub _integrity: Option<String>,
    // pub repository: Option<Repository>,
    // pub _npmVersion: Option<String>,
    pub description: Option<String>,
    // pub directories: Option<HashMap<String, String>>,
    // pub _nodeVersion: Option<String>,
    // pub publishConfig: Option<PublishConfig>,
    #[serde(rename = "_hasShrinkwrap")]
    pub has_shrinkwrap: Option<bool>,
    /// an array of operating systems supported by the package
    pub os: Option<Vec<String>>,
    /// an array of CPU architectures supported by the package
    pub cpu: Option<Vec<String>>,
    /// an array of libc supported by the package
    pub libc: Option<Vec<String>>,
    // pub devDependencies: Option<HashMap<String, String>>,
    // pub peerDependencies: Option<HashMap<String, String>>,
    // pub peerDependenciesMeta: Option<HashMap<String, PeerDependenciesMeta>>,
    // pub _npmOperationalInternal: Option<NpmOperationalInternal>,
}

// #[derive(Debug, Deserialize)]
// #[serde(untagged)]
// pub enum ExportTarget {
//     /// "./package.json": "./package.json"
//     Path(String),
//     /// ".": { "browser": "...", "default": "..." }
//     Conditions(HashMap<String, String>),
// }

#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct NpmOperationalInternal {
    pub tmp: Option<String>,
    pub host: Option<String>,
}

#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct PublishConfig {
    pub registry: Option<String>,
    pub access: Option<String>,
}

#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct PeerDependenciesMeta {
    pub optional: Option<bool>,
}

/// Distribution metadata
/// @see <https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#dist>
#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Dist {
    /// the url of the tarball containing the payload for this package
    pub tarball: Option<String>,
    /// the SHA-1 sum of the tarball
    pub shasum: Option<String>,
    /// since Apr 2017, string in the format <hashAlgorithm>-<base64-hash>,
    /// refer the [Subresource Integrity](https://en.wikipedia.org/wiki/Subresource_Integrity) and [cacache](https://github.com/npm/cacache#integrity) package for more details
    pub integrity: Option<String>,
    /// since Feb 2018, the number of files in the tarball, folder excluded
    #[serde(rename = "fileCount")]
    pub file_count: Option<u32>,
    /// since Feb 2018, the total byte of the unpacked files in the tarball
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

/// Human metadata
/// @see <https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#human>
#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Human {
    /// a freeform string name
    pub name: Option<String>,
    /// an email address
    pub email: Option<String>,
    /// a url for a web page with more information about the author
    pub url: Option<String>,
}

/// Repository metadata
/// @see <https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md#repository>
#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Repository {
    pub r#type: Option<String>,
    pub url: Option<String>,
}

/// Bugs metadata
#[derive(Debug, Deserialize)]
#[napi(object)]
pub struct Bugs {
    pub url: Option<String>,
}
