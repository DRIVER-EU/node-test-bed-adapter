import { Message, ProducerRecord } from 'kafkajs';

/** Message whose key and value still need to be encoded to AVRO */
export interface AvroMessage
  extends Pick<Message, 'partition' | 'headers' | 'timestamp'> {
  key?: Buffer | Record<string, any> | string | null;
  value: Buffer | Record<string, any> | string | null;
}

export interface AdapterMessage
  extends Pick<Message, 'partition' | 'headers' | 'timestamp'> {
  key?: Record<string, any> | string | null;
  value: Record<string, any> | string;
  topic: string;
}

/** Record to be send to Kafka, whose messages still must be encoded to AVRO */
export interface AdapterProducerRecord
  extends Pick<ProducerRecord, 'topic' | 'acks' | 'timeout' | 'compression'> {
  messages: AvroMessage[];
}
