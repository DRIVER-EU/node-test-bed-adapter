import { IValidator } from '../models/validator';
import { IEncoder } from '../models/encoder';
import { IDecoder } from '../models/decoder';
import { SchemaRegistry } from '../schema-registry';
export declare const avroHelperFactory: (sr: SchemaRegistry, topic: string) => IValidator & IEncoder & IDecoder;
