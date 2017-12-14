/// <reference types="node" />
export interface IDecoder {
    decode: (buf: Buffer) => Object;
}
