import * as fs from 'fs';
import * as path from 'path';
import {
  Kafka,
  Producer,
  Message,
  Consumer,
  RecordMetadata,
  ITopicConfig,
  EachMessagePayload,
  KafkaConfig,
  ITopicMetadata,
  Partitioners,
} from 'kafkajs';
import { EventEmitter } from 'events';
import {
  IInitializedTopic,
  ITestBedOptions,
  AvroMessage,
  AdapterProducerRecord,
  AdapterMessage,
} from './models/index.mjs';
import {
  SchemaRegistry,
  SchemaPublisher,
  avroHelperFactory,
  CorePublishTopics,
  AccessRemoveTopic,
  TimeTopic,
  AccessInviteTopic,
  AdminHeartbeatTopic,
  HeartbeatTopic,
  CoreSubscribeTopics,
} from './avro/index.mjs';
import { clone, uuid4 } from './utils/index.mjs';
import {
  Logger,
  FileLogger,
  KafkaLogger,
  ConsoleLogger,
  ILogger,
} from './logger/index.mjs';
import { Type } from 'avsc';
import {
  LargeFileUploadService,
  TimeService,
  computerInfo,
} from './services/index.mjs';
import {
  IAdminHeartbeat,
  TimeState,
  ITopicInvite,
  IHeartbeat,
  ITimeManagement,
  ITopicRemove,
} from 'test-bed-schemas';

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
  on(
    event: 'offsetOutOfRange',
    listener: (error: OffsetOutOfRange) => void
  ): this;
  on(event: 'raw', listener: (message: Message) => void): this;
  on(event: 'message', listener: (message: AdapterMessage) => void): this;
  on(event: 'time', listener: (message: ITimeManagement) => void): this;
  on(event: 'heartbeat', listener: (message: IAdminHeartbeat) => void): this;
}

export class TestBedAdapter extends EventEmitter {
  public static HeartbeatInterval = 5000;
  public isConnected = false;

  private groupId: string;
  private schemaPublisher: SchemaPublisher;
  private schemaRegistry: SchemaRegistry;
  private largeFileUploadService: LargeFileUploadService;
  private log = Logger.instance;
  private client?: Kafka;
  private producer?: Producer;
  private consumer?: Consumer;
  private config: ITestBedOptions & KafkaConfig;
  /** Map of all initialized topics, i.e. with validators/encoders/decoders */
  private consumerTopics: { [topic: string]: IInitializedTopic } = {};
  private producerTopics: { [topic: string]: IInitializedTopic } = {};
  /** Location of the configuration file */
  private configFile = 'config/test-bed-config.json';
  private callbacks: {
    [topic: string]: (error: string, message: Message) => void;
  } = {};
  private timeService = new TimeService();
  private origin?: string;

  constructor(config?: ITestBedOptions | string) {
    super();

    if (!config) {
      config = this.loadOptionsFromFile();
    } else if (typeof config === 'string') {
      config = this.loadOptionsFromFile(config);
    }
    this.validateOptions(config);
    this.groupId = config.groupId || config.clientId || '';
    this.config = this.setDefaultOptions(config);
    this.schemaPublisher = new SchemaPublisher(this.config);
    this.schemaRegistry = new SchemaRegistry(this.config);
    this.largeFileUploadService = new LargeFileUploadService(this.config);
    computerInfo(config.externalIP, (info, err) => {
      if (err) {
        return console.error(err);
      }
      this.origin = JSON.stringify(info);
    });
  }

  public async connect() {
    try {
      await this.initLogger();
      await this.schemaPublisher.init();
    } catch (e) {
      this.emitErrorMsg(
        `Error before initializing the testbed connection: ${e}`
      );
    }
    this.client = new Kafka(this.config);
    await this.initialize();
  }

  public disconnect() {
    this.consumer?.disconnect();
    this.producer?.disconnect();
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
    const topics = Object.keys(this.consumerTopics).map((topic) => ({ topic }));
    this.consumer.pause(topics);
  }

  public resume() {
    if (!this.consumer) {
      return this.emitErrorMsg('Consumer not ready!');
    }
    const topics = Object.keys(this.consumerTopics).map((topic) => ({ topic }));
    this.consumer.resume(topics);
  }

  /** Deprecated: use disconnect */
  public close() {
    this.disconnect();
  }

