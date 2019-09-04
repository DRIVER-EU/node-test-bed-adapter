import * as fs from 'fs';
import * as path from 'path';
import { ITopicsMetadata } from './declarations/kafka-node-ext';
import { KafkaClient, Producer, Consumer, Offset, Message, OffsetFetchRequest, Topic } from 'kafka-node';
import { EventEmitter } from 'events';
import { ISendResponse } from './models/adapter-message';
import {
  IHeartbeat,
  IAdminHeartbeat,
  ITiming,
  ITopicInvite,
  TimeState,
  TimeTopic,
  HeartbeatTopic,
  CoreSubscribeTopics,
  CorePublishTopics,
  AccessInviteTopic,
  AdminHeartbeatTopic,
} from './avro-schemas';
import { IInitializedTopic } from './models/topic';
import { ITestBedOptions } from './models/test-bed-options';
import { SchemaRegistry, SchemaPublisher, IDefaultKey, avroHelperFactory } from './avro';
import { clone, uuid4, isEmptyObject } from './utils/helpers';
import { Logger, FileLogger, KafkaLogger, ConsoleLogger, ILogger } from './logger';
import { IAdapterMessage } from '.';
import { Type } from 'avsc';
import { TimeService } from './services/time-service';
import { LargeFileUploadService } from './services/large-file-upload-service';

/* Override the defined ProduceRequest in kafka-node, as it uses a key: string */
export interface ProduceRequest {
  topic: string;
  messages: any; // string[] | Array<KeyedMessage> | string | KeyedMessage
  key?: any;
  partition?: number;
  attributes?: number;
}

export interface OffsetOutOfRange {
  message: string;
  partition: number;
  stack: string;
  topic: string;
}

export interface TestBedAdapter {
  on(event: 'ready', listener: () => void): this;
  on(event: 'reconnect', listener: () => void): this;
  on(event: 'error', listener: (error: string) => void): this;
  on(event: 'offsetOutOfRange', listener: (error: OffsetOutOfRange) => void): this;
  on(event: 'raw', listener: (message: Message) => void): this;
  on(event: 'message', listener: (message: IAdapterMessage) => void): this;
  on(event: 'time', listener: (message: ITiming) => void): this;
  on(event: 'heartbeat', listener: (message: IAdminHeartbeat) => void): this;
}

export class TestBedAdapter extends EventEmitter {
  public static HeartbeatInterval = 5000;
  public isConnected = false;

  private clientId: string;
  private schemaPublisher: SchemaPublisher;
  private schemaRegistry: SchemaRegistry;
  private largeFileUploadService: LargeFileUploadService;
  private log = Logger.instance;
  private client?: KafkaClient;
  private producer?: Producer;
  private consumer?: Consumer;
  private config: ITestBedOptions;
  /** Map of all initialized topics, i.e. with validators/encoders/decoders */
  private consumerTopics: { [topic: string]: IInitializedTopic } = {};
  private producerTopics: { [topic: string]: IInitializedTopic } = {};
  /** Location of the configuration file */
  private configFile = 'config/test-bed-config.json';
  private callbacks: {
    [topic: string]: (error: string, message: Message) => void;
  } = {};
  private timeService = new TimeService();

  constructor(config?: ITestBedOptions | string) {
    super();

    if (!config) {
      config = this.loadOptionsFromFile();
    } else if (typeof config === 'string') {
      config = this.loadOptionsFromFile(config);
    }
    this.validateOptions(config);
    this.clientId = config.clientId;
    this.config = this.setDefaultOptions(config);
    this.schemaPublisher = new SchemaPublisher(this.config);
    this.schemaRegistry = new SchemaRegistry(this.config);
    this.largeFileUploadService = new LargeFileUploadService(this.config);
  }

  public connect(): Promise<{}> {
    return new Promise(async (resolve, reject) => {
      await this.initLogger();
      await this.schemaPublisher.init();
      this.client = new KafkaClient(this.config);
      this.client.on('ready', async () => {
        await this.initialize();
        resolve();
      });
      this.client.on('error', error => {
        this.emitErrorMsg(error, reject);
      });
      this.client.on('reconnect', () => {
        this.emit('reconnect');
      });
    });
  }

  public disconnect() {
    return new Promise<boolean>((resolve) => {
      if (this.client) {
        this.client.close(() => {
          this.isConnected = false;
          this.client = undefined;
          this.consumer = undefined;
          this.producer = undefined;
          resolve(true);
        });
      } else {
        resolve(false);
      }
    });
  }

