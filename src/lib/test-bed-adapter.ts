import * as fs from 'fs';
import * as path from 'path';
import { KafkaClient, Producer, KeyedMessage, Consumer, OffsetFetchRequest } from 'kafka-node';
import { ITestBedOptions } from './models/test-bed-options';
import { EventEmitter } from 'events';
import { clearInterval } from 'timers';

export class TestBedAdapter extends EventEmitter {
  public isConnected = false;
  private client: KafkaClient;
  private producer: Producer;
  private consumer: Consumer;
  private options: ITestBedOptions;
  private heartbeatTopic: string;
  private heartbeatId: NodeJS.Timer;

  private configFile = path.resolve('test-bed-config.json');

  constructor(options?: ITestBedOptions) {
    super();

    if (!options) { options = this.loadOptionsFromFile(); }
    this.validateOptions(options);
    this.options = this.setDefaultOptions(options);
    this.heartbeatTopic = `heartbeat-${this.options.clientId}`;
  }

  public connect() {
    this.client = new KafkaClient(this.options);
    this.client.on('ready', () => {
      this.startHeartbeat();
      this.emit('ready');
    });
    this.client.on('error', (error) => {
      console.error(error);
      this.emit('error', error);
    });
    this.client.on('reconnect', () => {
      this.emit('reconnect');
    });
  }

  public pause() {
    this.consumer.pause();
  }

  public resume() {
    this.consumer.resume();
  }

  public pauseTopics(topics: string[]) {
    this.consumer.pauseTopics(topics);
  }

  public resumeTopics(topics: string[]) {
    this.consumer.resumeTopics(topics);
  }

  public close() {
    clearInterval(this.heartbeatId);
    this.client.close();
  }

  /**
   *
   * @param topics Array of topics to add
   * @param cb Callback
   * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
   */
  public addTopics(topics: string | string[], cb: (error: Error, data: any) => void, fromOffset?: boolean) {
    if (typeof topics === 'string') { topics = [topics]; }
    const offsetFetchRequests = topics.map(t => ({ topic: t } as OffsetFetchRequest));
    if (!this.consumer) {
      this.consumer = new Consumer(this.client, offsetFetchRequests, { encoding: 'utf8' });
      this.consumer.on('message', message => this.emit('message', message));
      this.consumer.on('error', error => this.emit('error', error));
      this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
    } else {
      this.consumer.addTopics(offsetFetchRequests, cb, fromOffset);
    }
  }

  /**
   * Load the metadata for all topics (in case of an empty array), or specific ones.
   * @param topics If topics is an empty array, retreive the metadata of all topics
   * @param cb callback function to return the metadata results
   */
  public loadMetadataForTopics(topics: string[], cb: (error?: any, results?: any) => any) {
    if (!this.isConnected) { cb('Client is not connected'); }
    (this.client as any).loadMetadataForTopics(topics, (error: Error, results?: any) => {
      if (error) {
        return console.error(error);
      }
      console.log(results);
      // console.log('%j', _.get(results, '1.metadata'));
    });
  }

  private startHeartbeat() {
    this.isConnected = true;
    this.producer = new Producer(this.client);
    this.producer.createTopics([this.heartbeatTopic], (error, data) => {
      if (error) { throw new Error(error); }
      console.log(data);
      this.heartbeatId = setInterval(() => {
        this.producer.send([{
          topic: this.heartbeatTopic,
          messages: [
            new KeyedMessage('alive', `${this.options.clientId}`),
            new KeyedMessage('time', new Date().toISOString())
          ]
        }], (error) => {
          if (error) { console.error(error); }
        });
      }, this.options.heartbeatInterval || 5000);
    });
  }

  private setDefaultOptions(options: ITestBedOptions) {
    return Object.assign({
      kafkaHost: '',
      clientId: '',
      autoConnect: true,
      sslOptions: false,
      heartbeatInterval: 5000
    } as ITestBedOptions, options);
  }

  private validateOptions(options: ITestBedOptions) {
    if (!options.clientId) { throw new Error('No clientId specified!'); }
    if (!options.kafkaHost) { throw new Error('No kafkaHost specified!'); }
  }

  private loadOptionsFromFile() {
    if (fs.existsSync(this.configFile)) { return JSON.parse(fs.readFileSync(this.configFile, { encoding: 'utf8' })) as ITestBedOptions; }
    throw new Error(`Error loading options! Either supply them as parameter or as a configuration file at ${this.configFile}.`);
  }
}