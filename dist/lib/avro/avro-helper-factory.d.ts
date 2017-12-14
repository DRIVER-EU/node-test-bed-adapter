import { IValidator } from '../models/validator';
import { IEncoder } from '../models/encoder';
import { IDecoder } from '../models/decoder';
export declare const avroHelperFactory: (schemaUri: string, type?: string | undefined) => IValidator & IEncoder & IDecoder;
