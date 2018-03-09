import { IDefaultKey } from './../avro/default-key-schema';

export interface IDecoder {
  decode: (buf: Buffer | Buffer[]) => Object | Object[];
  decodeKey: (buf: Buffer) => IDefaultKey;
  toString: (buf: Buffer | Object) => string;
}
