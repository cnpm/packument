#![expect(clippy::impl_trait_in_params)] // from self_cell

use rustc_hash::FxHashMap;
use self_cell::{self_cell, MutBorrow};
use simd_json::{
    base::{ValueAsObject, ValueAsScalar},
    borrowed::Object,
    BorrowedValue,
};

self_cell!(
    /// Package full metadata from npm registry, called "packument"
    /// <https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md>
    pub struct Package {
        owner: MutBorrow<Vec<u8>>,

        #[covariant]
        dependent: BorrowedValue,
    }
);

impl Package {
    pub fn from_data(data: Vec<u8>) -> Result<Self, simd_json::Error> {
        Self::try_new(MutBorrow::new(data), |bytes| {
            simd_json::to_borrowed_value(bytes.borrow_mut())
        })
    }

    pub fn name(&self) -> &str {
        self.borrow_dependent().as_object().unwrap()["name"]
            .as_str()
            .unwrap()
    }

    pub fn description(&self) -> Option<&str> {
        self.borrow_dependent()
            .as_object()
            .unwrap()
            .get("description")
            .and_then(|v| v.as_str())
    }

    pub fn readme(&self) -> Option<&str> {
        self.borrow_dependent()
            .as_object()
            .unwrap()
            .get("readme")
            .and_then(|v| v.as_str())
    }

    pub fn time(&self) -> FxHashMap<&str, &str> {
        let time = self.borrow_dependent().as_object().unwrap()["time"]
            .as_object()
            .unwrap();
        let mut out = FxHashMap::default();
        for (key, value) in time.iter() {
            out.insert(key.as_ref(), value.as_str().unwrap());
        }
        out
    }

    pub fn is_unpublished(&self) -> bool {
        // time.unpublished
        self.borrow_dependent()
            .as_object()
            .unwrap()
            .get("time")
            .and_then(|v| v.as_object())
            .and_then(|v| v.get("unpublished").and_then(|v| v.as_str()))
            .is_some()
    }

    pub fn modified(&self) -> &str {
        // time.modified
        self.borrow_dependent().as_object().unwrap()["time"]
            .as_object()
            .unwrap()["modified"]
            .as_str()
            .unwrap()
    }

    /// Get distribution tags
    pub fn dist_tags(&self) -> FxHashMap<&str, &str> {
        let dist_tags = self.borrow_dependent().as_object().unwrap()["dist-tags"]
            .as_object()
            .unwrap();
        let mut out = FxHashMap::default();
        for (tag, v) in dist_tags.iter() {
            out.insert(tag.as_ref(), v.as_str().unwrap());
        }
        out
    }

    /// Get all versions as a map of version string to PackageVersion
    pub fn versions(&self) -> FxHashMap<&str, PackageVersion<'_>> {
        let versions = self.borrow_dependent().as_object().unwrap()["versions"]
            .as_object()
            .unwrap();
        let mut out = FxHashMap::default();
        for (version, version_obj) in versions.iter() {
            let version_obj = version_obj.as_object().unwrap();
            out.insert(version.as_ref(), PackageVersion { obj: version_obj });
        }
        out
    }

    /// Get a specific version by version string
    pub fn get_version(&self, version: &str) -> Option<PackageVersion<'_>> {
        let versions = self.borrow_dependent().as_object().unwrap()["versions"]
            .as_object()
            .unwrap();
        versions
            .get(version)
            .and_then(|v| v.as_object())
            .map(|obj| PackageVersion { obj })
    }
}

/// Zero-copy view into a package version (similar to VersionMetadata but borrowed)
#[derive(Debug, Clone, Copy)]
pub struct PackageVersion<'a> {
    obj: &'a Object<'a>,
}

impl<'a> PackageVersion<'a> {
    /// Get package name
    pub fn name(&self) -> &'a str {
        self.obj["name"].as_str().unwrap()
    }

    /// Get version string
    pub fn version(&self) -> &'a str {
        self.obj["version"].as_str().unwrap()
    }

    /// Get dependencies (zero-copy)
    pub fn dependencies(&self) -> Option<FxHashMap<&'a str, &'a str>> {
        Self::extract_deps(self.obj, "dependencies")
    }

    /// Get peer dependencies (zero-copy)
    pub fn peer_dependencies(&self) -> Option<FxHashMap<&'a str, &'a str>> {
        Self::extract_deps(self.obj, "peerDependencies")
    }

    /// Get optional dependencies (zero-copy)
    pub fn optional_dependencies(&self) -> Option<FxHashMap<&'a str, &'a str>> {
        Self::extract_deps(self.obj, "optionalDependencies")
    }

    /// Get dev dependencies (zero-copy)
    pub fn dev_dependencies(&self) -> Option<FxHashMap<&'a str, &'a str>> {
        Self::extract_deps(self.obj, "devDependencies")
    }

    /// Get distribution information
    pub fn dist(&self) -> PackageDist<'a> {
        let dist_obj = self.obj["dist"].as_object().unwrap();
        PackageDist { obj: dist_obj }
    }

    /// Check if deprecated
    pub fn is_deprecated(&self) -> bool {
        self.obj.get("deprecated").is_some()
    }

    /// Get deprecation message
    pub fn deprecated_message(&self) -> Option<&'a str> {
        self.obj.get("deprecated")?.as_str()
    }

    /// Helper to extract dependency maps
    fn extract_deps(obj: &'a Object<'a>, field: &str) -> Option<FxHashMap<&'a str, &'a str>> {
        let deps = obj.get(field)?.as_object()?;
        let mut out = FxHashMap::default();
        for (name, version) in deps.iter() {
            out.insert(name.as_ref(), version.as_str()?);
        }
        Some(out)
    }
}

