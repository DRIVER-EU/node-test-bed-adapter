import { TestBedAdapter } from '../test-bed-adapter';
import { ICanLog, LogLevel, LogLevelToType } from '.';
import { ProduceRequest } from 'kafka-node';
import { ILog as ILogMessage } from 'test-bed-schemas';
import { LogTopic } from '..';

export interface IKafkaLoggerOptions {
  adapter: TestBedAdapter;
  /** Client id: id will be the key of each payload */
  clientId: string;
}

/**
 * Based on winston-k
 * source: https://github.com/jackielihf/winston-k/blob/master/logger.js
 */
export class KafkaLogger implements ICanLog {
  private adapter: TestBedAdapter;
  private id: string | number;
  private isInitialized = false;

  constructor(options: IKafkaLoggerOptions) {
    this.id = options.clientId;
    this.adapter = options.adapter;
    this.adapter
      .addProducerTopics(LogTopic)
      .then(() => (this.isInitialized = true));
  }

  public log(
    level: LogLevel,
    msg: string,
    callback: (err?: Error, result?: any) => void
  ) {
    if (this.isInitialized === false) {
      return;
    }
    const payload: ProduceRequest[] = [
      {
        topic: LogTopic,
        messages: {
          id: this.id,
          level: LogLevelToType(level),
          dateTimeSent: Date.now(),
          log: msg,
        } as ILogMessage,
      },
    ];
    this.adapter.send(payload, (err, res) => {
      if (err) {
        if (typeof err === 'string') {
          err = `[KAFKA] ${err}`;
        } else if (err.hasOwnProperty('message')) {
          err.message = `[KAFKA] ${err.message}`;
        }
        return callback(err, null);
      }
      callback(undefined, res);
    });
  }
}
