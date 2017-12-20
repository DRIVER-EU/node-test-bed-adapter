import { ILog } from './logger';
import { Producer, HighLevelProducer } from 'kafka-node';
import { LogLevel } from './log-levels';
export interface IKafkaLoggerOptions {
    producer: Producer | HighLevelProducer;
    /** Client id: log topic will be 'log-clientId' (all lowercaps) */
    clientId: string;
}
/**
 * Based on winston-k
 * source: https://github.com/jackielihf/winston-k/blob/master/logger.js
 */
export declare class KafkaLogger implements ILog {
    private producer;
    private topic;
    constructor(options: IKafkaLoggerOptions);
    log(_level: LogLevel, msg: string, callback: (err?: Error, result?: any) => void): void;
}
