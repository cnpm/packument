import { test, expect } from 'vite-plus/test'

import * as exports from '../js/index.js'

test('should keep exports stable', () => {
  expect(exports).toMatchSnapshot()
})
