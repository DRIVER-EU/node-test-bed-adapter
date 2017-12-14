export interface IDecoder {
  decode: (buf: Buffer) => Object;
}
