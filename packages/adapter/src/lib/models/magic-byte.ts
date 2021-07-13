import { SchemaRegistry } from '../avro/schema-registry';
import { IAvroDecoded } from '../declarations/avro';
import { Logger } from '..';
import { Type } from 'avsc';
/**
 * Encode and decode an Avro message for Confluent schema registry (SR) with magic byte.
 */

/** The magic byte value */
const MAGIC_BYTE = 0;

/**
 * Encode an AVRO value into a message, as expected by Confluent's Kafka Avro deserializer.
 *
 * @param val The Avro value to encode.
 * @param type Your value's Avro type.
 * @param schemaId Your schema's ID (inside the registry).
 * @param optLength Optional initial buffer length. Set it high enough to avoid having to resize. Defaults to 1024.
 * @return {Buffer} Serialized value.
 */
export const toMessageBuffer = (
  val: any,
  type: Type,
  schemaId: number,
  optLength?: number
): Buffer => {
  const length = optLength || 1024;
  const buf = Buffer.alloc(length);

  buf[0] = MAGIC_BYTE; // Magic byte.
  buf.writeInt32BE(schemaId, 1);

  const pos = type.encode(val, buf, 5);

  if (pos < 0) {
    // The buffer was too short, we need to resize.
    return toMessageBuffer(val, type, schemaId, length - pos);
  }
  return buf.slice(0, pos);
};

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
export const fromMessageBuffer = (
  type: Type,
  encodedMessage: Buffer,
  sr: SchemaRegistry
) => {
  if (encodedMessage[0] !== MAGIC_BYTE) {
    Logger.instance.error('Message not serialized with magic byte!');
    Logger.instance.debug(`type: ${JSON.stringify(type)}`);
    Logger.instance.debug(`encodedMessage: ${encodedMessage.toString()}`);
    return { value: undefined, schemaId: undefined };
  }

  const schemaId = encodedMessage.readInt32BE(1);

  const schemaKey = 'schema-' + schemaId;
  let decoded: IAvroDecoded;
  if (!sr.schemaTypeById[schemaKey]) {
    // use default type
    Logger.instance.warn(
      `Could not find schema ${schemaId}. Is this an old schema version?`
    );
    decoded = type.decode(encodedMessage, 5);
  } else {
    decoded = sr.schemaTypeById[schemaKey].decode(encodedMessage, 5);
  }

  return {
    value: decoded.value,
    schemaId: schemaId,
  };
};
