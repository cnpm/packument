import { test, expect } from 'vitest'

import { JSONBuilder } from '../js/index.js'

test('should get value by paths', () => {
  const data = Buffer.from(
    '{"name": "John 😄", "age": 30, "address": { "city": "New York" }, "foo": null, "bar": true, "array": [1, 2, 3]}',
  )
  const builder = new JSONBuilder(data)
  expect(builder.getIn<string>(['name'])).toBe('John 😄')
  expect(builder.getIn<number>(['age'])).toBe(30)
  expect(builder.getIn<string>(['address', 'city'])).toBe('New York')
  expect(builder.getIn<object>(['address'])).toEqual({ city: 'New York' })
  expect(builder.getIn<null>(['foo'])).toBeNull()
  expect(builder.getIn<boolean>(['bar'])).toBe(true)
  expect(builder.getIn<number[]>(['array'])).toEqual([1, 2, 3])
})

test('should return undefined if property does not exist', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(builder.getIn<string>(['email'])).toBeUndefined()
  expect(builder.getIn<number>(['address', 'country'])).toBeUndefined()
  expect(builder.getIn<object>(['address', 'country'])).toBeUndefined()
})

test('should throw error if paths is empty array', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(() => builder.getIn<string>([])).toThrow('paths should not be empty array')
})

test('should return buffer if property exists', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(builder.getBufferIn(['name'])).toEqual(Buffer.from('"John"'))
  expect(builder.getBufferIn(['age'])).toEqual(Buffer.from('30'))
  expect(builder.getBufferIn(['address', 'city'])).toEqual(Buffer.from('"New York"'))
  expect(builder.getBufferIn(['address'])).toEqual(Buffer.from('{ "city": "New York" }'))
})

test('should get buffer return undefined if property does not exist', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(builder.getBufferIn(['email'])).toBeUndefined()
  expect(builder.getBufferIn(['address', 'country'])).toBeUndefined()
})
