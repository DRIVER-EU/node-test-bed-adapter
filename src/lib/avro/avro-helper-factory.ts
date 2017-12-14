import * as fs from 'fs';
import * as path from 'path';
import * as avro from 'avsc';
import { IValidator } from '../models/validator';
import { IEncoder } from '../models/encoder';
import { IDecoder } from '../models/decoder';

export const avroHelperFactory = (schemaUri: string, type?: string) => {
  schemaUri = path.resolve(schemaUri);
  const schemaFile = fs.readFileSync(schemaUri, { encoding: 'utf8' });
  const avroSchemaFile = JSON.parse(schemaFile);
  const avroSchema = avro.Type.forSchema(avroSchemaFile);
  const avroType = type ? avroSchema.types.find(t => t.name === type) : avroSchema;
  if (!avroType) { throw new Error(`Unable to resolve ${type} in ${schemaUri}!`); }
  const removeNulls = (_key: string, value: any) => (value === 'null' || value === null) ? undefined : value;
  const errorHook = (path: string[], part: any) =>
    console.error(path.join(', ') + '\n' + JSON.stringify(part, null, 2));
  return {
    validate: (obj: Object) => avroType.isValid(obj, { errorHook }),
    encode: (obj: Object) => avroType.toBuffer(obj),
    decode: (buf: Buffer) => avroType.decode(buf, 0).value,
    toString: (buf: Buffer | Object) => typeof buf === 'object'
      ? JSON.stringify(buf, removeNulls)
      : JSON.stringify(avroType.decode(buf, 0).value, removeNulls)
  } as IValidator & IEncoder & IDecoder;
};
