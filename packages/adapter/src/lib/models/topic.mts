import { IDecoder } from './decoder.mjs';
import { IEncoder } from './encoder.mjs';
import { IValidator } from './validator.mjs';

export interface IInitializedTopic extends IValidator, IEncoder, IDecoder {
  topic: string;
}
