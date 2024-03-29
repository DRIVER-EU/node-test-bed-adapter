// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafkajs/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);

import {
  TestBedAdapter,
  AdapterLogger,
  LogLevel,
  AdapterMessage,
  sleep,
} from 'node-test-bed-adapter';

const log = AdapterLogger.instance;

class Consumer {
  private id = 'tno-consumer';
  private adapter!: TestBedAdapter;

  constructor() {
    let count = 0;
    const initAdapter = () => {
      const adapter = new TestBedAdapter({
        kafkaHost: process.env.KAFKA_HOST || 'localhost:3501',
        schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
        heartbeatInterval: process.env.HEARTBEAT_INTERVAL
          ? +process.env.HEARTBEAT_INTERVAL
          : undefined,
        fetchAllSchemas: false,
        fetchAllVersions: false,
        wrapUnions: true,
        // wrapUnions: 'auto',
        groupId: this.id,
        // consume: ['config'],
        consume: ['standard_cap'],
        maxConnectionRetries: 1,
        fromOffset: 'earliest',
        logging: {
          logToConsole: LogLevel.Info,
          logToFile: LogLevel.Info,
          logToKafka: LogLevel.Warn,
          logFile: 'log.txt',
        },
      });
      adapter.on('error', async (err) => {
        console.error(`Consumer ${this.id} received an error: ${err}`);
        connectWithRetry();
      });
      adapter.on('consumer.disconnect', async () => {
        console.error(`Consumer ${this.id} disconnected`);
      });
      adapter.on('consumer.stop', async () => {
        console.error(`Consumer ${this.id} stopped`);
      });
      adapter.on('consumer.crash', async () => {
        console.error(`Consumer ${this.id} crashed`);
        connectWithRetry();
      });
      adapter.on('ready', () => {
        this.subscribe();
        this.getTopics();
        log.info('Consumer is connected');
        // this.adapter.addConsumerTopics({ topic: 'system_configuration', offset: 0 }, true, (err, msg) => {
        //   if (err) {
        //     return log.error(err);
        //   }
        //   this.handleMessage(msg as IAdapterMessage);
        // });
      });
      return adapter;
    };

    const connectWithRetry = async () => {
      console.log(`Connecting to Kafka... count ${count++}`);
      if (this.adapter) {
        this.adapter.disconnect();
      }
      await sleep(1000);
      this.adapter = initAdapter();
      await this.adapter.connect();
    };
    connectWithRetry();
  }

  private subscribe() {
    this.adapter.on('message', (message) => this.handleMessage(message));
    this.adapter.on('offsetOutOfRange', (err) => {
      console.error(
        `Consumer received an offsetOutOfRange error on topic ${err.topic}.`
      );
    });
  }

  private async getTopics() {
    await this.adapter.loadMetadataForTopics([], (error, results) => {
      if (error) {
        return log.error(error);
      }
      if (results && results.length > 0) {
        results.forEach((result) => {
          console.log(JSON.stringify(result, null, 2));
        });
      }
    });
  }

  private handleMessage(message: AdapterMessage) {
    const stringify = (m: string | Object) =>
      typeof m === 'string' ? m : JSON.stringify(m, null, 2);
    switch (message.topic.toLowerCase()) {
      case 'system_heartbeat':
        message.key &&
          log.info(
            `Received heartbeat message with key ${stringify(
              message.key
            )}: ${stringify(message.value)}`
          );
        break;
      case 'standard_cap':
        message.key &&
          log.info(
            `Received CAP message with key ${stringify(
              message.key
            )}: ${stringify(message.value)}`
          );
        break;
      default:
        message.key &&
          log.info(
            `Received ${message.topic} message with key ${stringify(
              message.key
            )}: ${stringify(message.value)}`
          );
        break;
    }
  }
}

new Consumer();
