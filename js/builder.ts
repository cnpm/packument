import { detectSetPropertyPosition, SetPropertyKind } from '../index.js'

export type SetValue = string | number | boolean | Date | object

export class JSONBuilder {
  #data: Buffer

  constructor(data: Buffer) {
    this.#data = data
  }

  setIn(paths: string[], value: SetValue) {
    if (paths.length === 0) {
      throw new TypeError('Paths should not be empty')
    }
    const result = detectSetPropertyPosition(this.#data, paths)
    console.log(paths, result)
    if (result.kind === SetPropertyKind.ParentNotObject) {
      throw new Error(
        `Parent property is not an object, can't add new property to it, need to remove it first: ${paths.slice(0, -1).join('.')}`,
      )
    }
    if (result.kind === SetPropertyKind.ParentNotFound) {
      // set parent property as an object
      this.setIn(paths.slice(0, -1), {})
      // then set the new property
      this.setIn(paths, value)
      return this
    }

    if (result.kind === SetPropertyKind.Update) {
      const updateBuffer = Buffer.from(JSON.stringify(value))
      this.#data = Buffer.concat([this.#data.subarray(0, result.start), updateBuffer, this.#data.subarray(result.end)])
      return this
    }

    if (result.kind !== SetPropertyKind.Add) {
      throw new Error(`Unexpected set property kind: ${result.kind}`)
    }

    // add new property
    const property = paths[paths.length - 1]
    const addBuffer = Buffer.from(`"${property}":${JSON.stringify(value)}`)
    if (result.previous) {
      // has previous property, add the new property after the previous property
      // add "," after the previous property
      this.#data = Buffer.concat([
        this.#data.subarray(0, result.start),
        Buffer.from(','),
        addBuffer,
        this.#data.subarray(result.start),
      ])
    } else {
      // no previous property, add the new property to the end of the object
      this.#data = Buffer.concat([this.#data.subarray(0, result.start), addBuffer, this.#data.subarray(result.start)])
    }
    return this
  }

  build() {
    return this.#data
  }
}
