import { Message } from 'kafkajs';
import { AvroMessage } from './avro-message.mjs';

export interface IEncoder {
  /** Encode each message separately? */
  encode: (obj: AvroMessage) => Message;
  encodeKey: <T>(key: T) => Buffer;
}
