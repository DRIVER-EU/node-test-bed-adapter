import { toMessageBuffer, fromMessageBuffer } from './../models/magic-byte';
import { IValidator } from '../models/validator';
import { IEncoder } from '../models/encoder';
import { IDecoder } from '../models/decoder';
import { Logger } from '..';
import { SchemaRegistry } from './schema-registry';

const removeNulls = (_key: string, value: any) => (value === 'null' || value === null) ? undefined : value;

/**
 * Create an object that knows how to validate/encode/decode keys and values of a message.
 *
 * @param sr Schema registry
 * @param topic Topic to publish to. Is also the key to retreive schema's for key/value
 */
export const avroHelperFactory = (sr: SchemaRegistry, topic: string) => {
  const log = Logger.instance;
  const valueSchema = sr.valueSchemas[topic];
  const keySchema = sr.keySchemas.hasOwnProperty(topic) ? sr.keySchemas[topic] : undefined;

  const errorHook = (path: string[], part: any) =>
    log.error(`avroHelperFactory() - Topic ${topic}, path ${path.join(', ')}
    ${JSON.stringify(part, null, 2)}`);

  return {
    /** Check whether the message is valid */
    isValid: (obj: Object | Object[]) => {
      const msg: Object[] = obj instanceof Array ? obj : [obj];
      return msg.reduce((p, c) => p && valueSchema.type.isValid(c, { errorHook }), true);
    },
    /** Encode the message or messages */
    encode: (obj: Object | Object[]) => {
      return obj instanceof Array
        ? obj.map(o => toMessageBuffer(o, valueSchema.type, valueSchema.srId))
        : toMessageBuffer(obj, valueSchema.type, valueSchema.srId);
    },
    /** Decode the message or messages */
    decode: (buf: Buffer | Buffer[]) => {
      return buf instanceof Array
        ? buf.map(m => fromMessageBuffer(valueSchema.type, m, sr).value)
        : fromMessageBuffer(valueSchema.type, buf, sr).value;
    },
    /** Check whether the key is valid */
    isKeyValid: (key: Object | string | number) => {
      return keySchema ? keySchema.type.isValid(key, { errorHook }) : true;
    },
    /** Encode the key */
    encodeKey: (key: Object) => {
      return keySchema ? toMessageBuffer(key, keySchema.type, keySchema.srId) : key;
    },
    /** Decode the key */
    decodeKey: (buf: Buffer | string | number) => {
      return keySchema && buf instanceof Buffer ? fromMessageBuffer(keySchema.type, buf, sr).value : buf;
    },
    /** Convert the object to a string */
    toString: (buf: Buffer | Object) => typeof buf === 'object'
      ? JSON.stringify(buf, removeNulls)
      : JSON.stringify(fromMessageBuffer(valueSchema.type, buf, sr).value, removeNulls)
  } as IValidator & IEncoder & IDecoder;
};
