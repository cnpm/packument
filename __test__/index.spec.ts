import { test, expect } from 'vitest'

import * as exports from '../js/index.js'

test('should keep exports stable', () => {
  expect(exports).toMatchSnapshot()
})
