# Set Property without parsing

## Motivation

When we set a property on a JSON string Buffer, we need to parse the object first.
If the JSON string is large, it will create many JavaScript objects which are never used and raise the memory usage and GC pressure.

## Proposal

We can set a property on a JSON string Buffer without parsing the object first.

## Example

```ts
const rawBuffer = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')

const builder = new JSONBuilder(rawBuffer)
// update existing property
builder.setIn(['name'], 'Jane')
// add new property
builder.setIn(['email'], 'john@example.com')
// update nested property
builder.setIn(['address', 'city'], 'Los Angeles')
// add nested property
builder.setIn(['address', 'country'], 'United States')

// build the buffer
const buffer = builder.build()

console.log(buffer.toString())
// {"name": "Jane", "age": 30, "email": "john@example.com", "address": { "city": "Los Angeles", "country": "United States" }}
```

## Implementation

Detect the position of the property in the buffer and update the value.

### update existing property

```bash
# set "name" to "Jane"

{"name": "John", "age": 30, "address": { "city": "New York" }}
         ^    ^
         |____|
         9    13

get the value position of "name" => [9, 13], then replace the value to "Jane" according to the position.
```

### add new property

```bash
# add "email" to "john@example.com"

{"name": "John", "age": 30, "address": { "city": "New York" }}
                                                             ^
                                                             |
                                                             62
don't have the position of "email", so we need to add the property to the end of the buffer.
```
