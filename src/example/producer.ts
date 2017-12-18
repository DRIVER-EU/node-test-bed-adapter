import { ProduceRequest } from 'kafka-node';
import { TestBedAdapter } from '../lib/index';
import * as amberAlert from '../../data/cap/examples/example_amber_alert.json';
// import * as earthquakeAlert from '../../../data/cap/examples/example_earthquake.json';
// import * as thunderstormAlert from '../../../data/cap/examples/example_thunderstorm.json';
// import * as homelandSecurityAlert from '../../../data/cap/examples/example_homeland_security.json';

class Producer {
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'broker:3501',
      clientId: 'Producer',
      produce: [{
        topic: 'CAP',
        schemaURI: './data/cap/cap.avsc',
        type: 'driver.eu.alert'
      }]
    });
    this.adapter.on('error', e => console.error(e));
    this.adapter.on('ready', () => {
      console.log('Producer is connected');
      this.sendCAP();
    });
    this.adapter.connect();
  }

  private sendCAP() {
    // const avro = avroHelperFactory('./data/cap/cap.avsc', 'driver.eu.alert');
    const payload: ProduceRequest = {
      topic: 'CAP',
      messages: amberAlert
    };
    this.adapter.send(payload, (error, data) => {
      if (error) { console.error(error); }
      if (data) { console.log(data); }
    });
  }
}

new Producer();
