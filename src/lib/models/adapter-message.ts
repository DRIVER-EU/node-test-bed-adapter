import { IDefaultKey } from './../avro/default-key-schema';

export interface IAdapterMessage {
  topic: string;
  key: IDefaultKey | string;
  value: Object | Object[];
  offset?: number;
  partition?: number;
  highWaterOffset?: number;
}