import { ProduceRequest } from 'kafka-node';
import { TestBedAdapter, Logger, LogLevel } from '../lib/index';
import * as amberAlert from '../../data/cap/examples/example_amber_alert.json';
import * as earthquakeAlert from '../../data/cap/examples/example_earthquake.json';
import * as thunderstormAlert from '../../data/cap/examples/example_thunderstorm.json';
import * as homelandSecurityAlert from '../../data/cap/examples/example_homeland_security.json';

class Producer {
  private id = 'NodeTestProducer';
  private adapter: TestBedAdapter;
  private log = Logger.instance;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'broker:3501',
      schemaRegistry: 'http://schema_registry:3502',
      clientId: this.id,
      produce: [
        { topic: 'cap' },
        { topic: 'avrokeytest2' }
      ],
      logging: {
        logToConsole: LogLevel.Debug
      }
    });
    this.adapter.on('error', e => console.error(e));
    this.adapter.on('ready', () => {
      this.log.info('Producer is connected');
      this.sendcap();
    });
    this.adapter.connect();
  }

  private sendcap() {
    const payloads: ProduceRequest[] = [{
      key: this.id,
      topic: 'cap',
      messages: amberAlert,
      attributes: 1 // Gzip
    }, {
      key: this.id,
      topic: 'cap',
      messages: earthquakeAlert,
      attributes: 1 // Gzip
    }, {
      key: this.id,
      topic: 'cap',
      messages: thunderstormAlert,
      attributes: 1 // Gzip
    }, {
      key: this.id,
      topic: 'cap',
      messages: homelandSecurityAlert,
      attributes: 1 // Gzip
    }];
    // payloads.forEach(payload => {
    //   this.adapter.send(payload, (error, data) => {
    //     if (error) { console.error(error); }
    //     if (data) { console.log(data); }
    //   });
    // });
    // this.adapter.send(payloads, (error, data) => {
    //   if (error) { console.error(error); }
    //   if (data) { console.log(data); }
    // });
    // this.adapter.send(payloads[0], (error, data) => {
    //   if (error) { console.error(error); }
    //   if (data) { console.log(data); }
    // });
    this.adapter.send({
      key: 15,
      topic: 'avrokeytest2',
      messages: {
        name: 'Erik Vullings'
      },
      attributes: 1
    }, (error, data) => {
      if (error) { console.error(error); }
      if (data) { console.log(data); }
    });
  }
}

new Producer();
