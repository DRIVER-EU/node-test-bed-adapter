import { ILog } from './logger';
import { Producer, HighLevelProducer } from 'kafka-node';
import { LogLevel } from './log-levels';
export interface IKafkaLoggerOptions {
    producer: Producer | HighLevelProducer;
    /** Client id: id will be the key of each payload */
    clientId: string;
}
/**
 * Based on winston-k
 * source: https://github.com/jackielihf/winston-k/blob/master/logger.js
 */
export declare class KafkaLogger implements ILog {
    private static LogTopic;
    private producer;
    private id;
    constructor(options: IKafkaLoggerOptions);
    log(_level: LogLevel, msg: string, callback: (err?: Error, result?: any) => void): void;
}
