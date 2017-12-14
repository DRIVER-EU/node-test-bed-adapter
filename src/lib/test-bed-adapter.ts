import * as fs from 'fs';
import * as path from 'path';
import { KafkaClient, Producer, KeyedMessage, Consumer, ProduceRequest } from 'kafka-node';
import { ITopic, IInitializedTopic } from './models/topic';
import { ITestBedOptions } from './models/test-bed-options';
import { EventEmitter } from 'events';
import { clearInterval } from 'timers';
import { clone } from './utils/helpers';

export class TestBedAdapter extends EventEmitter {
  public isConnected = false;

  private client: KafkaClient;
  private producer: Producer;
  private consumer: Consumer;
  private binaryConsumer: Consumer;
  private config: ITestBedOptions;
  private heartbeatTopic: string;
  private heartbeatId: NodeJS.Timer;
  /** Map of all initialized topics, i.e. with validators/encoders/decoders */
  private consumerTopics: { [topic: string]: IInitializedTopic } = {};
  private producerTopics: { [topic: string]: IInitializedTopic } = {};
  /** Location of the configuration file */
  private configFile = 'config/test-bed-config.json';

  constructor(config?: ITestBedOptions | string) {
    super();

    if (!config) {
      config = this.loadOptionsFromFile();
    } else if (typeof config === 'string') {
      config = this.loadOptionsFromFile(config);
    }
    this.validateOptions(config);
    this.config = this.setDefaultOptions(config);
    if (this.config.consume) { this.initializeConsumerTopics(this.config.consume); }
    this.heartbeatTopic = `heartbeat-${this.config.clientId}`;
  }

  public connect() {
    this.client = new KafkaClient(this.config);
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

  public send(payloads: ProduceRequest[], cb: (error: any, data: any) => any) {
    payloads.forEach(payload => {
      if (this.producerTopics.hasOwnProperty(payload.topic)) { this.initializeProducerTopic(payload); };
    });
    this.producer.send(payloads, cb);
  }

  /**
   * Returns (a clone of) the configuration options.
   */
  public get configuration(): ITestBedOptions { return clone(this.config); }

  /**
   * Add topics (encoding utf8)
   *
   * @param topics Array of topics to add
   * @param cb Callback
   * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
   */
  public addTopics(topics: ITopic[] | ITopic, cb: (error: Error, data: any) => void, fromOffset?: boolean) {
    if (!(topics instanceof Array)) { topics = [topics]; }
    this.initializeConsumerTopics(topics);
    if (!this.consumer) {
      this.consumer = new Consumer(this.client, topics, { encoding: 'utf8' });
      this.consumer.on('message', message => this.emit('message', message));
      this.consumer.on('error', error => this.emit('error', error));
      this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
    } else {
      this.consumer.addTopics(topics, cb, fromOffset);
    }
  }

  /**
   * Add topics (encoding Buffer)
   *
   * @param topics Array of topics to add
   * @param cb Callback
   * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
   */
  public addBinaryTopics(topics: ITopic[] | ITopic, cb: (error: Error, data: any) => void, fromOffset?: boolean) {
    if (!(topics instanceof Array)) { topics = [topics]; }
    this.initializeConsumerTopics(topics);
    if (!this.binaryConsumer) {
      this.binaryConsumer = new Consumer(this.client, topics, { encoding: 'buffer' });
      this.binaryConsumer.on('message', message => this.emit('message', message));
      this.binaryConsumer.on('error', error => this.emit('error', error));
      this.binaryConsumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
    } else {
      this.binaryConsumer.addTopics(topics, cb, fromOffset);
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

  /**
   * Add the topics to the configuration and initialize the decoders.
   * @param topics topics to add
   */
  private initializeConsumerTopics(topics: ITopic[]) {
    if (!this.config.consume) { return; }
    topics.forEach(t => {
      if (this.consumerTopics.hasOwnProperty(t.topic)) return;
      const initializedTopic = clone(t) as IInitializedTopic;
      // TODO Initialize decoder, e.g. for AVRO messages.
      this.consumerTopics[t.topic] = initializedTopic;
    });
    this.config.consume.push(...topics);
  }

  /**
   * Add the topics to the configuration and initialize the encoders/validators.
   * @param topics topics to add
   */
  private initializeProducerTopic(pr: ProduceRequest) {
    if (!this.config.produce) { return; }
    const initializedTopic = { topic: pr.topic, partition: pr.partition } as IInitializedTopic;
    // TODO Initialize encoder en validator, e.g. for AVRO messages.
    this.consumerTopics[pr.topic] = initializedTopic;
    this.config.produce.push(initializedTopic);
  }

  /**
   * Start transmitting a heartbeat message.
   */
  private startHeartbeat() {
    this.isConnected = true;
    this.producer = new Producer(this.client);
    this.producer.on('ready', () => {
      this.producer.createTopics([this.heartbeatTopic], (error, data) => {
        if (error) { throw new Error(error); }
        console.log(data);
        if (this.config.produce) { this.config.produce.push({ topic: this.heartbeatTopic }); }
        this.heartbeatId = setInterval(() => {
          this.producer.send([{
            topic: this.heartbeatTopic,
            messages: [
              new KeyedMessage('alive', `${this.config.clientId}`),
              new KeyedMessage('time', new Date().toISOString())
            ]
          }], (error) => {
            if (error) { console.error(error); }
          });
        }, this.config.heartbeatInterval || 5000);
      });
    });
  }

  /**
   * Set the default options of the configuration.
   * @param options current configuration
   */
  private setDefaultOptions(options: ITestBedOptions) {
    return Object.assign({
      kafkaHost: '',
      clientId: '',
      autoConnect: true,
      sslOptions: false,
      heartbeatInterval: 5000,
      consume: [],
      produce: []
    } as ITestBedOptions, options);
  }

  /**
   * Validate that all required options are set, or throw an error if not.
   * @param options current configuration
   */
  private validateOptions(options: ITestBedOptions) {
    if (!options.clientId) { throw new Error('No clientId specified!'); }
    if (!options.kafkaHost) { throw new Error('No kafkaHost specified!'); }
    if (options.heartbeatInterval && options.heartbeatInterval < 0) { throw new Error('Heartbeat interval must be positive!'); }
  }

  /**
   * Load the configuration options from file.
   * @param configFile configuration file path
   */
  private loadOptionsFromFile(configFile = this.configFile) {
    configFile = path.resolve(configFile);
    // console.log(configFile);
    if (fs.existsSync(configFile)) { return JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' })) as ITestBedOptions; }
    throw new Error(`Error loading options! Either supply them as parameter or as a configuration file at ${configFile}.`);
  }
}
