import { toMessageBuffer, fromMessageBuffer } from './../models/magic-byte';
import { IValidator } from '../models/validator';
import { IEncoder } from '../models/encoder';
import { IDecoder } from '../models/decoder';
import { Logger } from '..';
import { SchemaRegistry } from '../schema-registry';

export const avroHelperFactory = (sr: SchemaRegistry, topic: string) => {
  const log = Logger.instance;
  const valueSchema = sr.valueSchemas[topic];
  const keySchema = sr.keySchemas.hasOwnProperty(topic) ? sr.keySchemas[topic] : undefined;
  // schemaUri = path.resolve(schemaUri);
  // const schemaFile = fs.readFileSync(schemaUri, { encoding: 'utf8' });
  // const avroSchemaFile = JSON.parse(schemaFile);
  // const avroSchema = avro.Type.forSchema(avroSchemaFile);
  // const avroType = type ? avroSchema.types.find(t => t.name === type) : avroSchema;

  // if (!avroType) { throw new Error(`Unable to resolve ${type} in ${schemaUri}!`); }

  const removeNulls = (_key: string, value: any) => (value === 'null' || value === null) ? undefined : value;
  const errorHook = (path: string[], part: any) =>
    log.error(path.join(', ') + '\n' + JSON.stringify(part, null, 2));

  return {
    isValid: (obj: Object | Object[]) => {
      const msg: Object[] = obj instanceof Array ? obj : [obj];
      return msg.reduce((p, c) => p && valueSchema.type.isValid(c, { errorHook }), true);
    },
    encode: (obj: Object | Object[]) => {
      return obj instanceof Array
        ? obj.map(o => toMessageBuffer(o, valueSchema.type, valueSchema.srId))
        : toMessageBuffer(obj, valueSchema.type, valueSchema.srId);
    },
    decode: (buf: Buffer | Buffer[]) => {
      return buf instanceof Array
        ? buf.map(m => fromMessageBuffer(valueSchema.type, m, sr).value)
        : fromMessageBuffer(valueSchema.type, buf, sr).value;
    },
    isKeyValid: (key: Object | string | number) => {
      return keySchema ? keySchema.type.isValid(key, { errorHook }) : true;
    },
    encodeKey: (key: Object) => {
      return keySchema ? toMessageBuffer(key, keySchema.type, keySchema.srId) : key;
    },
    decodeKey: (buf: Buffer | string | number) => {
      return keySchema && buf instanceof Buffer ? fromMessageBuffer(keySchema.type, buf, sr).value : buf;
    },
    toString: (buf: Buffer | Object) => typeof buf === 'object'
      ? JSON.stringify(buf, removeNulls)
      : JSON.stringify(fromMessageBuffer(valueSchema.type, buf, sr).value, removeNulls)
  } as IValidator & IEncoder & IDecoder;
};
