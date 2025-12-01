import { detectSetPropertyPosition, SetPropertyKind } from '../index.js'

export type SetValue = string | number | boolean | Date | object

export class JSONBuilder {
  #data: Buffer

  constructor(data: Buffer) {
    this.#data = data
  }

  setIn(path: string[], value: SetValue) {
    const result = detectSetPropertyPosition(this.#data, path)
    console.log(result)
    if (result.kind === SetPropertyKind.ParentNotObject) {
      throw new Error(
        `Parent property is not an object, can't add new property to it, need to remove it first: ${path.join('.')}`,
      )
    }
    const valueBuffer = Buffer.from(JSON.stringify(value))
    if (result.kind === SetPropertyKind.Update) {
      this.#data = Buffer.concat([this.#data.subarray(0, result.start), valueBuffer, this.#data.subarray(result.end)])
    }
    return this
  }

  build() {
    return this.#data
  }
}
