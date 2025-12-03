import { test, expect } from 'vitest'

import { JSONBuilder } from '../js/index.js'

test('should return true if property exists', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(builder.hasIn(['name'])).toBe(true)
  expect(builder.hasIn(['age'])).toBe(true)
  expect(builder.hasIn(['address', 'city'])).toBe(true)
})

test('should return false if property does not exist', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(builder.hasIn(['email'])).toBe(false)
})

test('should throw error if paths is empty array', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(() => builder.hasIn([])).toThrow('paths should not be empty array')
})

test('should return true if property exists in nested object', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(builder.hasIn(['address', 'city'])).toBe(true)
})

test('should return false if property does not exist in nested object', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(builder.hasIn(['address', 'country'])).toBe(false)
})

test('should error when json is invalid', () => {
  const data = Buffer.from('{"name": "John",')
  const builder = new JSONBuilder(data)
  expect(() => builder.hasIn(['address', 'city'])).toThrow('Expected this character to be')
})

test('should error when paths invalid', () => {
  const data = Buffer.from('{"name": "John", "age": 30, "address": { "city": "New York" }}')
  const builder = new JSONBuilder(data)
  expect(() => builder.hasIn(['address', 'city', 'country'])).toThrow(
    'invalid type: string "New York", expected a JSON object at line 1 column 59',
  )
  expect(() => builder.hasIn(['age', 'country'])).toThrow(
    'invalid type: integer `30`, expected a JSON object at line 1 column 26',
  )
})
