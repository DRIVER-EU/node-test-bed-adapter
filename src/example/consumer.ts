// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);

import { Message } from 'kafka-node';
import { TestBedAdapter, Logger, LogLevel, ITopicMetadataItem } from '../lib/index';

class Consumer {
  private adapter: TestBedAdapter;
  private log = Logger.instance;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'broker:3501',
      clientId: 'Consumer',
      consume: [{
        topic: 'CAP',
        schemaURI: './data/cap/cap.avsc',
        type: 'driver.eu.alert'
      }, {
        topic: 'log-producer'
      }, {
        topic: TestBedAdapter.ConfigurationTopic
      }],
      logging: {
        logToConsole: LogLevel.Debug,
        logToFile: LogLevel.Debug,
        logToKafka: LogLevel.Debug,
        logFile: 'log.txt'
      }
    });
    this.adapter.on('ready', () => {
      this.subscribe();
      this.log.info('Consumer is connected');
      this.getTopics();
    });
    this.adapter.on('error', err => {
      this.log.error(`Consumer received an error: ${err}`);
    });
    this.adapter.connect();
  }

  private subscribe() {
    this.adapter.on('message', message => this.handleMessage(message));
    this.adapter.on('error', err => this.log.error(`Consumer received an error: ${err}`));
    this.adapter.on('offsetOutOfRange', err => this.log.error(`Consumer received an error: ${err}`));
    this.adapter.addTopics({ topic: TestBedAdapter.HeartbeatTopic }, err => {
      if (err) { this.log.error(`Consumer received an error: ${err}`); }
    });
  }

  private getTopics() {
    this.adapter.loadMetadataForTopics([], (error, results) => {
      if (error) { return this.log.error(error); }
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
      }
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
      default:
        this.log.info(`Received message on topic ${message.topic}: ${message.value}`);
        break;
    }
  }
}

new Consumer();
