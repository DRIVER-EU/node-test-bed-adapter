"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const magic_byte_1 = require("./../models/magic-byte");
const __1 = require("..");
exports.avroHelperFactory = (sr, topic) => {
    const log = __1.Logger.instance;
    const valueSchema = sr.valueSchemas[topic];
    const keySchema = sr.keySchemas.hasOwnProperty(topic) ? sr.keySchemas[topic] : undefined;
    // schemaUri = path.resolve(schemaUri);
    // const schemaFile = fs.readFileSync(schemaUri, { encoding: 'utf8' });
    // const avroSchemaFile = JSON.parse(schemaFile);
    // const avroSchema = avro.Type.forSchema(avroSchemaFile);
    // const avroType = type ? avroSchema.types.find(t => t.name === type) : avroSchema;
    // if (!avroType) { throw new Error(`Unable to resolve ${type} in ${schemaUri}!`); }
    const removeNulls = (_key, value) => (value === 'null' || value === null) ? undefined : value;
    const errorHook = (path, part) => log.error(path.join(', ') + '\n' + JSON.stringify(part, null, 2));
    return {
        isValid: (obj) => {
            const msg = obj instanceof Array ? obj : [obj];
            return msg.reduce((p, c) => p && valueSchema.type.isValid(c, { errorHook }), true);
        },
        encode: (obj) => {
            return obj instanceof Array
                ? obj.map(o => magic_byte_1.toMessageBuffer(o, valueSchema.type, valueSchema.srId))
                : magic_byte_1.toMessageBuffer(obj, valueSchema.type, valueSchema.srId);
        },
        decode: (buf) => {
            return buf instanceof Array
                ? buf.map(m => magic_byte_1.fromMessageBuffer(valueSchema.type, m, sr).value)
                : magic_byte_1.fromMessageBuffer(valueSchema.type, buf, sr).value;
        },
        isKeyValid: (key) => {
            return keySchema ? keySchema.type.isValid(key, { errorHook }) : true;
        },
        encodeKey: (key) => {
            return keySchema ? magic_byte_1.toMessageBuffer(key, keySchema.type, keySchema.srId) : key;
        },
        decodeKey: (buf) => {
            return keySchema && buf instanceof Buffer ? magic_byte_1.fromMessageBuffer(keySchema.type, buf, sr).value : buf;
        },
        toString: (buf) => typeof buf === 'object'
            ? JSON.stringify(buf, removeNulls)
            : JSON.stringify(magic_byte_1.fromMessageBuffer(valueSchema.type, buf, sr).value, removeNulls)
    };
};
//# sourceMappingURL=avro-helper-factory.js.map