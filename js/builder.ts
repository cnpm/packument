import {
  DeletePropertyKind,
  detectDeletePropertyPosition,
  detectSetPropertyPosition,
  getIn,
  hasIn,
  SetPropertyKind,
} from '../index.js'

export type SetValue = string | number | boolean | Date | object | Buffer

export interface DeleteOptions {
  /**
   * If the parent property is empty after deleting the property, delete the parent property too
   * @default false
   */
  autoDeleteParentIfEmpty?: boolean
}

export class JSONBuilder {
  #data: Buffer

  constructor(data: Buffer) {
    this.#data = data
  }

  setIn(paths: string[], value: SetValue): this {
    if (paths.length === 0) {
      throw new TypeError('paths should not be empty array')
    }
    const result = detectSetPropertyPosition(this.#data, paths)
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

    const valueBuffer = Buffer.isBuffer(value) ? value : Buffer.from(JSON.stringify(value))
    if (result.kind === SetPropertyKind.Update) {
      this.#data = this.#concatBuffers([
        this.#data.subarray(0, result.start),
        valueBuffer,
        this.#data.subarray(result.end),
      ])
      return this
    }

    if (result.kind !== SetPropertyKind.Add) {
      throw new Error(`Unexpected set property kind: ${String(result.kind)}`)
    }

    // add new property
    const property = paths[paths.length - 1]
    const addBuffer = Buffer.concat([Buffer.from(`${JSON.stringify(property)}:`), valueBuffer])
    if (result.previous) {
      // has previous property, add the new property after the previous property
      // add "," after the previous property
      this.#data = this.#concatBuffers([
        this.#data.subarray(0, result.start),
        Buffer.from(','),
        addBuffer,
        this.#data.subarray(result.start),
      ])
    } else {
      // no previous property, add the new property to the end of the object
      this.#data = this.#concatBuffers([
        this.#data.subarray(0, result.start),
        addBuffer,
        this.#data.subarray(result.start),
      ])
    }
    return this
  }

  deleteIn(paths: string[], options?: DeleteOptions): this {
    if (paths.length === 0) {
      throw new TypeError('paths should not be empty array')
    }
    const result = detectDeletePropertyPosition(this.#data, paths)
    if (result.kind === DeletePropertyKind.NotFound) {
      // do nothing
      return this
    }
    if (result.kind === DeletePropertyKind.FoundAndOnlyOne && paths.length > 1 && options?.autoDeleteParentIfEmpty) {
      // delete the parent property if it is empty
      return this.deleteIn(paths.slice(0, -1), options)
    }
    // found, delete the property
    this.#data = this.#concatBuffers([this.#data.subarray(0, result.start), this.#data.subarray(result.end)])
    return this
  }

  hasIn(paths: string[]): boolean {
    if (paths.length === 0) {
      throw new TypeError('paths should not be empty array')
    }
    return hasIn(this.#data, paths)
  }

  getIn<T = unknown>(paths: string[]): T | undefined {
    const buffer = this.getBufferIn(paths)
    if (!buffer) {
      return undefined
    }
    // @ts-expect-error - JSON.parse can work with Uint8Array
    return JSON.parse(buffer) as T
  }

  getBufferIn(paths: string[]): Buffer | undefined {
    if (paths.length === 0) {
      throw new TypeError('paths should not be empty array')
    }
    const result = getIn(this.#data, paths)
    if (!result) {
      return undefined
    }
    return this.#data.subarray(result.start, result.end)
  }

  build(): Buffer {
    return this.#data
  }

  #concatBuffers(buffers: Buffer[]): Buffer {
    return Buffer.concat(buffers)
  }
}
