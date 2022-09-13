import {
  TestBedAdapter,
  ITestBedOptions,
  ProduceRequest,
  LogLevel,
} from './index.mjs';
import proxyquire from 'proxyquire';
import { EventEmitter } from 'events';
import { KafkaClient } from 'kafka-node';

describe('TestBedAdapter', () => {
  let TestBedAdapterMock: typeof TestBedAdapter;

  class KafkaClientMock extends EventEmitter {
    constructor(public config?: ITestBedOptions) {
      super();
      setTimeout(() => this.emit('ready'), 10);
    }
  }

  class ConsumerMock extends EventEmitter {
    constructor(_client: KafkaClient, _topics: string[], _options: Object) {
      super();
      setTimeout(() => this.emit('ready'), 10);
    }

    public addTopics(..._args: any[]) {}
  }

  class ProducerMock extends EventEmitter {
    constructor(_client: KafkaClient, _topics: string[], _options: Object) {
      super();
      setTimeout(() => this.emit('ready'), 10);
    }

    public createTopics(..._args: any[]) {}
    public send(_pr: ProduceRequest[], cb: (err: any, result: any) => void) {
      cb(null, '');
    }
  }

  beforeAll((done) => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
    TestBedAdapterMock = proxyquire('./index', {
      'kafka-node': {
        KafkaClient: KafkaClientMock,
        Consumer: ConsumerMock,
        Producer: ProducerMock,
      },
    }).TestBedAdapter;
    done();
  });

  it('should throw when there is no configuration file', () => {
    const foo = () => new TestBedAdapterMock();
    expect(foo).toThrow();
  });

  it('should throw when the kafkaHost or clientId is missing', () => {
    const foo = () => new TestBedAdapterMock({} as ITestBedOptions);
    expect(foo).toThrow();
  });

  it('should not automatically connect to the testbed', () => {
    const result = new TestBedAdapterMock({
      kafkaHost: 'localhost:3501',
      schemaRegistry: 'localhost:3502',
      groupId: 'client',
    });
    expect(result.isConnected).toBe(false);
  });

  it('should connect to the testbed', (done) => {
    const tba = new TestBedAdapterMock({
      kafkaHost: 'localhost:3501',
      schemaRegistry: 'localhost:3502',
      groupId: 'client',
      logging: {
        logToConsole: LogLevel.Info,
      },
    });
    tba.on('ready', () => {
      expect(tba.isConnected).toBe(true);
      done();
    });
    tba.connect();
  });

  it('should load the test-bed-config.json from the config folder', () => {
    const testbed = new TestBedAdapterMock(
      './src/test/config/test-bed-config.json'
    );
    const configuration = testbed.configuration;
    expect(configuration.kafkaHost).toEqual('localhost:3501');
    expect(configuration.produce).toBeTruthy();
    expect(configuration.consume).toBeTruthy();
    expect(configuration.consume && configuration.consume.length).toBe(2); // time and invitations
  });
});
