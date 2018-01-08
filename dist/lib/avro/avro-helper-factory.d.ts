import { IValidator } from '../models/validator';
import { IEncoder } from '../models/encoder';
import { IDecoder } from '../models/decoder';
import { SchemaRegistry } from './schema-registry';
/**
 * Create an object that knows how to validate/encode/decode keys and values of a message.
 *
 * @param sr Schema registry
 * @param topic Topic to publish to. Is also the key to retreive schema's for key/value
 */
export declare const avroHelperFactory: (sr: SchemaRegistry, topic: string) => IValidator & IEncoder & IDecoder;
