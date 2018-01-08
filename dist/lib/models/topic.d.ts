import { IDecoder } from './decoder';
import { IEncoder } from './encoder';
import { IValidator } from './validator';
export interface IInitializedTopic extends IValidator, IEncoder, IDecoder {
    topic: string;
}