  /**
   * A dictionary containing a clone of all the key schemas with key the bare topic name and
   * value the instance of the AVRO schema and schema ID.
   */
  public get keySchemas(): { [topic: string]: { type: Type; srId: number } } {
    return this.schemaRegistry.keySchemas;
  }

  /**
   * A dictionary containing a clone of all the value schemas with key the bare topic name and
   * value the instance of the AVRO schema and schema ID.
   */
  public get valueSchemas(): { [topic: string]: { type: Type; srId: number } } {
    return this.schemaRegistry.valueSchemas;
  }

  public pause() {
    if (!this.consumer) {
      return this.emitErrorMsg('Consumer not ready!');
    }
    this.consumer.pause();
  }

  public resume() {
    if (!this.consumer) {
      return this.emitErrorMsg('Consumer not ready!');
    }
    this.consumer.resume();
  }

  public pauseTopics(topics: string[]) {
    if (!this.consumer) {
      return this.emitErrorMsg('Consumer not ready!');
    }
    this.consumer.pauseTopics(topics);
  }

  public resumeTopics(topics: string[]) {
    if (!this.consumer) {
      return this.emitErrorMsg('Consumer not ready!');
    }
    this.consumer.resumeTopics(topics);
  }

  public close() {
    if (this.client) {
      this.client.close();
    }
  }

  public send(payloads: ProduceRequest | ProduceRequest[], cb: (error?: any, data?: ISendResponse) => any) {
    if (!this.producer) {
      return this.emitErrorMsg('Producer not ready!');
    }
    payloads = payloads instanceof Array ? payloads : [payloads];
    const pl: ProduceRequest[] = [];
    let hasError = false;
    payloads.forEach(payload => {
      if (!this.producerTopics.hasOwnProperty(payload.topic)) {
        return cb(`Topic ${payload.topic} not found: please register first! ${JSON.stringify(payload)}`, undefined);
      }
      const topic = this.producerTopics[payload.topic];
      if (!payload.key || isEmptyObject(payload.key)) {
        payload.key = {
          distributionID: uuid4(),
          senderID: this.config.clientId,
          dateTimeSent: Date.now(),
          dateTimeExpires: 0,
          distributionStatus: 'Test',
          distributionKind: 'Unknown',
        } as IDefaultKey;
      }
      if (topic.isValid(payload.messages) && topic.isKeyValid(payload.key)) {
        if (topic.encodeKey) {
          payload.key = topic.encodeKey(payload.key);
        }
        payload.messages = topic.encode(payload.messages);
        pl.push(payload);
      } else {
        hasError = true;
      }
    });
    if (hasError) {
      return cb('Error validating message', undefined);
    } else {
      this.producer && this.producer.send(pl, cb);
    }
  }

  /**
   * Returns (a clone of) the configuration options.
   */
  public get configuration() {
    return clone(this.config);
  }

  /**
   * Add topics (encoding utf8)
   *
   * @param topics Array of topics to add
   * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
   * @param cb optional callback method to invoke when a message is received
   */
  public addConsumerTopics(
    topics?: OffsetFetchRequest | OffsetFetchRequest[],
    fromOffset = false,
    cb?: (error: string, message: Message) => void
  ) {
    const registerCallback = (topics: string[] | Topic[]) => {
      if (!cb) {
        return;
      }
      (topics as any[])
        .map(t => (typeof t === 'string' ? t : (t as Topic).topic))
        .forEach(t => (this.callbacks[t] = cb));
    };

    return new Promise<OffsetFetchRequest[]>(resolve => {
      if (!topics) {
        return resolve();
      }
      topics = topics instanceof Array ? topics : [topics];
      if (topics.length === 0) {
        return resolve();
      }
      const newTopics = this.initializeConsumerTopics(topics);
      const consumer = this.consumer;
      if (typeof consumer === 'undefined' || newTopics.length === 0) {
        return [];
      }
      let count = 0;
      const addTopics = () => {
        consumer.addTopics(
          newTopics,
          (error, added) => {
            if (error) {
              count === 0
                ? this.log.info(`Initializing topics...`)
                : count <= 3
                ? this.log.info(`Cannot add topics: ${JSON.stringify(newTopics)} \n ${error}`)
                : count > 3;
              process.stderr.write(`addConsumerTopics - Error ${error}. Waiting ${++count * 5} seconds...\r`);
              setTimeout(addTopics, 5000);
              return;
            }
            this.log.info(`\nSubscribed to topic(s): ${added instanceof Array ? added.join(', ') : added}.`);
            registerCallback(added);
            resolve(newTopics);
          },
          fromOffset
        );
      };
      addTopics();
    });
  }

