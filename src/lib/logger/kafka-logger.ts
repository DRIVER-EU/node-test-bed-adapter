import { ILog } from './logger';
import { Producer, HighLevelProducer, ProduceRequest } from 'kafka-node';
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
export class KafkaLogger implements ILog {
  private static LogTopic = '_log';
  private producer: Producer | HighLevelProducer;
  private id: string | number;

  constructor(options: IKafkaLoggerOptions) {
    this.id = options.clientId;
    this.producer = options.producer;
    this.producer.createTopics([KafkaLogger.LogTopic], true, (err, _data) => { if (err) { console.error(err); } });
  }

  public log(_level: LogLevel, msg: string, callback: (err?: Error, result?: any) => void) {
    const payload: ProduceRequest[] = [{
      topic: KafkaLogger.LogTopic, messages: {
        id: this.id, log: msg
      }
    }];
    this.producer.send(payload, (err, res) => {
      if (err) {
        if (typeof err === 'string') { err = `[KAFKA] ${err}`; }
        else if (err.hasOwnProperty('message')) { err.message = `[KAFKA] ${err.message}`; }
        return callback(err, null);
      }
      callback(undefined, res);
    });
  }
}