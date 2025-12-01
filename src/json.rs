use napi::bindgen_prelude::*;
use napi_derive::napi;
use sonic_rs::{get, pointer, to_object_iter, JsonValueTrait};

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
    pub previous: Option<String>,
    pub start: u32,
    pub end: u32,
}

#[napi]
pub fn detect_set_property_position(
    data: &[u8],
    paths: Vec<String>,
) -> Result<SetPropertyPositionResult> {
    let mut pointers = pointer![].to_vec();
    for path in paths {
        pointers.push(path.as_str().into());
    }
    match get(data, &pointers) {
        Ok(value) => {
            // update existing property
            let start = value.as_raw_str().as_ptr() as u32 - data.as_ptr() as u32;
            let end = start + value.as_raw_str().len() as u32;
            Ok(SetPropertyPositionResult {
                kind: SetPropertyKind::Update,
                previous: None,
                start,
                end,
            })
        }
        Err(e) if e.is_not_found() => {
            // try to find the parent property
            let mut parent_pointers = pointers.clone();
            parent_pointers.pop();
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
                    let parent_start = value.as_raw_str().as_ptr() as u32 - data.as_ptr() as u32;
                    let parent_end = parent_start + value.as_raw_str().len() as u32;
                    // the start position of the new property is the `end position - 1` of the parent ("}" character)
                    let start = parent_end - 1;
                    // try to find the last property of the parent
                    let last_property = to_object_iter(value.as_raw_str()).flatten().last();
                    if let Some(last_property) = last_property {
                        return Ok(SetPropertyPositionResult {
                            kind: SetPropertyKind::Add,
                            previous: Some(last_property.0.to_string()),
                            start,
                            end: start,
                        });
                    }
                    Ok(SetPropertyPositionResult {
                        kind: SetPropertyKind::Add,
                        previous: None,
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
                Err(e) => {
                    return Err(napi::Error::new(Status::InvalidArg, e.to_string()));
                }
            }
        }
        Err(e) => {
            return Err(napi::Error::new(Status::InvalidArg, e.to_string()));
        }
    }
}
