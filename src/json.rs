use napi::bindgen_prelude::*;
use napi_derive::napi;
use sonic_rs::{get, pointer, to_object_iter, JsonValueTrait, LazyValue};

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
    /// if the parent object don't have any property, the previous property name is `None`
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
    // use get_unchecked will be faster than get, but it will panic if json format is invalid
    match get(data, &pointers) {
        Ok(value) => {
            // update existing property
            let (start, end) = get_value_position(data, &value);
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
                    let (_, parent_end) = get_value_position(data, &value);
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
                Err(e) => Err(napi::Error::new(Status::InvalidArg, e.to_string())),
            }
        }
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

#[napi]
pub fn detect_delete_property_position(
    data: &[u8],
    paths: Vec<String>,
) -> Result<DeletePropertyPositionResult> {
    // find parent
    let mut pointers = pointer![].to_vec();
    for path in paths[..paths.len() - 1].iter() {
        pointers.push(path.as_str().into());
    }
    let delete_property = if let Some(delete_property) = paths.last() {
        delete_property
    } else {
        return Err(napi::Error::new(
            Status::InvalidArg,
            "paths should not be empty array",
        ));
    };
    match get(data, &pointers) {
        Ok(parent) => {
            let mut has_previous: bool = false;
            let mut has_next: bool = false;
            let mut found_position: Option<(u32, u32)> = None;
            // { "foo": "bar" }
            //  ^
            //  start
            let mut start = get_value_position(data, &parent).0 + 1;
            for (key, value) in to_object_iter(parent.as_raw_str()).flatten() {
                let (_, end) = get_value_position(data, &value);
                if key == *delete_property {
                    // found the property, set the found position
                    // { "foo": "bar", "baz": "qux", "next": "next" }
                    //               ^            ^
                    //               start        end
                    found_position = Some((start, end));
                    if has_previous {
                        break;
                    }
                } else if found_position.is_none() {
                    // not found the property, set the previous position
                    // { "foo": "bar", "baz": "qux", "next": "next" }
                    //  ^           ^
                    //  start,      end
                    has_previous = true;
                } else {
                    // found the property, set the next position
                    // { "baz": "qux", "next": "next" }
                    //  ^           ^
                    //  start,   end
                    has_next = true;
                    break;
                }
                // next start position is the end position of the current property
                // { "foo": "bar", "baz": "qux" }
                //               ^
                //               start
                start = end;
            }
            let (start, end) = if let Some(found_position) = found_position {
                found_position
            } else {
                // not found
                return Ok(DeletePropertyPositionResult {
                    kind: DeletePropertyKind::NotFound,
                    start: 0,
                    end: 0,
                });
            };
            // found
            // has previous position
            // {
            //   "prev": "foo", "found": "bar"
            //                ^              ^
            //                start          end
            // }
            if has_previous {
                return Ok(DeletePropertyPositionResult {
                    kind: DeletePropertyKind::FoundAtMiddle,
                    start,
                    end,
                });
            }
            if has_next {
                // move end to the nearest position of ',' character
                // { "baz": "qux", "next": "next" }
                //  ^           ^
                //  start,   end
                //               ^
                //               end
                let mut new_end = end as usize;
                loop {
                    if data[new_end] == b',' {
                        new_end += 1;
                        break;
                    }
                    new_end += 1;
                }
                return Ok(DeletePropertyPositionResult {
                    kind: DeletePropertyKind::FoundAtStart,
                    start,
                    end: new_end as u32,
                });
            }
            // no previous or next position, the delete start position is the found start position
            // {
            //   "found": "bar"
            //   ^            ^
            //   start        end
            // }
            Ok(DeletePropertyPositionResult {
                kind: DeletePropertyKind::FoundAndOnlyOne,
                start,
                end,
            })
        }
        Err(e) if e.is_not_found() => Ok(DeletePropertyPositionResult {
            kind: DeletePropertyKind::NotFound,
            start: 0,
            end: 0,
        }),
        Err(e) => Err(napi::Error::new(Status::InvalidArg, e.to_string())),
    }
}

fn get_value_position(data: &[u8], value: &LazyValue) -> (u32, u32) {
    let offset = value.as_raw_str().as_ptr() as usize - data.as_ptr() as usize;
    (offset as u32, (offset + value.as_raw_str().len()) as u32)
}
