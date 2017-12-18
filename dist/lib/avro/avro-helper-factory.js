"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const avro = require("avsc");
exports.avroHelperFactory = (schemaUri, type) => {
    schemaUri = path.resolve(schemaUri);
    const schemaFile = fs.readFileSync(schemaUri, { encoding: 'utf8' });
    const avroSchemaFile = JSON.parse(schemaFile);
    const avroSchema = avro.Type.forSchema(avroSchemaFile);
    const avroType = type ? avroSchema.types.find(t => t.name === type) : avroSchema;
    if (!avroType) {
        throw new Error(`Unable to resolve ${type} in ${schemaUri}!`);
    }
    const removeNulls = (_key, value) => (value === 'null' || value === null) ? undefined : value;
    const errorHook = (path, part) => console.error(path.join(', ') + '\n' + JSON.stringify(part, null, 2));
    return {
        isValid: (obj) => {
            const msg = obj instanceof Array ? obj : [obj];
            return msg.reduce((p, c) => p && avroType.isValid(c, { errorHook }), true);
        },
        encode: (obj) => {
            return obj instanceof Array
                ? obj.map(o => avroType.toBuffer(o))
                : avroType.toBuffer(obj);
        },
        decode: (buf) => {
            return buf instanceof Array
                ? buf.map(m => avroType.decode(m, 0).value)
                : avroType.decode(buf, 0).value;
        },
        toString: (buf) => typeof buf === 'object'
            ? JSON.stringify(buf, removeNulls)
            : JSON.stringify(avroType.decode(buf, 0).value, removeNulls)
    };
};
//# sourceMappingURL=avro-helper-factory.js.map