// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);

import { TestBedAdapter, Logger, LogLevel, ITopicMetadataItem, IAdapterMessage } from '../lib';
import * as fs from 'fs';

const log = Logger.instance;

class Consumer {
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'localhost:3501',
      schemaRegistry: 'localhost:3502',
      sslOptions: {
        pfx: fs.readFileSync('certs/other-tool-1-client.p12'),
        passphrase: 'changeit',
        ca: fs.readFileSync('certs/test-ca.pem'),
        rejectUnauthorized: true
      },
      // kafkaHost: 'driver-testbed.eu:3501',
      // schemaRegistry: 'driver-testbed.eu:3502',
      fetchAllSchemas: false,
      fetchAllVersions: false,
      wrapUnions: true,
      // wrapUnions: 'auto',
      clientId: 'NodeTestConsumerSecure',
      consume: [{topic: 'system_heartbeat', offset: 0}],
      fromOffset: true,
      logging: {
        logToConsole: LogLevel.Info,
        logToFile: LogLevel.Info,
        logToKafka: LogLevel.Warn,
        logFile: 'log.txt'
      }
    });
    this.adapter.on('ready', () => {
      this.subscribe();
      log.info('Consumer is connected');
      this.getTopics();
    });
    this.adapter.on('error', err => log.error(`Consumer received an error: ${err}`));
    this.adapter.connect();
  }

  private subscribe() {
    this.adapter.on('message', message => this.handleMessage(message));
    // this.adapter.addConsumerTopics({ topic: TestBedAdapter.HeartbeatTopic }).catch(err => {
    //   if (err) { log.error(`Consumer received an error: ${err}`); }
    // });
  }

  private getTopics() {
    this.adapter.loadMetadataForTopics([], (error, results) => {
      if (error) { return log.error(error); }
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

  private handleMessage(message: IAdapterMessage) {
    const stringify = (m: string | Object) => typeof m === 'string' ? m : JSON.stringify(m, null, 2);
    switch (message.topic.toLowerCase()) {
      case 'system_heartbeat':
        log.info(`Received heartbeat message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
      case 'standard_cap':
        log.info(`Received CAP message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
      default:
        log.info(`Received ${message.topic} message with key ${stringify(message.key)}: ${stringify(message.value)}`);
        break;
    }
  }
}

new Consumer();
