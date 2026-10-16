import { JSONBuilder, Package, type DeleteOptions, type MetaInfo, type SetValue } from '@cnpmjs/packument'

const pkg = new Package(Buffer.from('{}'))
const meta: MetaInfo = pkg.getMetaInfo()
const name: string | undefined = pkg.getIn<string>(['name'])
const value: SetValue = { name, versions: meta.versionKeys }
const options: DeleteOptions = { autoDeleteParentIfEmpty: true }
const result: Buffer = new JSONBuilder(Buffer.from('{}')).setIn(['value'], value).deleteIn(['value'], options).build()

void result
