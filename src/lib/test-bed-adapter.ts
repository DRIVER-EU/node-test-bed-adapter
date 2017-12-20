import * as fs from 'fs';
import * as path from 'path';
import { FileLogger } from './logger/file-logger';
import { EventEmitter } from 'events';
import { LogLevel } from './logger/log-levels';
import { Logger } from './logger/logger';
import { KafkaClient, Producer, KeyedMessage, Consumer, ProduceRequest, Message } from 'kafka-node';
import { ITopic, IInitializedTopic } from './models/topic';
import { ITestBedOptions } from './models/test-bed-options';
import { clearInterval } from 'timers';
import { clone } from './utils/helpers';
import { avroHelperFactory } from './avro/avro-helper-factory';
import { KafkaLogger } from './logger/kafka-logger';
import { ConsoleLogger } from './logger/console-logger';
import { ILogger } from '.';

export class TestBedAdapter extends EventEmitter {
  public static HeartbeatTopic = 'heartbeat';
  public isConnected = false;

  private log = Logger.instance;
  private client?: KafkaClient;
  private producer?: Producer;
  private consumer?: Consumer;
  private config: ITestBedOptions;
  private heartbeatId?: NodeJS.Timer;
  /** Map of all initialized topics, i.e. with validators/encoders/decoders */
  private consumerTopics: { [topic: string]: IInitializedTopic } = {};
  private producerTopics: { [topic: string]: IInitializedTopic } = {};
  /** Location of the configuration file */
  private configFile = 'config/test-bed-config.json';
  private defaultCallback = (error: Error, data: any) => {
    if (error) { this.log.error(error.message); }
    if (data) { this.log.info(data); }
  };

  constructor(config?: ITestBedOptions | string) {
    super();

    if (!config) {
      config = this.loadOptionsFromFile();
    } else if (typeof config === 'string') {
      config = this.loadOptionsFromFile(config);
    }
    this.validateOptions(config);
    this.config = this.setDefaultOptions(config);
  }

  public connect() {
    this.client = new KafkaClient(this.config);
    this.initProducer();
    this.client.on('ready', () => {
      if (this.config.consume && this.config.consume.length > 0) { this.addTopics(this.config.consume, this.defaultCallback); }
    });
    this.client.on('error', (error) => {
      this.log.error(error);
      this.emit('error', error);
    });
    this.client.on('reconnect', () => {
      this.emit('reconnect');
    });
  }

  public pause() {
    if (!this.consumer) { this.emit('error', 'Consumer not ready!'); return; }
    this.consumer.pause();
  }

  public resume() {
    if (!this.consumer) { this.emit('error', 'Consumer not ready!'); return; }
    this.consumer.resume();
  }

  public pauseTopics(topics: string[]) {
    if (!this.consumer) { this.emit('error', 'Consumer not ready!'); return; }
    this.consumer.pauseTopics(topics);
  }

  public resumeTopics(topics: string[]) {
    if (!this.consumer) { this.emit('error', 'Consumer not ready!'); return; }
    this.consumer.resumeTopics(topics);
  }

  public close() {
    if (this.heartbeatId) { clearInterval(this.heartbeatId); }
    if (!this.client) { return; }
    this.client.close();
  }

  public send(payloads: ProduceRequest | ProduceRequest[], cb: (error: any, data: any) => any) {
    if (!this.producer) { this.emit('error', 'Producer not ready!'); return; }
    payloads = payloads instanceof Array ? payloads : [payloads];
    const pl: ProduceRequest[] = [];
    payloads.forEach(payload => {
      if (!this.producerTopics.hasOwnProperty(payload.topic)) { return cb(`Topic not found: please register first!`, null); };
      const topic = this.producerTopics[payload.topic];
      if (topic.isValid && topic.isValid(payload.messages)) {
        if (topic.encode) { payload.messages = topic.encode(payload.messages); }
        pl.push(payload);
      }
    });
    this.producer.send(pl, cb);
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
    if (!this.consumer) { this.initConsumer(topics); }
    if (!this.consumer) { this.emit('error', 'Consumer not ready!'); return; }
    this.consumer.addTopics(topics, cb, fromOffset);
  }

  public addProducerTopics(topics: ITopic | ITopic[], cb: (error: Error, data: any) => void) {
    if (!(topics instanceof Array)) { topics = [topics]; }
    this.initializeProducerTopics(topics);
    if (!this.producer) { this.emit('error', 'Producer not ready!'); return; }
    this.producer.createTopics(topics.map(t => t.topic), true, cb);
  }

  /**
   * Load the metadata for all topics (in case of an empty array), or specific ones.
   * @param topics If topics is an empty array, retreive the metadata of all topics
   * @param cb callback function to return the metadata results
   */
  public loadMetadataForTopics(topics: string[], cb: (error?: any, results?: any) => any) {
    if (!this.isConnected) { cb('Client is not connected'); }
    (this.client as any).loadMetadataForTopics(topics, (error: any, results?: any) => {
      if (error) {
        return this.log.error(error);
      }
      this.log.info(results);
      // this.log('%j', _.get(results, '1.metadata'));
    });
  }

  // PRIVATE METHODS

