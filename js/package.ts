import { Package as NativePackage } from '../index.js'

export type * from '../index.js'

export class Package extends NativePackage {
  #data: Buffer

  constructor(data: Buffer) {
    super(data)
    this.#data = data
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
    const position = this.getInPosition(paths)
    if (!position) {
      return undefined
    }
    return this.#data.subarray(position[0], position[1])
  }
}
