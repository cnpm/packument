import fs from 'node:fs';
import path from 'node:path';
import { Bench } from 'tinybench'

import { Package, PackageSonic } from '../index.js'

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

function SonicJSONParse(data: Buffer) {
  return new PackageSonic(data).name;
}

console.log('small package name: %s, %s, %s', JSONParse(smallData), SimdJSONParse(smallData), SonicJSONParse(smallData));
console.log('large package name: %s, %s, %s', JSONParse(largeData), SimdJSONParse(largeData), SonicJSONParse(largeData));
console.log('super large package name: %s, %s, %s', JSONParse(superLargeData), SimdJSONParse(superLargeData), SonicJSONParse(superLargeData));

const b = new Bench();

b.add('JSONParse small data (117KB)', () => {
  JSONParse(smallData);
});

b.add('SimdJSONParse small data (117KB)', () => {
  SimdJSONParse(smallData);
});

b.add('SonicJSONParse small data (117KB)', () => {
  SonicJSONParse(smallData);
});

b.add('JSONParse large data (22MB)', () => {
  JSONParse(largeData);
});

b.add('SimdJSONParse large data (22MB)', () => {
  SimdJSONParse(largeData);
});

b.add('SonicJSONParse large data (22MB)', () => {
  SonicJSONParse(largeData);
});

b.add('JSONParse super large data (89M)', () => {
  // console.log('JSONParse before', process.memoryUsage());
  JSONParse(superLargeData);
  // console.log('JSONParse after', process.memoryUsage());
});

b.add('SimdJSONParse super large data (89M)', () => {
  // console.log('SimdJSONParse before', process.memoryUsage());
  SimdJSONParse(superLargeData);
  // console.log('SimdJSONParse after', process.memoryUsage());
});

b.add('SonicJSONParse super large data (89M)', () => {
  // console.log('SonicJSONParse before', process.memoryUsage());
  SonicJSONParse(superLargeData);
  // console.log('SonicJSONParse after', process.memoryUsage());
});

await b.run();

console.table(b.table());
