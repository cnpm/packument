import fs from 'node:fs'
import path from 'node:path'

import { Bench } from 'tinybench'

import { Package } from '../index.js'

const fixtures = path.join(import.meta.dirname, '../__test__/fixtures')
const smallData = fs.readFileSync(path.join(fixtures, 'a.json'))
const largeData = fs.readFileSync(path.join(fixtures, 'npm.json'))
const superLargeData = fs.readFileSync(path.join(fixtures, '@primer/react.json'))
// 229KB, readme length is 64KB
const bigReadmeData = fs.readFileSync(path.join(fixtures, 'swagger-spec-express.json'))

let b: Bench

function JSONParseName(data: Buffer) {
  // @ts-expect-error ignore the type error
  return JSON.parse(data).name
}

function JSONParseVersions(data: Buffer) {
  // @ts-expect-error ignore the type error
  return Object.keys(JSON.parse(data).versions).length
}

function JSONParseLatestVersion(data: Buffer) {
  // @ts-expect-error ignore the type error
  const pkg = JSON.parse(data)
  return pkg.versions[pkg['dist-tags'].latest]
}

function SonicJSONParseVersions(data: Buffer) {
  return Object.keys(new Package(data).versions).length
}

function SonicJSONParseLatestVersion(data: Buffer) {
  return new Package(data).getLatestVersion()
}

// console.log('small package name: %s, %s', JSONParse(smallData), SonicJSONParse(smallData));
// console.log('large package name: %s, %s', JSONParse(largeData), SonicJSONParse(largeData));
// console.log('super large package name: %s, %s', JSONParse(superLargeData), SonicJSONParse(superLargeData));

// console.log('small package versions: %s, %s', JSONParseVersions(smallData), SonicJSONParseVersions(smallData));
// console.log('large package versions: %s, %s', JSONParseVersions(largeData), SonicJSONParseVersions(largeData));
// console.log('super large package versions: %s, %s', JSONParseVersions(superLargeData), SonicJSONParseVersions(superLargeData));
// console.log('super large package latest version: %o, %o', JSONParseLatestVersion(superLargeData), SonicJSONParseLatestVersion(superLargeData));

// b.add('JSONParse small data (117KB)', () => {
//   JSONParseName(smallData);
// });
// b.add('SonicJSONParse small data (117KB)', () => {
//   SonicJSONParseName(smallData);
// });

// b.add('JSONParse small data versions (117KB)', () => {
//   JSONParseVersions(smallData);
// });
// b.add('SonicJSONParse small data versions (117KB)', () => {
//   SonicJSONParseVersions(smallData);
// });

// b.add('JSONParse small data latest version (117KB)', () => {
//   JSONParseLatestVersion(smallData);
// });
// b.add('SonicJSONParse small data latest version (117KB)', () => {
//   SonicJSONParseLatestVersion(smallData);
// });

// b.add('JSONParse large data (22MB)', () => {
//   JSONParseName(largeData);
// });
// b.add('SonicJSONParse large data (22MB)', () => {
//   SonicJSONParseName(largeData);
// });

// b.add('JSONParse large data versions (22MB)', () => {
//   JSONParseVersions(largeData);
// });
// b.add('SonicJSONParse large data versions (22MB)', () => {
//   SonicJSONParseVersions(largeData);
// });

// b.add('JSONParse large data latest version (22MB)', () => {
//   JSONParseLatestVersion(largeData);
// });
// b.add('SonicJSONParse large data latest version (22MB)', () => {
//   SonicJSONParseLatestVersion(largeData);
// });

// b.add('JSONParse super large data (89M)', () => {
//   // console.log('JSONParse before', process.memoryUsage());
//   JSONParseName(superLargeData);
//   // console.log('JSONParse after', process.memoryUsage());
// });
// b.add('SonicJSONParse super large data (89M)', () => {
//   // console.log('SonicJSONParse before', process.memoryUsage());
//   SonicJSONParseName(superLargeData);
//   // console.log('SonicJSONParse after', process.memoryUsage());
// });

