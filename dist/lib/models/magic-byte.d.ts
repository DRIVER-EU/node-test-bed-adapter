/// <reference types="node" />
import { SchemaRegistry } from './../schema-registry';
import { IAvroType } from '../declarations/avro';
/**
 * Encode an AVRO value into a message, as expected by Confluent's Kafka Avro deserializer.
 *
 * @param val The Avro value to encode.
 * @param type Your value's Avro type.
 * @param schemaId Your schema's ID (inside the registry).
 * @param optLength Optional initial buffer length. Set it high enough to avoid having to resize. Defaults to 1024.
 * @return {Buffer} Serialized value.
 */
export declare const toMessageBuffer: (val: any, type: IAvroType, schemaId: number, optLength?: number | undefined) => Buffer;
/**
 * Decode a confluent SR message with magic byte.
 *
 * @param {avsc.Type} type The topic's Avro decoder.
 * @param {Buffer} encodedMessage The incoming message.
 * @param {kafka-avro.SchemaRegistry} sr The local SR instance.
 * @return {Object} Object with:
 *   @param {number} schemaId The schema id.
 *   @param {Object} value The decoded avro value.
 */
export declare const fromMessageBuffer: (type: IAvroType, encodedMessage: Buffer, sr: SchemaRegistry) => {
    value: undefined;
    schemaId: undefined;
} | {
    value: any;
    schemaId: number;
};