  public async send(
    payload: AdapterProducerRecord,
    cb: (error?: any, data?: RecordMetadata[]) => any
  ) {
    const keyFactory = () => ({
      distributionID: uuid4(),
      senderID: this.config.clientId || this.config.groupId,
      dateTimeSent: Date.now(),
      dateTimeExpires: 0,
      distributionStatus: 'Exercise',
      distributionKind: 'Unknown',
    });

    if (!this.producer) {
      return this.emitErrorMsg('Producer not ready!');
    }
    const topic = this.producerTopics[payload.topic];
    if (!topic) {
      return cb(
        `Topic ${
          payload.topic
        } not found: please register first! ${JSON.stringify(payload)}`,
        undefined
      );
    }
    const key = topic.encodeKey(keyFactory());

    const plMessages = payload.messages.map((m) => ({
      ...m,
      key: m.key || key,
    }));
    if (topic.isValid(plMessages)) {
      const messages = plMessages.map((message) => topic.encode(message));
      const recordMetadata =
        this.producer &&
        (await this.producer.send({ ...payload, messages }).catch((e) => {
          cb(JSON.stringify(e));
        }));
      recordMetadata && cb(undefined, recordMetadata);
    } else {
      return cb('Error validating message', undefined);
    }
  }

  /**
   * Returns (a clone of) the configuration options.
   */
  public get configuration() {
    return clone(this.config);
  }

  /**
   * Create topics by requesting their metadata.
   * It only works when `auto.create.topics.enable = true`.
   */
  public async createTopics(topics: ITopicConfig[]) {
    if (!this.client) {
      return false;
    }
    const admin = this.client.admin();
    await admin.connect();
    const metadata = await admin.fetchTopicMetadata({
      topics: topics.map((t) => t.topic),
    });
    const existingTopics = metadata.topics.map((md) => md.name);
    const newTopics = topics.filter((t) => existingTopics.indexOf(t.topic) < 0);
    if (newTopics.length === 0) {
      return true;
    }
    const success = await admin.createTopics({ topics: newTopics });
    if (!success) {
      console.warn(
        `Could not create the following topics: ${JSON.stringify(topics)}`
      );
    }
    await admin.disconnect();
    return success;
  }

  /**
   * Add topics (encoding utf8)
   *
   * @param topics Array of topics to add
   */
  public async addConsumerTopics(topics?: string | string[]) {
    if (!topics || topics.length === 0 || !this.consumer) {
      return;
    }
    const myTopics = topics instanceof Array ? topics : [...topics];

    const newTopics = this.initializeConsumerTopics(myTopics);

    const consumer = this.consumer;

    const run = async () => {
      await consumer.connect();
      await consumer.subscribe({
        topics: newTopics,
        fromBeginning: this.config.fromOffset === 'earliest',
      });
      await consumer.run({
        eachMessage: async (message) => this.handleMessage(message),
      });
    };
    run().catch((e) => {
      console.error(e);
    });
  }

  public async addProducerTopics(topics?: string | string[]) {
    if (!topics || topics.length === 0) {
      return;
    }
    const newTopics = await this.initializeProducerTopics(
      typeof topics === 'string' ? [topics] : topics
    );

    await this.createTopics(
      newTopics.map((topic) => ({
        topic,
        numPartitions: this.config.partitions,
      }))
    );
  }

  /**
   * Load the metadata for all topics (in case of an empty array), or specific ones.
   *
   * @param topics If topics is an empty array, retreive the metadata of all topics
   * @param cb callback function to return the metadata results
   */
  public async loadMetadataForTopics(
    topics: string[],
    cb: (error?: any, results?: ITopicMetadata[]) => void
  ) {
    if (!this.client || !this.isConnected) {
      cb('Client is not connected');
      return;
    }
    const admin = this.client.admin();
    await admin.connect();
    const metadata = await admin.fetchTopicMetadata({ topics });
    await admin.disconnect();
    cb(undefined, metadata.topics);
  }

  /**
   * Get the simulation time as UTC Date.
   */
  public get simulationTime() {
    return this.timeService.simulationTime;
  }