// b.add('JSONParse super large data versions (89M)', () => {
//   JSONParseVersions(superLargeData);
// });
// b.add('SonicJSONParse super large data versions (89M)', () => {
//   SonicJSONParseVersions(superLargeData);
// });

// b.add('JSONParse super large data latest version (89M)', () => {
//   JSONParseLatestVersion(superLargeData);
// });
// b.add('SonicJSONParse super large data latest version (89M)', () => {
//   SonicJSONParseLatestVersion(superLargeData);
// });

// #region readme

/**

big readme package: 65536, 65536, 65536, 66631

┌─────────┬──────────────────────────────────────────────────────────────────────┬─────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┬─────────┐
│ (index) │ Task name                                                            │ Latency avg (ns)    │ Latency med (ns)       │ Throughput avg (ops/s) │ Throughput med (ops/s) │ Samples │
├─────────┼──────────────────────────────────────────────────────────────────────┼─────────────────────┼────────────────────────┼────────────────────────┼────────────────────────┼─────────┤
│ 0       │ 'JSONParse small data readme string (117KB)'                         │ '246832 ± 1.19%'    │ '231417 ± 9542.0'      │ '4214 ± 0.36%'         │ '4321 ± 181'           │ 4052    │
│ 1       │ 'sonic-rs small data readme string (117KB)'                          │ '92993 ± 0.23%'     │ '90750 ± 375.00'       │ '10815 ± 0.10%'        │ '11019 ± 46'           │ 10754   │
│ 2       │ 'sonic-rs small data readme string with position (117KB)'            │ '101453 ± 0.39%'    │ '98541 ± 458.00'       │ '9944 ± 0.13%'         │ '10148 ± 47'           │ 9857    │
│ 3       │ 'sonic-rs small data readme JSON buffer with position (117KB)'       │ '78501 ± 0.10%'     │ '77208 ± 333.00'       │ '12768 ± 0.07%'        │ '12952 ± 56'           │ 12739   │
│ 4       │ 'JSONParse large data readme string (22MB)'                          │ '72323254 ± 5.23%'  │ '62950104 ± 2405354'   │ '14 ± 4.53%'           │ '16 ± 1'               │ 64      │
│ 5       │ 'sonic-rs large data readme string (22MB)'                           │ '13908466 ± 0.88%'  │ '13836166 ± 174312'    │ '72 ± 0.79%'           │ '72 ± 1'               │ 72      │
│ 6       │ 'sonic-rs large data readme string with position (22MB)'             │ '13675352 ± 0.47%'  │ '13651854 ± 182416'    │ '73 ± 0.46%'           │ '73 ± 1'               │ 74      │
│ 7       │ 'sonic-rs large data readme JSON buffer with position (22MB)'        │ '13782662 ± 0.78%'  │ '13667541 ± 257667'    │ '73 ± 0.75%'           │ '73 ± 1'               │ 73      │
│ 8       │ 'JSONParse super large data readme string (89M)'                     │ '157195834 ± 2.52%' │ '158695395 ± 15166084' │ '6 ± 2.48%'            │ '6 ± 1'                │ 64      │
│ 9       │ 'sonic-rs super large data readme string (89M)'                      │ '49252030 ± 0.37%'  │ '49126749 ± 466604'    │ '20 ± 0.37%'           │ '20 ± 0'               │ 64      │
│ 10      │ 'sonic-rs super large data readme string with position (89M)'        │ '49634333 ± 0.32%'  │ '49582709 ± 243334'    │ '20 ± 0.32%'           │ '20 ± 0'               │ 64      │
│ 11      │ 'sonic-rs super large data readme JSON buffer with position (89M)'   │ '49656014 ± 0.51%'  │ '49369396 ± 399125'    │ '20 ± 0.49%'           │ '20 ± 0'               │ 64      │
│ 12      │ 'JSONParse big readme string (229KB, 64KB readme)'                   │ '284045 ± 0.74%'    │ '275584 ± 8832.0'      │ '3594 ± 0.31%'         │ '3629 ± 116'           │ 3521    │
│ 13      │ 'sonic-rs big readme string (229KB, 64KB readme)'                    │ '120113 ± 0.23%'    │ '115708 ± 999.00'      │ '8376 ± 0.14%'         │ '8642 ± 75'            │ 8326    │
│ 14      │ 'sonic-rs big readme string with position (229KB, 64KB readme)'      │ '145245 ± 0.22%'    │ '141208 ± 625.00'      │ '6920 ± 0.14%'         │ '7082 ± 31'            │ 6885    │
│ 15      │ 'sonic-rs big readme JSON buffer with position (229KB, 64KB readme)' │ '100740 ± 0.14%'    │ '98209 ± 583.00'       │ '9949 ± 0.08%'         │ '10182 ± 60'           │ 9927    │
└─────────┴──────────────────────────────────────────────────────────────────────┴─────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┴─────────┘

*
*/

