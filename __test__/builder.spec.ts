import { test, expect } from 'vitest'

import { JSONBuilder } from '../js/index.js'

test('should update existing property', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  builder.setIn(['name'], 'Jane')
  expect(builder.build().toString()).toBe('{"name": "Jane", "age": 30, "address": { "city": "New York" }}')
})

// test('should add new property', () => {
//   const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
//   const builder = new JSONBuilder(data)
//   builder.setIn(['email'], 'john@example.com')
//   expect(builder.build().toString()).toBe('{"name": "John", "age": 30, "address": { "city": "New York" }, "email": "john@example.com"}')
// })
