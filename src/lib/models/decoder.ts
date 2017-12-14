export interface IDecoder {
  decode: (buf: Buffer) => Object;
  toString: (buf: Buffer | Object) => string;
}
