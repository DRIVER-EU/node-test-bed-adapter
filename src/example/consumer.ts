// import { TestBedAdapter } from '../lib/index-debug';
import { TestBedAdapter } from '../lib/index';
import { Message } from 'kafka-node';

class Consumer {
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: 'broker:3501',
      clientId: 'Consumer',
      consume: [{
        topic: 'CAP',
        schemaURI: './data/cap/cap.avsc',
        type: 'driver.eu.alert'
      }]
    });
    this.adapter.on('ready', () => {
      this.subscribe();
      console.log('Consumer is connected');
    });
    this.adapter.connect();
  }

  public subscribe() {
    this.adapter.on('message', message => this.handleMessage(message));
    this.adapter.on('error', error => console.error(error));
    this.adapter.on('offsetOutOfRange', error => console.error(error));
    this.adapter.addTopics({ topic: TestBedAdapter.HeartbeatTopic }, err => console.error(err));
  }

  private handleMessage(message: Message) {
    switch (message.topic) {
      default:
        console.log(`Received message on topic ${message.topic} with key ${message.key}: ${message.value}`);
        break;
    }
  }
}

new Consumer();
