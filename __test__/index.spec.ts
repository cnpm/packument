import fs from 'node:fs';
import path from 'node:path';

import test from 'ava';

import { Package } from '../index';

const fixtures = path.join(import.meta.dirname, 'fixtures');

test('create package metadata instance from buffer', (t) => {
  const data = fs.readFileSync(path.join(fixtures, 'a.json'));
  const pkg = new Package(data);
  // console.log(pkg);
  t.is(pkg.name, 'a');
  t.is(pkg.description, 'Mocking framework');
  // t.is(pkg.readme, 'Mocking framework');
  // console.log(pkg.readme);
  t.truthy(pkg.readme);
  t.regex(pkg.readme!, /The mocking framework can be used in any JavaScript testing framework/);
  t.is(pkg.time.modified, '2025-07-31T11:36:55.508Z');
  t.is(pkg.isUnpublished, false);
})

test('should throw error when data is not a valid package metadata', (t) => {
  t.throws(() => {
    new Package(Buffer.from('invalid'));
  }, {
    code: 'InvalidArg',
    message: /TapeError/,
  });
});
