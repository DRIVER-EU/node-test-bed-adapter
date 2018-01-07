"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("..");
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
exports.toMessageBuffer = (val, type, schemaId, optLength) => {
    const length = optLength || 1024;
    const buf = new Buffer(length);
    buf[0] = MAGIC_BYTE; // Magic byte.
    buf.writeInt32BE(schemaId, 1);
    const pos = type.encode(val, buf, 5);
    if (pos < 0) {
        // The buffer was too short, we need to resize.
        return exports.toMessageBuffer(val, type, schemaId, length - pos);
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
exports.fromMessageBuffer = (type, encodedMessage, sr) => {
    if (encodedMessage[0] !== MAGIC_BYTE) {
        __1.Logger.instance.error('Message not serialized with magic byte!');
        return { value: undefined, schemaId: undefined };
    }
    const schemaId = encodedMessage.readInt32BE(1);
    const schemaKey = 'schema-' + schemaId;
    let decoded;
    if (!sr.schemaTypeById[schemaKey]) {
        // use default type
        decoded = type.decode(encodedMessage, 5);
    }
    else {
        decoded = sr.schemaTypeById[schemaKey].decode(encodedMessage, 5);
    }
    return {
        value: decoded.value,
        schemaId: schemaId,
    };
};
//# sourceMappingURL=magic-byte.js.map