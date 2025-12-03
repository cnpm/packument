use napi::bindgen_prelude::*;
use napi_derive::napi;
use sonic_rs::{get, to_object_iter, JsonValueTrait, LazyValue, PointerNode};

#[derive(Debug)]
#[napi(string_enum)]
pub enum SetPropertyKind {
    Add,
    Update,
    /// the parent property is not found, should add the parent property first
    ParentNotFound,
    /// the parent property is not an object, can't add new property to it, need to remove it first
    ParentNotObject,
}

#[derive(Debug)]
#[napi(object)]
pub struct SetPropertyPositionResult {
    pub kind: SetPropertyKind,
    /// the previous property name if the property is `Add` kind
    /// if the parent object doesn't have any property, the previous property name is `None`
    pub previous: Option<String>,
    pub start: u32,
    pub end: u32,
}

/// Build pointers from string paths without cloning - returns references into the original strings
#[inline]
fn build_pointers(paths: &[String]) -> Vec<PointerNode> {
    paths.iter().map(|p| p.as_str().into()).collect()
}

#[napi]
pub fn detect_set_property_position(
    data: &[u8],
    paths: Vec<String>,
) -> Result<SetPropertyPositionResult> {
    let pointers = build_pointers(&paths);

    // Try to get the property directly first
    match get(data, &pointers) {
        Ok(value) => {
            // update existing property
            let (start, end) = get_value_position(data, &value);
            return Ok(SetPropertyPositionResult {
                kind: SetPropertyKind::Update,
                previous: None,
                start,
                end,
            });
        }
        Err(e) if e.is_not_found() => {
            // Property not found, continue to find parent
        }
        Err(e) => return Err(napi::Error::new(Status::InvalidArg, e.to_string())),
    }

    // Property not found, try to find the parent
    let parent_pointers = build_pointers(&paths[..paths.len() - 1]);
    match get(data, &parent_pointers) {
        Ok(value) => {
            if !value.is_object() {
                return Ok(SetPropertyPositionResult {
                    kind: SetPropertyKind::ParentNotObject,
                    previous: None,
                    start: 0,
                    end: 0,
                });
            }

            // add property to the end of the parent
            let (_, parent_end) = get_value_position(data, &value);
            // the start position of the new property is the `end position - 1` of the parent ("}" character)
            let start = parent_end - 1;
            // try to find the last property of the parent
            let previous = to_object_iter(value.as_raw_str())
                .flatten()
                .last()
                .map(|(key, _)| key.to_string());

            Ok(SetPropertyPositionResult {
                kind: SetPropertyKind::Add,
                previous,
                start,
                end: start,
            })
        }
        Err(e) if e.is_not_found() => Ok(SetPropertyPositionResult {
            kind: SetPropertyKind::ParentNotFound,
            previous: None,
            start: 0,
            end: 0,
        }),
        Err(e) => Err(napi::Error::new(Status::InvalidArg, e.to_string())),
    }
}

#[derive(Debug)]
#[napi(string_enum)]
pub enum DeletePropertyKind {
    /// only one property in the object
    FoundAndOnlyOne,
    /// found at the start of the object
    FoundAtStart,
    /// found at the middle of the object
    FoundAtMiddle,
    NotFound,
}

#[derive(Debug)]
#[napi(object)]
pub struct DeletePropertyPositionResult {
    pub kind: DeletePropertyKind,
    pub start: u32,
    pub end: u32,
}

const NOT_FOUND_RESULT: DeletePropertyPositionResult = DeletePropertyPositionResult {
    kind: DeletePropertyKind::NotFound,
    start: 0,
    end: 0,
};

#[napi]
pub fn detect_delete_property_position(
    data: &[u8],
    paths: Vec<String>,
) -> Result<DeletePropertyPositionResult> {
    let pointers = build_pointers(&paths);

    // fast path: check if property exists
    if let Err(e) = get(data, &pointers) {
        return if e.is_not_found() {
            Ok(NOT_FOUND_RESULT)
        } else {
            Err(napi::Error::new(Status::InvalidArg, e.to_string()))
        };
    }

    // find parent
    let parent_pointers = build_pointers(&paths[..paths.len() - 1]);
    let delete_property = &paths[paths.len() - 1];

    let parent = match get(data, &parent_pointers) {
        Ok(p) => p,
        Err(e) if e.is_not_found() => return Ok(NOT_FOUND_RESULT),
        Err(e) => return Err(napi::Error::new(Status::InvalidArg, e.to_string())),
    };

    let mut has_previous = false;
    let mut has_next = false;
    let mut found_position: Option<(u32, u32)> = None;
    // { "foo": "bar" }
    //  ^
    //  start
    let mut start = get_value_position(data, &parent).0 + 1;

    for (key, value) in to_object_iter(parent.as_raw_str()).flatten() {
        let (_, end) = get_value_position(data, &value);

        if key == delete_property.as_str() {
            // found the property
            // { "foo": "bar", "baz": "qux", "next": "next" }
            //               ^            ^
            //               start        end
            found_position = Some((start, end));
            if has_previous {
                break;
            }
        } else if found_position.is_none() {
            // { "foo": "bar", "baz": "qux", "next": "next" }
            //  ^           ^
            //  start,      end
            has_previous = true;
        } else {
            has_next = true;
            // { "baz": "qux", "next": "next" }
            //               ^              ^
            //               start          end
            break;
        }
        start = end;
    }

    let Some((start, end)) = found_position else {
        return Ok(NOT_FOUND_RESULT);
    };

    // has previous: delete from middle
    if has_previous {
        return Ok(DeletePropertyPositionResult {
            kind: DeletePropertyKind::FoundAtMiddle,
            start,
            end,
        });
    }

    // has next: delete from start, include trailing comma
    if has_next {
        // move end to the nearest position of the trailing comma
        // { "baz": "qux"      , "next": "next" }
        //  ^           ^
        //  start,      end
        //                     ^
        //                     new_end
        let new_end = data[end as usize..]
            .iter()
            .position(|&b| b == b',')
            .ok_or_else(|| {
                napi::Error::new(
                    Status::InvalidArg,
                    "Invalid JSON format, trailing comma not found",
                )
            })?;

        return Ok(DeletePropertyPositionResult {
            kind: DeletePropertyKind::FoundAtStart,
            start,
            end: end + new_end as u32 + 1,
        });
    }

    // only one property
    Ok(DeletePropertyPositionResult {
        kind: DeletePropertyKind::FoundAndOnlyOne,
        start,
        end,
    })
}

#[napi]
pub fn has_in(data: &[u8], paths: Vec<String>) -> Result<bool> {
    let pointers = build_pointers(&paths);
    match get(data, &pointers) {
        Ok(_) => Ok(true),
        Err(e) if e.is_not_found() => Ok(false),
        Err(e) => Err(napi::Error::new(Status::InvalidArg, e.to_string())),
    }
}

fn get_value_position(data: &[u8], value: &LazyValue) -> (u32, u32) {
    let offset = value.as_raw_str().as_ptr() as usize - data.as_ptr() as usize;
    (offset as u32, (offset + value.as_raw_str().len()) as u32)
}
