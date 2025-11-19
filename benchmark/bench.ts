import fs from 'node:fs';
import path from 'node:path';
import { Bench } from 'tinybench'

import { Package } from '../index.js'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures');
const smallData = fs.readFileSync(path.join(fixtures, 'a.json'));
const largeData = fs.readFileSync(path.join(fixtures, 'npm.json'));
const superLargeData = fs.readFileSync(path.join(fixtures, '@primer/react.json'));

function JSONParse(data: Buffer) {
  // @ts-expect-error ignore the type error
  return JSON.parse(data).name;
}

function SimdJSONParse(data: Buffer) {
  return new Package(data).name;
}

console.log('small package name: %s, %s', JSONParse(smallData), SimdJSONParse(smallData));
console.log('large package name: %s, %s', JSONParse(largeData), SimdJSONParse(largeData));
console.log('super large package name: %s, %s', JSONParse(superLargeData), SimdJSONParse(superLargeData));

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

b.add('JSONParse super large data (89M)', () => {
  JSONParse(superLargeData);
});

b.add('SimdJSONParse super large data (89M)', () => {
  SimdJSONParse(superLargeData);
});

await b.run();

console.table(b.table());
