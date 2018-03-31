import { OffsetFetchRequest } from 'kafka-node';
import { LogLevelType } from '..';

export interface IConfiguration {
  clientId: string;
  kafkaHost: string;
  schemaRegistry: string;
  heartbeatInterval: number;
  consume?: OffsetFetchRequest[];
  produce?: string[];
  logging?: {
    logToConsole?: LogLevelType;
    logToKafka?: LogLevelType;
    logToFile?: LogLevelType;
    logFile?: string;
  }
}
