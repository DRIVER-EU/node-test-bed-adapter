/// <reference types="node" />
export interface IDecoder {
    decode: (buf: Buffer | Buffer[]) => Object | Object[];
    decodeKey: (buf: Buffer) => Object | string | number;
    toString: (buf: Buffer | Object) => string;
}