  public addProducerTopics(topics?: string | string[]) {
    return new Promise<string[]>((resolve, reject) => {
      if (!topics || (topics instanceof Array && topics.length === 0)) {
        return resolve([]);
      }
      topics = topics instanceof Array ? topics : [topics];
      const newTopics = this.initializeProducerTopics(topics);
      if (this.producer && newTopics.length > 0) {
        this.producer.createTopics(newTopics, false, (error, _data) => {
          if (error) {
            return this.emitErrorMsg(`addProducerTopics - Error ${error}`, reject);
          }
          resolve(newTopics);
        });
      } else {
        resolve([]);
      }
    });
  }

  /**
   * Load the metadata for all topics (in case of an empty array), or specific ones.
   *
   * @param topics If topics is an empty array, retreive the metadata of all topics
   * @param cb callback function to return the metadata results
   */
  public loadMetadataForTopics(topics: string[], cb: (error?: any, results?: ITopicsMetadata) => void) {
    if (!this.isConnected) {
      cb('Client is not connected');
    }
    (this.client as any).loadMetadataForTopics(topics, (error?: any, results?: ITopicsMetadata) => {
      if (error) {
        cb(error, undefined);
      }
      cb(null, results);
    });
  }

  /**
   * Get the simulation time as UTC Date.
   */
  public get trialTime() {
    return this.timeService.trialTime;
  }

  /**
   * Get the simulation state.
   */
  public get state(): TimeState {
    return this.timeService.state;
  }

  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  public get trialTimeSpeed() {
    return this.timeService.trialTimeSpeed;
  }

  /**
   * Get elapsed time in msec.
   */
  public get timeElapsed() {
    return this.timeService.timeElapsed;
  }

  /**
   * Upload a file to the large file service, if enabled.
   * NOTE: the configuration needs to specify the URL of the large file service, e.g. http://localhost:9090
   */
  public uploadFile(file: string, isPrivate: boolean, cb?: (err?: Error, uploadUrl?: string) => void) {
    this.largeFileUploadService.upload(file, isPrivate, cb);
  }

  // PRIVATE METHODS

  /** After the Kafka client is connected, initialize the other services too, starting with the schema registry. */
  private initialize() {
    return new Promise<void>(async resolve => {
      await this.schemaRegistry.init();
      await this.initProducer();
      await this.addProducerTopics(this.config.produce);
      await this.addKafkaLogger();
      await this.initConsumer();
      await this.addConsumerTopics(this.config.consume, this.config.fromOffset).catch(e => this.log.error(e));
      await this.startHeartbeat();
      await this.emit('ready');
      resolve();
    });
  }

