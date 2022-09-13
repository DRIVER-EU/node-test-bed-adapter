import { toMessageBuffer, fromMessageBuffer } from './../models/magic-byte.mjs';
import { IValidator } from '../models/validator.mjs';
import { IEncoder } from '../models/encoder.mjs';
import { IDecoder } from '../models/decoder.mjs';
import { Logger } from '../logger/index.mjs';
import { SchemaRegistry } from './schema-registry.mjs';
import { KafkaMessage, Message } from 'kafkajs';
import { AvroMessage } from '../index.mjs';

// const removeNulls = (_key: string, value: any) =>
//   value === 'null' || value === null ? undefined : value;

/**
 * Create an object that knows how to validate/encode/decode keys and values of a message.
 *
 * @param sr Schema registry
 * @param topic Topic to publish to. Is also the key to retreive schema's for key/value
 */
export const avroHelperFactory = (sr: SchemaRegistry, topic: string) => {
  const log = Logger.instance;
  const valueSchema =
    sr.valueSchemas[topic] || sr.valueSchemas[topic + '-value'];
  const keySchema = sr.keySchemas[topic] || sr.keySchemas[topic + '-key'];

  const errorHook = (path: string[], part: any) =>
    log.error(`avroHelperFactory() - Topic ${topic}, path ${path.join(', ')}
    ${JSON.stringify(part, null, 2)}`);

  return {
    /** Check whether the message is valid */
    isValid: (messages: AvroMessage[]) =>
      messages.every(
        (m) =>
          valueSchema.type.isValid(m.value, { errorHook }) &&
          (!keySchema ||
            m.key instanceof Buffer ||
            keySchema.type.isValid(m.key, { errorHook }))
      ),
    /** Check whether the message is valid */
    isValidKey: <T extends unknown>(key: T) =>
      !keySchema || keySchema.type.isValid(key, { errorHook }),
    /** Encode the message or messages */
    encode: (m: AvroMessage): Message => ({
      ...m,
      value: toMessageBuffer(m.value, valueSchema.type, valueSchema.srId),
      key: m.key
        ? m.key instanceof Buffer
          ? m.key
          : toMessageBuffer(m.key, keySchema.type, keySchema.srId)
        : undefined,
    }),
    encodeKey: <T extends unknown>(key: T) =>
      keySchema
        ? toMessageBuffer(key, keySchema.type, keySchema.srId)
        : undefined,
    /** Decode the buffer */
    decode: (m: KafkaMessage) => ({
      value: fromMessageBuffer(valueSchema.type, m.value as Buffer, sr).value,
      key:
        m.key && keySchema
          ? fromMessageBuffer(keySchema.type, m.key as Buffer, sr).value
          : undefined,
    }),
  } as IValidator & IEncoder & IDecoder;
};
