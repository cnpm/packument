import fs from 'node:fs';
import path from 'node:path';
import { Bench } from 'tinybench'

import { Package } from '../index.js'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures');
const smallData = fs.readFileSync(path.join(fixtures, 'a.json'));
const largeData = fs.readFileSync(path.join(fixtures, 'npm.json'));

function JSONParse(data: Buffer) {
  // @ts-expect-error ignore the type error
  return JSON.parse(data).name;
}

function SimdJSONParse(data: Buffer) {
  return new Package(data).name;
}

const b = new Bench();

b.add('JSONParse small data (117KB)', () => {
  JSONParse(smallData);
});

b.add('SimdJSONParse small data (117KB)', () => {
  SimdJSONParse(smallData);
});

b.add('JSONParse large data (22MB)', () => {
  JSONParse(largeData);
});

b.add('SimdJSONParse large data (22MB)', () => {
  SimdJSONParse(largeData);
});

await b.run();

console.table(b.table());
