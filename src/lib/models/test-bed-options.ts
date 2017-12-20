import { KafkaClientOptions } from 'kafka-node';
import { ITopic } from './topic';
import { LogLevel } from '../logger/log-levels';

export interface ITestBedOptions extends KafkaClientOptions {
  clientId: string;
  kafkaHost: string;
  /** If true, the adapter allows you to publish unvalidated messages */
  canPublishUnvalidatedMessages?: boolean;
  /** Hearbeat interval in msec */
  heartbeatInterval?: number;
  /** Topics you want to consume */
  consume?: ITopic[];
  /** Topics you want to produce */
  produce?: ITopic[];
  /** Specifiy logging options */
  logging?: {
    /** If set, log to file */
    logToFile?: LogLevel;
    /** Name of the log file */
    logFile?: string;
    /** If set, log to console */
    logToConsole?: LogLevel;
    /** If set, log to Kafka */
    logToKafka?: LogLevel;
  };
}