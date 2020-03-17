// UNCOMMENT IF YOU WANT TO ENHANCE THE LOG OUTPUT OF KAFKA
// import { consoleLoggerProvider } from './console-logger-provider';
// const kafkaLogging = require('kafka-node/logging');
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);

import {
  TestBedAdapter,
  Logger,
  LogLevel,
  ITopicMetadataItem,
  IAdapterMessage,
} from '../lib/index';

const log = Logger.instance;

/** Test time messages */
class TimeConsumer {
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'localhost:3501',
      schemaRegistry: 'localhost:3502',
      // kafkaHost: 'driver-testbed.eu:3501',
      // schemaRegistry: 'driver-testbed.eu:3502',
      fetchAllSchemas: false,
      fetchAllVersions: false,
      wrapUnions: true,
      // wrapUnions: 'auto',
      clientId: 'NodeTimeConsumer',
      // Start from the latest message, not from the first
      fromOffset: false,
      logging: {
        logToConsole: LogLevel.Info,
        logToFile: LogLevel.Info,
        logToKafka: LogLevel.Warn,
        logFile: 'log.txt',
      },
    });
    this.adapter.on('ready', () => {
      setInterval(() => {
        const time = this.adapter.simulationTime;
        const speed = this.adapter.simulationSpeed;
        const state = this.adapter.timeState;
        process.stdout.write(
          `Time: ${time.toUTCString()}; Speed: ${speed}; State: ${state}    \r`
        );
      }, 100);
    });
    this.adapter.on('error', err =>
      log.error(`Consumer received an error: ${err}`)
    );
    this.adapter.connect();
  }
}

new TimeConsumer();
