/// <reference types="node" />
export interface IEncoder {
    encode: (obj: Object) => Buffer;
}