  private initProducer() {
    if (!this.client) { this.emit('error', 'Client not ready!'); return; }
    this.producer = new Producer(this.client);
    this.producer.on('ready', () => {
      this.initLogger();
      this.startHeartbeat();
      if (this.config.produce && this.config.produce.length > 0) { this.addProducerTopics(this.config.produce, this.defaultCallback); }
      this.emit('ready');
    });
    this.producer.on('error', error => this.emit('error', error));
  }

  private initLogger() {
    if (!this.producer) { return; }
    const loggers: ILogger[] = [];
    const logOptions = this.config.logging;
    if (logOptions) {
      if (logOptions.logToConsole) {
        loggers.push({
          logger: new ConsoleLogger(),
          minLevel: logOptions.logToConsole
        });
      }
      if (logOptions.logToFile) {
        loggers.push({
          logger: new FileLogger(logOptions.logFile || 'log.txt'),
          minLevel: logOptions.logToFile
        });
      }
      if (logOptions.logToKafka) {
        loggers.push({
          logger: new KafkaLogger({
            producer: this.producer,
            clientId: this.config.clientId
          }),
          minLevel: logOptions.logToKafka
        });
      }
    }
    this.log.initialize(loggers);
  }

  private initConsumer(topics: ITopic[]) {
    if (!this.client) { this.emit('error', 'Client not ready!'); return; }
    this.consumer = new Consumer(this.client, topics, { encoding: 'buffer', autoCommit: true });
    this.consumer.on('message', message => this.handleMessage(message));
    this.consumer.on('error', error => this.emit('error', error));
    this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
  }

  private handleMessage(message: Message) {
    const { topic } = message;
    if (this.consumerTopics.hasOwnProperty(topic)) {
      const consumerTopic = this.consumerTopics[topic];
      if (consumerTopic.decode) {
        const buf = new Buffer(message.value, 'binary');
        message.value = consumerTopic.decode(buf) as any;
      } else {
        message.value = message.value.toString(); // decode buffer to string for normal messages
      }
    }
    this.emit('message', message);
  }

  /**
   * Add the topics to the configuration and initialize the decoders.
   * @param topics topics to add
   */
  private initializeConsumerTopics(topics?: ITopic[]) {
    if (!topics) { return; }
    topics.forEach(t => {
      if (this.consumerTopics.hasOwnProperty(t.topic)) return;
      if (this.config.consume && this.config.consume.indexOf(t) < 0) { this.config.consume.push(t); }
      const initializedTopic = clone(t) as IInitializedTopic;
      if (t.schemaURI) {
        const ext = path.extname(t.schemaURI).toLowerCase();
        switch (ext) {
          case '.avsc':
            const avro = avroHelperFactory(t.schemaURI, t.type);
            initializedTopic.decode = avro.decode;
            // initializedTopic.decode = avro.toString;
            break;
          default:
            this.log.error(`Unknown schema type: ${t.schemaURI}. Ignoring.`);
            break;
        }
      }
      this.consumerTopics[t.topic] = initializedTopic;
    });
    this.configUpdated();
  }

  /**
   * Add the topics to the configuration and initialize the encoders/validators.
   * @param topics topics to add
   */
  private initializeProducerTopics(topics?: ITopic[]) {
    if (!topics) { return; }
    topics.forEach(t => {
      if (this.consumerTopics.hasOwnProperty(t.topic)) return;
      if (this.config.produce && this.config.produce.indexOf(t) < 0) { this.config.produce.push(t); }
      const initializedTopic = clone(t) as IInitializedTopic;
      if (t.schemaURI) {
        const ext = path.extname(t.schemaURI).toLowerCase();
        switch (ext) {
          case '.avsc':
            const avro = avroHelperFactory(t.schemaURI, t.type);
            initializedTopic.encode = avro.encode;
            initializedTopic.isValid = avro.isValid;
            break;
          default:
            this.log.error(`Unknown schema type: ${t.schemaURI}. Ignoring.`);
            break;
        }
      }
      this.producerTopics[t.topic] = initializedTopic;
    });
    this.configUpdated();
  }

  /**
   * Configuration has changed.
   */
  private configUpdated() {
    // TODO Send an update that the configuration has changed
  }

  /**
   * Start transmitting a heartbeat message.
   */
  private startHeartbeat() {
    this.isConnected = true;
    this.addProducerTopics({ topic: TestBedAdapter.HeartbeatTopic }, (error, data) => {
      if (error) { throw error; }
      this.log.info(data);
      if (this.config.produce) { this.config.produce.push({ topic: TestBedAdapter.HeartbeatTopic }); }
      this.heartbeatId = setInterval(() => {
        if (!this.producer) { this.emit('error', 'Producer not ready!'); return; }
        this.producer.send([{
          topic: TestBedAdapter.HeartbeatTopic,
          messages: new KeyedMessage(`${this.config.clientId}`, new Date().toISOString())
        }], (error) => {
          if (error) { this.log.error(error); }
        });
      }, this.config.heartbeatInterval || 5000);
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
      produce: [],
      logging: {}
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
    // this.log(configFile);
    if (fs.existsSync(configFile)) { return JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' })) as ITestBedOptions; }
    throw new Error(`Error loading options! Either supply them as parameter or as a configuration file at ${configFile}.`);
  }
}