  /**
   * Get the simulation state.
   */
  public get timeState(): TimeState {
    return this.timeService.timeState;
  }

  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  public get simulationSpeed() {
    return this.timeService.simulationSpeed;
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
  public uploadFile(
    file: string,
    isPrivate: boolean,
    cb?: (err?: Error, uploadUrl?: string) => void
  ) {
    this.largeFileUploadService.upload(file, isPrivate, cb);
  }

  /** List of the uploaded schemas, if any */
  public get uploadedSchemas() {
    return this.schemaPublisher ? this.schemaPublisher.uploadedSchemas : [];
  }

  // PRIVATE METHODS

  /** After the Kafka client is connected, initialize the other services too, starting with the schema registry. */
  private initialize() {
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.initProducer();
        await this.schemaRegistry.init();
        await this.addProducerTopics(this.config.produce);
        await this.addKafkaLogger();
        await this.initConsumer(this.config.consume);
        await this.addConsumerTopics(this.config.consume);
        await this.startHeartbeat();
        this.emit('ready');
      } catch (err) {
        return this.emitErrorMsg(
          `Error initializing kafka services: ${err}`,
          reject
        );
      }
      resolve();
    });
  }

  private initProducer() {
    if (!this.client) {
      return this.emitErrorMsg('Client not ready!');
    }
    this.producer = this.client.producer({
      allowAutoTopicCreation: true,
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    this.producer.connect();
  }

  private async initLogger() {
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
  }

  /** If required, add the Kafka logger too (after the producer has been initialised). */
  private addKafkaLogger() {
    return new Promise<void>((resolve) => {
      if (!this.producer) {
        return resolve();
      }
      const logOptions = this.config.logging;
      if (logOptions && logOptions.logToKafka) {
        this.log.addLogger({
          logger: new KafkaLogger({
            adapter: this,
            clientId: this.groupId,
          }),
          minLevel: logOptions.logToKafka,
        });
      }
      resolve();
    });
  }

  private async initConsumer(topics?: string | string[]) {
    if (!topics || topics.length === 0) {
      return;
    }
    if (!this.client) {
      return this.emitErrorMsg('initConsumer() - Client not ready!');
    }
    const consumer = this.client.consumer({
      groupId: this.groupId,
      minBytes: this.config.fetchMinBytes,
      maxBytes: this.config.fetchMaxBytes,
      sessionTimeout: this.config.sessionTimeout,
      rebalanceTimeout: this.config.rebalanceTimeout,
    });
    consumer.on('consumer.crash', (ev) =>
      this.emitErrorMsg(JSON.stringify(ev))
    );
    this.consumer = consumer;
  }

  private handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;

    const consumerTopic = this.consumerTopics[topic];
    if (!consumerTopic || !consumerTopic.decode) {
      this.emit('raw', payload);
      return;
    }
    const { key, value } = consumerTopic.decode(message);

    switch (topic) {
      default:
        this.emit('message', {
          topic,
          partition,
          key,
          value,
        } as AdapterMessage);
        break;
      case TimeTopic:
        const timeMessage = value as ITimeManagement;
        if (timeMessage) {
          this.timeService.setSimTime(timeMessage);
          this.emit('time', timeMessage);
        } else {
          this.log.warn(
            `Could not decode topic ${TimeTopic}. Is the schema correct?`
          );
        }
        break;
      case AccessInviteTopic:
        const invitation = value as ITopicInvite;
        if (invitation.id.toLowerCase() === this.groupId.toLowerCase()) {
          this.registerTopic(invitation);
        }
        break;
      case AccessRemoveTopic:
        const remove = value as ITopicRemove;
        this.unregisterTopic(remove);
        break;
      case AdminHeartbeatTopic:
        const ahb = value as IAdminHeartbeat;
        // console.log(`Admin heartbeat received`);
        // console.log(JSON.stringify(ahb));
        this.emit('heartbeat', ahb);
        break;
    }
  }

  private async registerTopic(invitation: ITopicInvite) {
    if (
      invitation.subscribeAllowed &&
      (await this.schemaRegistry.registerNewTopic(invitation.topicName))
    ) {
      await this.addConsumerTopics(invitation.topicName);
    }
    if (
      invitation.publishAllowed &&
      (await this.schemaRegistry.registerNewTopic(invitation.topicName))
    ) {
      this.addProducerTopics(invitation.topicName);
    }
    console.log(`Invitation received`);
    console.log(JSON.stringify(invitation));
  }

  private async unregisterTopic(remove: ITopicRemove) {
    this.schemaRegistry.unregisterTopic(remove.topicName);
  }

  /**
   * Add the topics to the configuration and initialize the decoders.
   * @param topics topics to add
   */
  private initializeConsumerTopics(topics?: string[]) {
    if (!topics || topics.length === 0) {
      return [];
    }
    const newTopics = topics.reduce((acc, topic) => {
      if (this.consumerTopics.hasOwnProperty(topic)) {
        return acc;
      }
      if (!this.schemaRegistry.valueSchemas.hasOwnProperty(topic)) {
        this.log.error(
          `initializeConsumerTopics - no schema registered for topic ${topic}`
        );
        return acc;
      }
      acc.push(topic);
      const initializedTopic = { topic } as IInitializedTopic;
      const avro = avroHelperFactory(this.schemaRegistry, topic);
      initializedTopic.decode = avro.decode;
      this.consumerTopics[topic] = initializedTopic;
      return acc;
    }, [] as string[]);
    return newTopics;
  }

  /**
   * Add the topics to the configuration and initialize the encoders/validators.
   * @param topics topics to add
   */
  private async initializeProducerTopics(topics?: string[]) {
    if (!topics || topics.length === 0) {
      return [];
    }
    const newTopics: string[] = [];
    for (const topic of topics) {
      if (this.producerTopics.hasOwnProperty(topic)) continue;
      await this.schemaRegistry.registerNewTopic(topic);
      if (
        !(
          this.schemaRegistry.valueSchemas.hasOwnProperty(topic) ||
          this.schemaRegistry.valueSchemas.hasOwnProperty(topic + '-value')
        )
      ) {
        this.log.error(
          `initializeProducerTopics - no schema registered for topic ${topic}`
        );
        continue;
      }
      newTopics.push(topic);
      if (
        this.config.produce &&
        this.config.produce instanceof Array &&
        this.config.produce.indexOf(topic) < 0
      ) {
        this.config.produce.push(topic);
      }
      const initializedTopic = { topic: topic } as IInitializedTopic;
      const avro = avroHelperFactory(this.schemaRegistry, topic);
      initializedTopic.encode = avro.encode;
      initializedTopic.encodeKey = avro.encodeKey;
      initializedTopic.isValid = avro.isValid;
      this.producerTopics[topic] = initializedTopic;
    }
    return newTopics;
  }

  /**
   * Start transmitting a heartbeat message.
   */
  private async startHeartbeat() {
    // return new Promise<void>((resolve, reject) => {
    if (this.isConnected) {
      return;
      // return resolve();
    }
    this.isConnected = true;
    const sendHeartbeat = async () => {
      if (
        !this.isConnected ||
        !this.producerTopics.hasOwnProperty(HeartbeatTopic)
      ) {
        return;
      }
      if (!this.producer) {
        return this.emitErrorMsg('Producer not ready!');
      }
      await this.send(
        {
          topic: HeartbeatTopic,
          messages: [
            {
              value: {
                id: this.config.clientId,
                alive: Date.now(),
                origin: this.origin,
              } as IHeartbeat,
            },
          ],
        },
        (error) => {
          if (error) {
            this.log.error(error);
          }
          setTimeout(sendHeartbeat, this.config.heartbeatInterval || 5000);
        }
      );
    };
    console.log('Started heartbeat');
    this.log.info('Started heartbeat');
    await sendHeartbeat();
    // resolve();
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
        brokers: [],
        schemaRegistry: 'schema_registry:3502',
        clientId: '',
        groupId: '',
        autoConnect: true,
        wrapUnions: 'auto',
        fromOffset: 'latest',
        heartbeatInterval: TestBedAdapter.HeartbeatInterval,
        produce: [],
        logging: {},
        encoding: 'buffer',
        keyEncoding: 'buffer',
        protocol: ['roundrobin'],
        sessionTimeout: 1000000,
        maxConnectionRetries: 10,
        autoRegisterDefaultSchemas: false,
        connectTimeout: 5000,
        partitionerType: 2,
        partitions: 1,
      } as ITestBedOptions & KafkaConfig,
      options
    );
    if (
      opt.brokers.length === 0 &&
      opt.brokers instanceof Array &&
      opt.kafkaHost
    ) {
      opt.brokers.push(...opt.kafkaHost.split(',').map((b) => b.trim()));
    }
    if (!opt.groupId && opt.clientId) {
      opt.groupId = opt.clientId;
      if (!opt.groupId)
        throw Error('Missing option: groupId or clientId must be specified!');
    }
    opt.clientId = opt.groupId;
    const consume = !opt.consume
      ? []
      : typeof opt.consume === 'string'
      ? [opt.consume]
      : opt.consume;
    opt.consume = consume;
    const produce = !opt.produce
      ? []
      : typeof opt.produce === 'string'
      ? [opt.produce]
      : opt.produce;
    opt.produce = produce;
    if (opt.autoRegisterDefaultSchemas) {
      CoreSubscribeTopics.filter((t) => consume.indexOf(t) < 0).forEach((t) =>
        consume.push(t)
      );
      CorePublishTopics(opt.largeFileService ? true : false)
        .filter((t) => produce.indexOf(t) < 0)
        .forEach((t) => produce.push(t));
    }
    if (!/\/$/.test(opt.schemaRegistry)) {
      opt.schemaRegistry = `${opt.schemaRegistry}/`;
    }
    return opt;
  }

  /**
   * Validate that all required options are set, or throw an error if not.
   * @param options current configuration
   */
  private validateOptions(options: ITestBedOptions) {
    if (!options.clientId && !options.groupId) {
      throw new Error('No clientId or groupId specified!');
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
      return JSON.parse(
        fs.readFileSync(configFile, { encoding: 'utf8' })
      ) as ITestBedOptions;
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
