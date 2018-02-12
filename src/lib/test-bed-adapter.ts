import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';
import { ITopicsMetadata } from './declarations/kafka-node-ext';
import { clearInterval } from 'timers';
import { FileLogger } from './logger/file-logger';
import { EventEmitter } from 'events';
import { Logger } from './logger/logger';
import { KafkaClient, Producer, Consumer, ProduceRequest, Message, OffsetFetchRequest } from 'kafka-node';
import { IInitializedTopic } from './models/topic';
import { ITestBedOptions } from './models/test-bed-options';
import { SchemaRegistry } from './avro/schema-registry';
import { clone } from './utils/helpers';
import { avroHelperFactory } from './avro/avro-helper-factory';
import { KafkaLogger } from './logger/kafka-logger';
import { ConsoleLogger } from './logger/console-logger';
import { ILogger } from '.';
import { SchemaPublisher } from './avro/schema-publisher';
import { IAvroType } from './declarations/avro';

export class TestBedAdapter extends EventEmitter {
  public static HeartbeatTopic = 'connect-status-heartbeat';
  public static ConfigurationTopic = 'connect-status-configuration';
  public static LogTopic = 'connect-status-log';
  public isConnected = false;

  private schemaPublisher: SchemaPublisher;
  private schemaRegistry: SchemaRegistry;
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

  constructor(config?: ITestBedOptions | string) {
    super();

    if (!config) {
      config = this.loadOptionsFromFile();
    } else if (typeof config === 'string') {
      config = this.loadOptionsFromFile(config);
    }
    this.validateOptions(config);
    this.config = this.setDefaultOptions(config);
    this.schemaPublisher = new SchemaPublisher(this.config);
    this.schemaRegistry = new SchemaRegistry(this.config);
  }

  public connect(): Promise<{}> {
    return new Promise((resolve, reject) => {
      this.initLogger()
        .then(() => {
          return this.schemaPublisher.init();
        })
        .then(() => {
          this.client = new KafkaClient(this.config);
          this.client.on('ready', () => {
            this.initialize();
          });
          this.client.on('error', (error) => {
            this.emitErrorMsg(error);
          });
          this.client.on('reconnect', () => {
            this.emit('reconnect');
          });
          resolve();
        })
        .catch((err) => {
          this.emitErrorMsg(`Error initializing test-bed-adapter: ${err}`, reject);
        });
    });
  }

  /**
   * A dictionary containing a clone of all the key schemas with key the bare topic name and
   * value the instance of the AVRO schema and schema ID.
   */
  public get keySchemas(): { [topic: string]: { type: IAvroType; srId: number } } {
    return clone(this.schemaRegistry.keySchemas);
  }

  /**
   * A dictionary containing a clone of all the value schemas with key the bare topic name and
   * value the instance of the AVRO schema and schema ID.
   */
  public get valueSchemas(): { [topic: string]: { type: IAvroType; srId: number } } {
    return clone(this.schemaRegistry.valueSchemas);
  }

  /** After the Kafka client is connected, initialize the other services too, starting with the schema registry. */
  private initialize() {
    this.schemaRegistry
      .init()
      .then(() => this.initProducer())
      .then(() => this.addKafkaLogger())
      .then(() => this.startHeartbeat())
      .then(() => this.addProducerTopics(this.config.produce))
      .then(() => this.initConsumer())
      .then(() => this.addConsumerTopics(this.config.consume))
      .then(() => this.configUpdated())
      .then(() => this.emit('ready'))
      .catch((err) => this.emitErrorMsg(err));
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
    if (this.heartbeatId) {
      clearInterval(this.heartbeatId);
    }
    if (!this.client) {
      return;
    }
    this.client.close();
  }

