import { ProduceRequest } from 'kafka-node';
import { TestBedAdapter } from '../lib/index';
import * as amberAlert from '../../data/cap/examples/example_amber_alert.json';
import * as earthquakeAlert from '../../data/cap/examples/example_earthquake.json';
import * as thunderstormAlert from '../../data/cap/examples/example_thunderstorm.json';
import * as homelandSecurityAlert from '../../data/cap/examples/example_homeland_security.json';

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
    const payloads: ProduceRequest[] = [{
      topic: 'CAP',
      messages: amberAlert,
      attributes: 1 // Gzip
    }, {
      topic: 'CAP',
      messages: earthquakeAlert,
      attributes: 1 // Gzip
    }, {
      topic: 'CAP',
      messages: thunderstormAlert,
      attributes: 1 // Gzip
    }, {
      topic: 'CAP',
      messages: homelandSecurityAlert,
      attributes: 1 // Gzip
    }];
    // payloads.forEach(payload => {
    //   this.adapter.send(payload, (error, data) => {
    //     if (error) { console.error(error); }
    //     if (data) { console.log(data); }
    //   });
    // });
    this.adapter.send(payloads, (error, data) => {
      if (error) { console.error(error); }
      if (data) { console.log(data); }
    });
  }
}

new Producer();
