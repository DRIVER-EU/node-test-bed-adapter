export interface IEncoder {
  /**
   * Encode each message separately?
   */
  encode: (obj: Object | Object[]) => Buffer | Buffer[];
  encodeKey?: (obj: Object) => Buffer;
}