  public send(payloads: ProduceRequest | ProduceRequest[], cb: (error: any, data: any) => any) {
    if (!this.producer) {
      return this.emitErrorMsg('Producer not ready!');
    }
    payloads = payloads instanceof Array ? payloads : [ payloads ];
    const pl: ProduceRequest[] = [];
    payloads.forEach((payload) => {
      if (!this.producerTopics.hasOwnProperty(payload.topic)) {
        return cb(`Topic not found: please register first!`, null);
      }
      const topic = this.producerTopics[payload.topic];
      if (!payload.key) {
        payload.key = {
          distributionID: this.config.clientId + '-1',
          senderID: this.config.clientId,
          dateTimeSent: 0,
          dateTimeExpires: 0,
          distributionStatus: 'Test',
          distributionKind: 'Report'
        };
      }
      if (topic.isValid(payload.messages) && topic.isKeyValid(payload.key)) {
        if (topic.encodeKey) {
          payload.key = topic.encodeKey(payload.key);
        }
        payload.messages = topic.encode(payload.messages);
        pl.push(payload);
      }
    });
    this.producer.send(pl, cb);
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
   */
  public addConsumerTopics(topics?: OffsetFetchRequest | OffsetFetchRequest[]) {
    return new Promise<OffsetFetchRequest[]>((resolve, reject) => {
      if (!topics) {
        return resolve();
      }
      topics = topics instanceof Array ? topics : [ topics ];
      if (topics.length === 0) {
        return resolve();
      }
      const newTopics = this.initializeConsumerTopics(topics);
      if (this.consumer && newTopics.length > 0) {
        this.consumer.addTopics(newTopics, (error, added) => {
          if (error) {
            return this.emitErrorMsg(`addProducerTopics - Error ${error}`, reject);
          }
          this.log.info(`Added topics: ${added}`);
          resolve(newTopics);
        });
      }
    });
  }

  public addProducerTopics(topics?: string | string[]) {
    return new Promise<string[]>((resolve, reject) => {
      if (!topics) {
        return resolve();
      }
      topics = topics instanceof Array ? topics : [ topics ];
      if (topics.length === 0) {
        return resolve();
      }
      const newTopics = this.initializeProducerTopics(topics);
      if (this.producer && newTopics.length > 0) {
        this.producer.createTopics(newTopics, true, (error, _data) => {
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

  // PRIVATE METHODS

  private initProducer() {
    return new Promise((resolve) => {
      if (!this.client) {
        return this.emitErrorMsg('Client not ready!');
      }
      this.producer = new Producer(this.client);
      this.producer.on('error', (error) => this.emitErrorMsg(error));
      resolve();
    });
  }

  private initLogger() {
    return new Promise((resolve) => {
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
        this.log.initialize(loggers);
      }
      resolve();
    });
  }

  /** If required, add the Kafka logger too (after the producer has been initialised). */
  private addKafkaLogger() {
    return new Promise((resolve) => {
      if (!this.producer) {
        return resolve();
      }
      const logOptions = this.config.logging;
      if (logOptions && logOptions.logToKafka) {
        this.log.addLogger({
          logger: new KafkaLogger({
            producer: this.producer,
            clientId: this.config.clientId
          }),
          minLevel: logOptions.logToKafka
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
      this.consumer = new Consumer(this.client, [], { encoding: 'buffer', autoCommit: true });
      this.consumer.on('message', (message) => this.handleMessage(message));
      this.consumer.on('error', (error) => this.emitErrorMsg(error));
      this.consumer.on('offsetOutOfRange', (error) => this.emit('offsetOutOfRange', error));
      resolve();
    });
  }

  private handleMessage(message: Message) {
    const { topic, value } = message;
    if (!value) {
      return;
    }
    if (this.consumerTopics.hasOwnProperty(topic)) {
      const consumerTopic = this.consumerTopics[topic];
      if (consumerTopic.decode) {
        message.value = consumerTopic.decode(message.value as any) as any;
        if (consumerTopic.decodeKey && (message.key as any) instanceof Buffer) {
          message.key = consumerTopic.decodeKey(message.key as any) as any;
        }
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
  private initializeConsumerTopics(topics?: OffsetFetchRequest[]) {
    if (!topics) {
      return [];
    }
    let isConfigUpdated = false;
    const newTopics: OffsetFetchRequest[] = [];
    topics.forEach((t) => {
      if (this.consumerTopics.hasOwnProperty(t.topic)) return;
      if (!this.schemaRegistry.valueSchemas.hasOwnProperty(t.topic)) {
        this.log.error(`initializeConsumerTopics - no schema registered for topic ${t.topic}`);
        return;
      }
      newTopics.push(t);
      if (this.config.consume && this.config.consume.filter((fr) => fr.topic === t.topic).length === 0) {
        isConfigUpdated = true;
        this.config.consume.push(t);
      }
      const initializedTopic = clone(t) as IInitializedTopic;
      const avro = avroHelperFactory(this.schemaRegistry, t.topic);
      initializedTopic.decode = avro.decode;
      initializedTopic.decodeKey = avro.decodeKey;
      this.consumerTopics[t.topic] = initializedTopic;
    });
    if (isConfigUpdated) {
      this.configUpdated();
    }
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
    let isConfigUpdated = false;
    const newTopics: string[] = [];
    topics.forEach((t) => {
      if (this.producerTopics.hasOwnProperty(t)) return;
      if (!this.schemaRegistry.valueSchemas.hasOwnProperty(t)) {
        this.log.error(`initializeProducerTopics - no schema registered for topic ${t}`);
        return;
      }
      newTopics.push(t);
      if (this.config.produce && this.config.produce.indexOf(t) < 0) {
        isConfigUpdated = true;
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
    if (isConfigUpdated) {
      this.configUpdated();
    }
    return newTopics;
  }

  /**
   * Configuration has changed.
   */
  private configUpdated() {
    return new Promise<void>((resolve, reject) => {
      if (!this.producer) {
        return;
      }
      this.send(
        [
          {
            topic: TestBedAdapter.ConfigurationTopic,
            messages: this.config
          }
        ],
        (err, result) => {
          if (err) {
            this.emitErrorMsg('Producer not ready!', reject);
          }
          if (result) {
            this.log.info(result);
          }
          resolve();
        }
      );
    });
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
      this.heartbeatId = setInterval(() => {
        if (!this.producer) {
          return this.emitErrorMsg('Producer not ready!', reject);
        }
        this.send(
          {
            attributes: 1,
            topic: TestBedAdapter.HeartbeatTopic,
            messages: [ { id: this.config.clientId, alive: new Date().toISOString() } ]
          },
          (error) => {
            if (error) {
              this.log.error(error);
            }
          }
        );
      }, this.config.heartbeatInterval || 5000);
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
        sslOptions: false,
        heartbeatInterval: 5000,
        consume: [],
        produce: [],
        logging: {},
        maxConnectionRetries: 10,
        connectTimeout: 5
      } as ITestBedOptions,
      options
    );
    if (opt.produce && opt.produce.indexOf(TestBedAdapter.HeartbeatTopic) < 0) {
      opt.produce.push(TestBedAdapter.HeartbeatTopic);
    }
    if (opt.produce && opt.produce.indexOf(TestBedAdapter.ConfigurationTopic) < 0) {
      opt.produce.push(TestBedAdapter.ConfigurationTopic);
    }
    if (opt.produce && opt.produce.indexOf(TestBedAdapter.LogTopic) < 0 && opt.logging && opt.logging.logToKafka) {
      opt.produce.push(TestBedAdapter.LogTopic);
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
