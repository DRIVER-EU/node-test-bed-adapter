import { ILog } from './logger';
import { Producer, HighLevelProducer, ProduceRequest } from 'kafka-node';
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
export class KafkaLogger implements ILog {
  private producer: Producer | HighLevelProducer;
  private topic: string;

  constructor(options: IKafkaLoggerOptions) {
    this.topic = `log-${options.clientId.toLowerCase()}`;
    this.producer = options.producer;
    this.producer.createTopics([this.topic], true, (err, _data) => { if (err) { console.error(err); } });
  }

  public log(_level: LogLevel, msg: string, callback: (err?: Error, result?: any) => void) {
    const payload: ProduceRequest[] = [{
      topic: this.topic, messages: msg
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