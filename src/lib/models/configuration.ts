import { LogLevel } from './../logger/log-levels';
import { OffsetFetchRequest } from 'kafka-node';

export interface IConfiguration {
  clientId: string;
  kafkaHost: string;
  schemaRegistry: string;
  heartbeatInterval: number;
  consume?: OffsetFetchRequest[];
  produce?: string[];
  logging?: {
    logToConsole?: LogLevel;
    logToKafka?: LogLevel;
    logToFile?: LogLevel;
    logFile?: string;
  }
}
