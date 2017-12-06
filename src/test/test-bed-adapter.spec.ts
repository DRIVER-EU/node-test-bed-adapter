import { ITestBedOptions } from './../lib/models/test-bed-options';
import { TestBedAdapter } from '../lib/index';

describe('TestBedAdapter', () => {
  it('should throw when there is no configuration file', () => {
    const foo = () => { return new TestBedAdapter(); };
    expect(foo).toThrow();
  });

  it('should throw when the kafkaHost or clientId is missing', () => {
    const foo = () => { return new TestBedAdapter({} as ITestBedOptions); };
    expect(foo).toThrow();
  });

  it('should create a testbed adapter', () => {
    const result = new TestBedAdapter({ kafkaHost: 'broker:9092', clientId: 'client' });
    expect(result.isConnected).toBe(false);
  });

});
