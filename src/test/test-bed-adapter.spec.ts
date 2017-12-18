import { TestBedAdapter } from '../lib/test-bed-adapter';
import { ITestBedOptions } from '../lib/models/test-bed-options';
import * as proxyquire from 'proxyquire';
import { EventEmitter } from 'events';
import { KafkaClient } from 'kafka-node';
import { ITopic } from '../lib/index';

describe('TestBedAdapter', () => {
  let TestBedAdapterMock: typeof TestBedAdapter;

  class KafkaClientMock extends EventEmitter {
    constructor(public config?: ITestBedOptions) {
      super();
      setTimeout(() => this.emit('ready'), 10);
    }
  }

  class ConsumerMock extends EventEmitter {
    constructor(_client: KafkaClient, _topics: ITopic[], _options: Object) {
      super();
      setTimeout(() => this.emit('ready'), 10);
    }

    public addTopics(..._args: any[]) {};
  }

  class ProducerMock extends EventEmitter {
    constructor(_client: KafkaClient, _topics: ITopic[], _options: Object) {
      super();
      setTimeout(() => this.emit('ready'), 10);
    }

    public createTopics(..._args: any[]) {};
  }

  beforeAll(done => {
    TestBedAdapterMock = proxyquire('../lib/test-bed-adapter', { 'kafka-node': {
      KafkaClient: KafkaClientMock,
      Consumer: ConsumerMock,
      Producer: ProducerMock
    } }).TestBedAdapter;
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
    const result = new TestBedAdapterMock({ kafkaHost: 'broker:9092', clientId: 'client' });
    expect(result.isConnected).toBe(false);
  });

  it('should connect to the testbed', (done) => {
    const tba = new TestBedAdapterMock({ kafkaHost: 'broker:9092', clientId: 'client' });
    tba.on('ready', () => {
      expect(tba.isConnected).toBe(true);
      done();
    });
    tba.connect();
  });

  it('should load the test-bed-config.json from the config folder', () => {
    const testbed = new TestBedAdapterMock('./src/test/config/test-bed-config.json');
    const configuration = testbed.configuration;
    expect(configuration.kafkaHost).toEqual('broker:9092');
    expect(configuration.produce).toBeTruthy();
    expect(configuration.consume).toBeTruthy();
    expect(configuration.consume && configuration.consume.length).toBe(0);
  });

});
