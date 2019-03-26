import * as path from 'path';
import { TestBedAdapter, Logger, LogLevel, ProduceRequest, largeFileUploadCallback, DataType } from '../lib';
import * as amberAlert from '../data/cap/examples/example_amber_alert.json';
import * as earthquakeAlert from '../data/cap/examples/example_earthquake.json';
import * as thunderstormAlert from '../data/cap/examples/example_thunderstorm.json';
import * as homelandSecurityAlert from '../data/cap/examples/example_homeland_security.json';

const log = Logger.instance;

class Producer {
  private id = '3di';
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'localhost:3501',
      schemaRegistry: 'localhost:3502',
      largeFileService: 'localhost:9090',
      // sslOptions: {
      //   pfx: fs.readFileSync('certs/other-tool-1-client.p12'),
      //   passphrase: 'changeit',
      //   ca: fs.readFileSync('certs/test-ca.pem'),
      //   rejectUnauthorized: true,
      // },
      // kafkaHost: 'driver-testbed.eu:3501',
      // schemaRegistry: 'driver-testbed.eu:3502',
      clientId: this.id,
      fetchAllSchemas: false,
      fetchAllVersions: false,
      // autoRegisterSchemas: true,
      autoRegisterSchemas: false,
      wrapUnions: 'auto',
      schemaFolder: './data/schemas',
      produce: ['standard_cap'],
      logging: {
        logToConsole: LogLevel.Info,
        logToKafka: LogLevel.Warn,
      },
    });
    this.adapter.on('error', e => console.error(e));
    this.adapter.on('ready', () => {
      log.info(`Current simulation time: ${this.adapter.trialTime}`);
      log.info('Producer is connected');
      this.uploadFile();
      this.sendCap();
    });
    this.adapter.connect();
  }

  private uploadFile() {
    const file = path.resolve(process.cwd(), './dist/data/cap/examples/example_amber_alert.json');
    const cb = largeFileUploadCallback(this.adapter, 'Amber alert message', 'This is a test message', DataType.json);
    this.adapter.uploadFile(file, false, cb);
  }

  /** Will currently only work if you are authorized to send CAP messages. */
  private sendCap() {
    const payloads: ProduceRequest[] = [
      {
        topic: 'standard_cap',
        messages: amberAlert,
        attributes: 1, // Gzip
      },
      {
        topic: 'standard_cap',
        messages: earthquakeAlert,
        attributes: 1, // Gzip
      },
      {
        topic: 'standard_cap',
        messages: thunderstormAlert,
        attributes: 1, // Gzip
      },
      {
        topic: 'standard_cap',
        messages: homelandSecurityAlert,
        attributes: 1, // Gzip
      },
    ];
    this.adapter.send(payloads, (error, data) => {
      if (error) {
        log.error(error);
      }
      if (data) {
        log.info(data);
      }
    });
  }
}

new Producer();
