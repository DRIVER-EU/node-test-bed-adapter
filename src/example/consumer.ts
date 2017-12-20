// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);

import { Message } from 'kafka-node';
import { TestBedAdapter, Logger } from '../lib/index';

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
      }]
    });
    this.adapter.on('ready', () => {
      this.subscribe();
      this.log.info('Consumer is connected');
    });
    this.adapter.on('error', err => {
      this.log.error(`Consumer received an error: ${err}`);
    });
    this.adapter.connect();
  }

  public subscribe() {
    this.adapter.on('message', message => this.handleMessage(message));
    this.adapter.on('error', err => this.log.error(`Consumer received an error: ${err}`));
    this.adapter.on('offsetOutOfRange', err => this.log.error(`Consumer received an error: ${err}`));
    this.adapter.addTopics({ topic: TestBedAdapter.HeartbeatTopic }, err => {
      if (err) { this.log.error(`Consumer received an error: ${err}`); }
    });
  }

  private handleMessage(message: Message) {
    switch (message.topic.toLowerCase()) {
      case 'heartbeat':
        this.log.info(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
        break;
      default:
        this.log.info(`Received message on topic ${message.topic}: ${message.value}`);
        break;
    }
  }
}

new Consumer();