  private initProducer() {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        return this.emitErrorMsg('Client not ready!', reject);
      }
      this.producer = new Producer(this.client);
      this.producer.on('error', error => this.emitErrorMsg(error));
      resolve(); // The producer does not emit the ready event.
    });
  }

  private initLogger() {
    return new Promise(resolve => {
      const loggers: ILogger[] = [];
      const logOptions = this.config.logging;
      if (logOptions) {
        if (logOptions.logToConsole) {
          loggers.push({
            logger: new ConsoleLogger(),
            minLevel: logOptions.logToConsole,
          });
        }
        if (logOptions.logToFile) {
          loggers.push({
            logger: new FileLogger(logOptions.logFile || 'log.txt'),
            minLevel: logOptions.logToFile,
          });
        }
        this.log.initialize(loggers);
      }
      resolve();
    });
  }

  /** If required, add the Kafka logger too (after the producer has been initialised). */
  private addKafkaLogger() {
    return new Promise(resolve => {
      if (!this.producer) {
        return resolve();
      }
      const logOptions = this.config.logging;
      if (logOptions && logOptions.logToKafka) {
        this.log.addLogger({
          logger: new KafkaLogger({
            adapter: this,
            clientId: this.config.clientId,
          }),
          minLevel: logOptions.logToKafka,
        });
      }
      resolve();
    });
  }

  private initConsumer() {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        return this.emitErrorMsg('initConsumer() - Client not ready!', reject);
      }
      this.consumer = new Consumer(this.client, [], {
        encoding: 'buffer',
        keyEncoding: 'buffer',
        autoCommit: true,
        fromOffset: this.config.fromOffset,
      });
      this.consumer.on('message', message => this.handleMessage(message));
      this.consumer.on('error', error => this.emitErrorMsg(error));

      /*
       * If consumer get `offsetOutOfRange` event, fetch data from the smallest(oldest) offset
       */
      const offset = new Offset(this.client);
      this.consumer.on('offsetOutOfRange', topic => {
        this.emit('offsetOutOfRange', topic);
        topic.maxNum = 2;
        if (this.client) {
          offset.fetch([topic], (err, offsets) => {
            if (err) {
              return console.error(err);
            }
            const min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
            if (this.consumer) {
              this.consumer.setOffset(topic.topic, topic.partition, min);
            }
          });
        }
      });
      resolve();
    });
  }

  private handleMessage(message: Message) {
    const { topic, value, key, offset, partition, highWaterOffset } = message;
    if (!value) {
      return;
    }
    if (!this.consumerTopics.hasOwnProperty(topic)) {
      this.emit('raw', message);
    }
    const consumerTopic = this.consumerTopics[topic];
    const decodedValue = consumerTopic.decode
      ? (consumerTopic.decode(message.value as Buffer) as Object | Object[])
      : message.value.toString();
    const decodedKey =
      consumerTopic.decodeKey && (message.key as any) instanceof Buffer
        ? (consumerTopic.decodeKey(message.key as any) as IDefaultKey)
        : key
        ? key
        : '';
    switch (topic) {
      default:
        this.emit('message', {
          topic,
          offset,
          partition,
          highWaterOffset,
          value: decodedValue,
          key: decodedKey,
        } as IAdapterMessage);
        break;
      case TimeTopic:
        const timeMessage = decodedValue as ITiming;
        if (timeMessage) {
          this.timeService.setSimTime(timeMessage);
          this.emit('time', timeMessage);
        } else {
          this.log.warn(`Could not decode topic ${TimeTopic}. Is the schema correct?`);
        }
        break;
      case AccessInviteTopic:
        const invitation = decodedValue as ITopicInvite;
        if (invitation.id.toLowerCase() === this.clientId.toLowerCase()) {
          this.registerTopic(invitation);
        }
        break;
      case AdminHeartbeatTopic:
        const ahb = decodedValue as IAdminHeartbeat;
        // console.log(`Admin heartbeat received`);
        // console.log(JSON.stringify(ahb));
        this.emit('heartbeat', ahb);
        break;
    }
  }

  private async registerTopic(invitation: ITopicInvite) {
    if (invitation.subscribeAllowed && (await this.schemaRegistry.registerNewTopic(invitation.topicName))) {
      this.addConsumerTopics({ topic: invitation.topicName }, false, (err, msg) => {
        if (err) {
          return this.log.error(err);
        }
        this.handleMessage(msg);
      });
    }
    if (invitation.publishAllowed && (await this.schemaRegistry.registerNewTopic(invitation.topicName))) {
      this.addProducerTopics(invitation.topicName);
    }
    console.log(`Invitation received`);
    console.log(JSON.stringify(invitation));
  }

  /**
   * Add the topics to the configuration and initialize the decoders.
   * @param topics topics to add
   */
  private initializeConsumerTopics(topics?: OffsetFetchRequest[]) {
    if (!topics) {
      return [];
    }
    const newTopics: OffsetFetchRequest[] = [];
    topics.forEach(t => {
      if (this.consumerTopics.hasOwnProperty(t.topic)) return;
      if (!this.schemaRegistry.valueSchemas.hasOwnProperty(t.topic)) {
        this.log.error(`initializeConsumerTopics - no schema registered for topic ${t.topic}`);
        return;
      }
      newTopics.push(t);
      if (this.config.consume && this.config.consume.filter(fr => fr.topic === t.topic).length === 0) {
        this.config.consume.push(t);
      }
      const initializedTopic = clone(t) as IInitializedTopic;
      const avro = avroHelperFactory(this.schemaRegistry, t.topic);
      initializedTopic.decode = avro.decode;
      initializedTopic.decodeKey = avro.decodeKey;
      this.consumerTopics[t.topic] = initializedTopic;
    });
    return newTopics;
  }

  /**
   * Add the topics to the configuration and initialize the encoders/validators.
   * @param topics topics to add
   */
  private initializeProducerTopics(topics?: string[]) {
    if (!topics) {
      return [];
    }
    const newTopics: string[] = [];
    topics.forEach(t => {
      if (this.producerTopics.hasOwnProperty(t)) return;
      if (
        !(
          this.schemaRegistry.valueSchemas.hasOwnProperty(t) ||
          this.schemaRegistry.valueSchemas.hasOwnProperty(t + '-value')
        )
      ) {
        this.log.error(`initializeProducerTopics - no schema registered for topic ${t}`);
        return;
      }
      newTopics.push(t);
      if (this.config.produce && this.config.produce.indexOf(t) < 0) {
        this.config.produce.push(t);
      }
      const initializedTopic = { topic: t } as IInitializedTopic;
      const avro = avroHelperFactory(this.schemaRegistry, t);
      initializedTopic.encode = avro.encode;
      initializedTopic.encodeKey = avro.encodeKey;
      initializedTopic.isValid = avro.isValid;
      initializedTopic.isKeyValid = avro.isKeyValid;
      this.producerTopics[t] = initializedTopic;
    });
    return newTopics;
  }

  /**
   * Start transmitting a heartbeat message.
   */
  private startHeartbeat() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        return resolve();
      }
      this.isConnected = true;
      const sendHeartbeat = () => {
        if (!this.isConnected) { return; }
        if (!this.producer) {
          return this.emitErrorMsg('Producer not ready!', reject);
        }
        this.send(
          {
            attributes: 1,
            topic: HeartbeatTopic,
            messages: {
              id: this.config.clientId,
              alive: Date.now(),
            } as IHeartbeat,
          },
          error => {
            if (error) {
              this.log.error(error);
            }
            setTimeout(sendHeartbeat, this.config.heartbeatInterval || 5000);
          }
        );
      };
      sendHeartbeat();
      resolve();
    });
    // });
  }

  /**
   * Set the default options of the configuration.
   * @param options current configuration
   */
  private setDefaultOptions(options: ITestBedOptions) {
    const opt = Object.assign(
      {
        kafkaHost: 'broker:3501',
        schemaRegistry: 'schema_registry:3502',
        clientId: '',
        autoConnect: true,
        wrapUnions: 'auto',
        fromOffset: false,
        heartbeatInterval: TestBedAdapter.HeartbeatInterval,
        consume: [],
        produce: [],
        logging: {},
        maxConnectionRetries: 10,
        autoRegisterDefaultSchemas: true,
        connectTimeout: 5000,
      } as ITestBedOptions,
      options
    );
    if (!opt.consume) {
      opt.consume = [];
    }
    if (!opt.produce) {
      opt.produce = [];
    }
    if (opt.autoRegisterDefaultSchemas) {
      const consumerTopics = opt.consume.map(t => t.topic);
      CoreSubscribeTopics.filter(t => consumerTopics.indexOf(t) < 0).forEach(
        t => opt.consume && opt.consume.push({ topic: t })
      );
      CorePublishTopics(opt.largeFileService ? true : false)
        .filter(t => opt.produce && opt.produce.indexOf(t) < 0)
        .forEach(t => opt.produce && opt.produce.push(t));
    }
    if (!/\/$/.test(opt.schemaRegistry)) {
      opt.schemaRegistry = opt.schemaRegistry + '/';
    }
    return opt;
  }

  /**
   * Validate that all required options are set, or throw an error if not.
   * @param options current configuration
   */
  private validateOptions(options: ITestBedOptions) {
    if (!options.clientId) {
      throw new Error('No clientId specified!');
    }
    if (!options.kafkaHost) {
      throw new Error('No kafkaHost specified!');
    }
    if (!options.schemaRegistry) {
      throw new Error('No schema registry specified!');
    }
    if (!options.schemaRegistry.match(/^http/)) {
      options.schemaRegistry = 'http://' + options.schemaRegistry;
    }
    if (options.heartbeatInterval && options.heartbeatInterval < 0) {
      throw new Error('Heartbeat interval must be positive!');
    }
  }

  /**
   * Load the configuration options from file.
   * @param configFile configuration file path
   */
  private loadOptionsFromFile(configFile = this.configFile) {
    configFile = path.resolve(configFile);
    // this.log(configFile);
    if (fs.existsSync(configFile)) {
      return JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' })) as ITestBedOptions;
    }
    throw new Error(
      `Error loading options! Either supply them as parameter or as a configuration file at ${configFile}.`
    );
  }

  private emitErrorMsg(msg: string, cb?: (msg: string) => void) {
    this.log.error(msg);
    this.emit('error', msg);
    if (cb) {
      cb(msg);
    }
  }
}
