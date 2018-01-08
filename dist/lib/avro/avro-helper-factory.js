"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magic_byte_1 = require("./../models/magic-byte");
const __1 = require("..");
const removeNulls = (_key, value) => (value === 'null' || value === null) ? undefined : value;
/**
 * Create an object that knows how to validate/encode/decode keys and values of a message.
 *
 * @param sr Schema registry
 * @param topic Topic to publish to. Is also the key to retreive schema's for key/value
 */
exports.avroHelperFactory = (sr, topic) => {
    const log = __1.Logger.instance;
    const valueSchema = sr.valueSchemas[topic];
    const keySchema = sr.keySchemas.hasOwnProperty(topic) ? sr.keySchemas[topic] : undefined;
    const errorHook = (path, part) => log.error(`avroHelperFactory() - Topic ${topic}, path ${path.join(', ')}
    ${JSON.stringify(part, null, 2)}`);
    return {
        /** Check whether the message is valid */
        isValid: (obj) => {
            const msg = obj instanceof Array ? obj : [obj];
            return msg.reduce((p, c) => p && valueSchema.type.isValid(c, { errorHook }), true);
        },
        /** Encode the message or messages */
        encode: (obj) => {
            return obj instanceof Array
                ? obj.map(o => magic_byte_1.toMessageBuffer(o, valueSchema.type, valueSchema.srId))
                : magic_byte_1.toMessageBuffer(obj, valueSchema.type, valueSchema.srId);
        },
        /** Decode the message or messages */
        decode: (buf) => {
            return buf instanceof Array
                ? buf.map(m => magic_byte_1.fromMessageBuffer(valueSchema.type, m, sr).value)
                : magic_byte_1.fromMessageBuffer(valueSchema.type, buf, sr).value;
        },
        /** Check whether the key is valid */
        isKeyValid: (key) => {
            return keySchema ? keySchema.type.isValid(key, { errorHook }) : true;
        },
        /** Encode the key */
        encodeKey: (key) => {
            return keySchema ? magic_byte_1.toMessageBuffer(key, keySchema.type, keySchema.srId) : key;
        },
        /** Decode the key */
        decodeKey: (buf) => {
            return keySchema && buf instanceof Buffer ? magic_byte_1.fromMessageBuffer(keySchema.type, buf, sr).value : buf;
        },
        /** Convert the object to a string */
        toString: (buf) => typeof buf === 'object'
            ? JSON.stringify(buf, removeNulls)
            : JSON.stringify(magic_byte_1.fromMessageBuffer(valueSchema.type, buf, sr).value, removeNulls)
    };
};
//# sourceMappingURL=avro-helper-factory.js.map