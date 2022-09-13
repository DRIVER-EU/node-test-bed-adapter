import { KafkaMessage } from 'kafkajs';
import { AvroMessage } from './avro-message.mjs';

export interface IDecoder {
  decode: (message: KafkaMessage) => AvroMessage;
}