function JSONParseReadme(data: Buffer): string {
  // @ts-expect-error ignore the type error
  return JSON.parse(data).readme
}

function SonicJSONParseReadme(data: Buffer): string {
  return new Package(data).readme!
}

function SonicJSONParseReadmeWithPosition(data: Buffer): string {
  const readmePosition = new Package(data).readmePosition
  // @ts-expect-error ignore the type error
  return JSON.parse(data.subarray(readmePosition![0], readmePosition![1]))
}

function SonicJSONParseReadmeJSONBufferWithPosition(data: Buffer): Buffer {
  const readmePosition = new Package(data).readmePosition
  return data.subarray(readmePosition![0], readmePosition![1])
}

console.log(
  'big readme package: %o, %o, %o, %o',
  JSONParseReadme(bigReadmeData).length,
  SonicJSONParseReadme(bigReadmeData).length,
  SonicJSONParseReadmeWithPosition(bigReadmeData).length,
  SonicJSONParseReadmeJSONBufferWithPosition(bigReadmeData).length,
)

b = new Bench()
b.add('JSONParse small data readme string (117KB)', () => {
  JSONParseReadme(smallData)
})
b.add('sonic-rs small data readme string (117KB)', () => {
  SonicJSONParseReadme(smallData)
})
b.add('sonic-rs small data readme string with position (117KB)', () => {
  SonicJSONParseReadmeWithPosition(smallData)
})
b.add('sonic-rs small data readme JSON buffer with position (117KB)', () => {
  SonicJSONParseReadmeJSONBufferWithPosition(smallData)
})

b.add('JSONParse large data readme string (22MB)', () => {
  JSONParseReadme(largeData)
})
b.add('sonic-rs large data readme string (22MB)', () => {
  SonicJSONParseReadme(largeData)
})
b.add('sonic-rs large data readme string with position (22MB)', () => {
  SonicJSONParseReadmeWithPosition(largeData)
})
b.add('sonic-rs large data readme JSON buffer with position (22MB)', () => {
  SonicJSONParseReadmeJSONBufferWithPosition(largeData)
})

b.add('JSONParse super large data readme string (89M)', () => {
  JSONParseReadme(superLargeData)
})
b.add('sonic-rs super large data readme string (89M)', () => {
  SonicJSONParseReadme(superLargeData)
})
b.add('sonic-rs super large data readme string with position (89M)', () => {
  SonicJSONParseReadmeWithPosition(superLargeData)
})
b.add('sonic-rs super large data readme JSON buffer with position (89M)', () => {
  SonicJSONParseReadmeJSONBufferWithPosition(superLargeData)
})

b.add('JSONParse big readme string (229KB, 64KB readme)', () => {
  JSONParseReadme(bigReadmeData)
})
b.add('sonic-rs big readme string (229KB, 64KB readme)', () => {
  SonicJSONParseReadme(bigReadmeData)
})
b.add('sonic-rs big readme string with position (229KB, 64KB readme)', () => {
  SonicJSONParseReadmeWithPosition(bigReadmeData)
})
b.add('sonic-rs big readme JSON buffer with position (229KB, 64KB readme)', () => {
  SonicJSONParseReadmeJSONBufferWithPosition(bigReadmeData)
})

await b.run()

console.table(b.table())
// #endregion
