import { TestBedAdapter } from '../lib/index';

class Producer {
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'broker:3501',
      clientId: 'Producer'
    });
    this.adapter.on('ready', () => console.log('Producer is connected'));
    this.adapter.connect();
  }
}

new Producer();
