export interface IDecoder {
  decode: (buf: Buffer | Buffer[]) => Object | Object[];
  toString: (buf: Buffer | Object) => string;
}
