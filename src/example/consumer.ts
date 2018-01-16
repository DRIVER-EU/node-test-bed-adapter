// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);

import { Message, OffsetFetchRequest } from 'kafka-node';
import { TestBedAdapter, Logger, LogLevel, ITopicMetadataItem } from '../lib/index';
import * as Promise from 'bluebird';

class Consumer {
  private adapter: TestBedAdapter;
  private log = Logger.instance;
  private retries: number = 0;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'broker:3501',
      schemaRegistry: 'schema_registry:3502',
      fetchAllSchemas: false,
      autoRegisterSchemas: true,
      clientId: 'Consumer',
      consume: [{ topic: 'cap' }],
      logging: {
        logToConsole: LogLevel.Debug,
        logToFile: LogLevel.Debug,
        logToKafka: LogLevel.Debug,
        logFile: 'log.txt'
      }
    });
    this.adapter.on('ready', () => {
      this.subscribe().then(() => {
        this.log.info('Consumer is connected');
      }).then(() => {
        return this.getTopics();
      }).catch((err) => {
        this.log.error(`Error subscribing to topics: ${err}`);
      });
    });
    // this.adapter.on('error', err => {
    //   this.log.error(`Consumer received an error: ${err}`);
    // });
    this.connectAdapter();
  }

  private connectAdapter() {
    this.adapter.connect()
    .then(() => {
      this.log.info(`Initialized test-bed-adapter correctly`);
    })
    .catch(err => {
      this.log.error(`Initializing test-bed-adapter failed: ${err}`);
      if (this.retries < this.adapter.getConfig().maxConnectionRetries) {
        this.retries += 1;
        let timeout = this.adapter.getConfig().retryTimeout;
        this.log.info(`Retrying to connect in ${timeout} seconds (retry #${this.retries})`);
        setTimeout(() => this.connectAdapter(), timeout * 1000);
      }
    });
  }

  private subscribe(): Promise<void | OffsetFetchRequest[]> {
    this.adapter.on('message', message => this.handleMessage(message));
    this.adapter.on('error', err => this.log.error(`Consumer received an error: ${err}`));
    this.adapter.on('offsetOutOfRange', err => this.log.error(`Consumer received an error: ${err}`));
    return this.adapter.addConsumerTopics({ topic: TestBedAdapter.HeartbeatTopic }).catch(err => {
      if (err) {
        this.log.error(`Consumer received an error: ${err}`);
      }
    });
  }

  private getTopics(): Promise<{}> {
    return new Promise<{}>((resolve, reject) => {
      this.adapter.loadMetadataForTopics([], (error, results) => {
        if (error) {
          this.log.error(error);
          reject(error);
        }
        if (results && results.length > 0) {
          results.forEach(result => {
            if (result.hasOwnProperty('metadata')) {
              console.log('TOPICS');
              const metadata = (result as { [metadata: string]: { [topic: string]: ITopicMetadataItem } }).metadata;
              for (let key in metadata) {
                const md = metadata[key];
                console.log(`Topic: ${key}, partitions: ${Object.keys(md).length}`);
              }
            } else {
              console.log('NODE');
              console.log(result);
            }
          });
          resolve();
        }
      });
    });
  }

  private handleMessage(message: Message) {
    switch (message.topic.toLowerCase()) {
      case 'heartbeat':
        this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
        break;
      case 'configuration':
        this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
        break;
      case 'cap':
        this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${typeof message.value === 'string' ? message.value : '\n' + JSON.stringify(message.value, null, 2)}`);
        break;
      default:
        this.log.info(`Received message on topic ${message.topic}: ${message.value}`);
        break;
    }
  }
}

new Consumer();
