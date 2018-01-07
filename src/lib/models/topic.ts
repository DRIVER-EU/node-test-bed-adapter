import { IDecoder } from './decoder';
import { IEncoder } from './encoder';
import { OffsetFetchRequest } from 'kafka-node';
import { IValidator } from './validator';
/**
 * Topic configuration for consumers or producers.
 */
export interface ITopic extends OffsetFetchRequest {
  /** Reference to an XSD or AVSC schema (based on the extension, .xsd or .avsc respectively) */
  schemaURI?: string;
  /** A schema may contain many types - indicate which you want to use (usage: namespace.name). */
  type?: string;
}

export interface IInitializedTopic extends ITopic, IValidator, IEncoder, IDecoder {
  // isValid: (msg: Object) => boolean;
  // isKeyValid: (msg: Object) => boolean;
  // encode: (msg: Object) => any;
  // decode: (buf: Buffer) => Object;
  // encodeKey: (msg: Object) => any;
  // decodeKey: (buf: Object) => any;
}