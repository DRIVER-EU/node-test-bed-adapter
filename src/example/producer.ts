import { ProduceRequest, KafkaClient } from 'kafka-node';
import { TestBedAdapter, Logger, LogLevel } from '../lib/index';
import * as amberAlert from '../../data/cap/examples/example_amber_alert.json';
import * as earthquakeAlert from '../../data/cap/examples/example_earthquake.json';
import * as thunderstormAlert from '../../data/cap/examples/example_thunderstorm.json';
import * as homelandSecurityAlert from '../../data/cap/examples/example_homeland_security.json';

const log = Logger.instance;

class Producer {
  private id = 'NodeTestProducer';
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      // kafkaHost: 'localhost:3501',
      // schemaRegistry: 'localhost:3502',
      kafkaHost: 'driver-testbed.eu:3501',
      schemaRegistry: 'driver-testbed.eu:3502',
      clientId: this.id,
      fetchAllSchemas: false,
      fetchAllVersions: false,
      autoRegisterSchemas: true,
      // autoRegisterSchemas: false,
      wrapUnions: 'auto',
      schemaFolder: './data/schemas',
      produce: ['standard_cap'],
      logging: {
        logToConsole: LogLevel.Info,
        logToKafka: LogLevel.Warn
      }
    });
    this.adapter.on('error', e => console.error(e));
    this.adapter.on('ready', () => {
      log.info(`Current simulation time: ${this.adapter.simTime}`);
      log.info('Producer is connected');
      this.sendcap();
    });
    this.adapter.connect();
  }

  private sendcap() {
    const payloads: ProduceRequest[] = [{
      topic: 'standard_cap',
      messages: amberAlert,
      attributes: 1 // Gzip
    }, {
      topic: 'standard_cap',
      messages: earthquakeAlert,
      attributes: 1 // Gzip
    }, {
      topic: 'standard_cap',
      messages: thunderstormAlert,
      attributes: 1 // Gzip
    }, {
      topic: 'standard_cap',
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
      if (error) { log.error(error); }
      if (data) { log.debug(data); }
    });

    // log.error('This is an not an error message, sent only for testing purposes');
    // log.critical('This is an not a critical error message, sent only for testing purposes');

    // const vs = this.adapter.valueSchemas;
    // for (const key in vs) {
    //   if (!vs.hasOwnProperty(key)) { continue; }
    //   const schema = vs[key];
    //   console.log(`Schema for ${key}:`);
    //   console.log(JSON.stringify(schema, null, 2));
    // }
    // this.adapter.send(payloads[0], (error, data) => {
    //   if (error) { console.error(error); }
    //   if (data) { console.log(data); }
    // });
    // this.adapter.send({
    //   key: 15,
    //   topic: 'avrokeytest2',
    //   messages: {
    //     name: 'Erik Vullings'
    //   },
    //   attributes: 1
    // }, (error, data) => {
    //   if (error) { console.error(error); }
    //   if (data) { console.log(data); }
    // });
  }
}

new Producer();
