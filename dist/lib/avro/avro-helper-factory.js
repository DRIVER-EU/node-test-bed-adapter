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
    const avroType = avroSchema.types.find(t => t.name === type);
    if (!avroType) {
        throw new Error(`Unable to resolve ${type} in ${schemaUri}!`);
    }
    const errorHook = (path, part) => console.error(path.join(', ') + '\n' + JSON.stringify(part, null, 2));
    return {
        validate: (obj) => avroType.isValid(obj, { errorHook }),
        encode: (obj) => avroType.toBuffer(obj),
        decode: (buf) => avroType.decode(buf, 0).value
    };
};
//# sourceMappingURL=avro-helper-factory.js.map