import { OffsetFetchRequest } from 'kafka-node';

export interface IConfiguration {
  clientId: string;
  kafkaHost: string;
  schemaRegistry: string;
  heartbeatInterval: number;
  consume?: OffsetFetchRequest[];
  produce?: string[];
  logging?: {
    logToConsole?: number;
    logToKafka?: number;
    logToFile?: number;
    logFile?: string;
  }
}