/// Zero-copy view into package dist information
#[derive(Debug, Clone, Copy)]
pub struct PackageDist<'a> {
    obj: &'a Object<'a>,
}

impl<'a> PackageDist<'a> {
    /// Get tarball URL
    pub fn tarball(&self) -> &'a str {
        self.obj["tarball"].as_str().unwrap()
    }

    /// Get shasum (SHA-1)
    pub fn shasum(&self) -> &'a str {
        self.obj["shasum"].as_str().unwrap()
    }

    /// Get integrity (SRI)
    pub fn integrity(&self) -> Option<&'a str> {
        self.obj.get("integrity")?.as_str()
    }

    /// Get file count
    pub fn file_count(&self) -> Option<u32> {
        self.obj.get("fileCount")?.as_u64().map(|n| n as u32)
    }

    /// Get unpacked size in bytes
    pub fn unpacked_size(&self) -> Option<u64> {
        self.obj.get("unpackedSize")?.as_u64()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_package_from_data() {
        let data = r#"
        {
            "name": "leftpad",
            "time": { "modified": "2024-11-12T08:15:30.000Z" },
            "dist-tags": { "latest": "1.3.0", "beta": "2.0.0-beta.1" },
            "versions": {
                "1.3.0": {
                    "name": "leftpad",
                    "version": "1.3.0",
                    "dist": { "tarball": "https://registry.npmjs.org/leftpad/-/leftpad-1.3.0.tgz", "shasum": "abc123" },
                    "dependencies": { "lodash": "^4.17.21" }
                },
                "2.0.0-beta.1": {
                    "name": "leftpad",
                    "version": "2.0.0-beta.1",
                    "dist": { "tarball": "https://registry.npmjs.org/leftpad/-/leftpad-2.0.0-beta.1.tgz", "shasum": "def456", "integrity": "sha512-1234567890", "fileCount": 100, "unpackedSize": 1000 }
                }
            }
        }"#;
        let package = Package::from_data(data.as_bytes().to_vec()).unwrap();
        assert_eq!(package.name(), "leftpad");
        assert_eq!(package.description(), None);
        assert_eq!(package.readme(), None);
        assert_eq!(
            package.time().get("modified"),
            Some(&"2024-11-12T08:15:30.000Z")
        );
        assert!(!package.is_unpublished());

        // Test dist-tags
        let dist_tags = package.dist_tags();
        assert_eq!(dist_tags.get("latest"), Some(&"1.3.0"));
        assert_eq!(dist_tags.get("beta"), Some(&"2.0.0-beta.1"));

        // Test modified
        assert_eq!(package.modified(), "2024-11-12T08:15:30.000Z");

        // Test versions
        let versions = package.versions();
        assert_eq!(versions.len(), 2);
        assert!(versions.contains_key("1.3.0"));
        assert!(versions.contains_key("2.0.0-beta.1"));

        // Test get_version
        let v1 = package.get_version("1.3.0").unwrap();
        assert_eq!(v1.name(), "leftpad");
        assert_eq!(v1.version(), "1.3.0");

        // Test dist
        let dist = v1.dist();
        assert_eq!(
            dist.tarball(),
            "https://registry.npmjs.org/leftpad/-/leftpad-1.3.0.tgz"
        );
        assert_eq!(dist.shasum(), "abc123");
        assert!(dist.integrity().is_none());
        assert!(dist.file_count().is_none());
        assert!(dist.unpacked_size().is_none());

        // Test dependencies
        let deps = v1.dependencies().unwrap();
        assert_eq!(deps.get("lodash"), Some(&"^4.17.21"));

        // Test version without dependencies
        let v2 = package.get_version("2.0.0-beta.1").unwrap();
        assert_eq!(v2.name(), "leftpad");
        assert!(v2.dependencies().is_none());

        // Test deprecated
        assert!(!v1.is_deprecated());
        assert!(v1.deprecated_message().is_none());

        // Test dist
        let dist = v2.dist();
        assert_eq!(
            dist.tarball(),
            "https://registry.npmjs.org/leftpad/-/leftpad-2.0.0-beta.1.tgz"
        );
        assert_eq!(dist.shasum(), "def456");
        assert_eq!(dist.integrity(), Some("sha512-1234567890"));
        assert_eq!(dist.file_count(), Some(100));
        assert_eq!(dist.unpacked_size(), Some(1000));
    }

    #[test]
    fn test_package_is_unpublished() {
        let data = r#"
        {
            "name": "leftpad",
            "time": { "unpublished": "2024-11-12T08:15:30.000Z" }
        }"#;
        let package = Package::from_data(data.as_bytes().to_vec()).unwrap();
        assert!(package.is_unpublished());

        let data = r#"
        {
            "name": "leftpad",
            "time": { "modified": "2024-11-12T08:15:30.000Z" }
        }"#;
        let package = Package::from_data(data.as_bytes().to_vec()).unwrap();
        assert!(!package.is_unpublished());
    }
}
