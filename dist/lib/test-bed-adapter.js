"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const timers_1 = require("timers");
const file_logger_1 = require("./logger/file-logger");
const events_1 = require("events");
const logger_1 = require("./logger/logger");
const kafka_node_1 = require("kafka-node");
const schema_registry_1 = require("./avro/schema-registry");
const helpers_1 = require("./utils/helpers");
const avro_helper_factory_1 = require("./avro/avro-helper-factory");
const kafka_logger_1 = require("./logger/kafka-logger");
const console_logger_1 = require("./logger/console-logger");
const schema_publisher_1 = require("./avro/schema-publisher");
class TestBedAdapter extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.isConnected = false;
        this.log = logger_1.Logger.instance;
        /** Map of all initialized topics, i.e. with validators/encoders/decoders */
        this.consumerTopics = {};
        this.producerTopics = {};
        /** Location of the configuration file */
        this.configFile = 'config/test-bed-config.json';
        if (!config) {
            config = this.loadOptionsFromFile();
        }
        else if (typeof config === 'string') {
            config = this.loadOptionsFromFile(config);
        }
        this.validateOptions(config);
        this.config = this.setDefaultOptions(config);
        this.schemaPublisher = new schema_publisher_1.SchemaPublisher(this.config);
        this.schemaRegistry = new schema_registry_1.SchemaRegistry(this.config);
    }
    connect() {
        return new Promise((resolve, reject) => {
            this.initLogger()
                .then(() => {
                return this.schemaPublisher.init();
            })
                .then(() => {
                this.client = new kafka_node_1.KafkaClient(this.config);
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
            }).catch((err) => {
                this.log.error(`Error initializing test-bed-adapter: ${err}`);
                reject(err);
            });
        });
    }
    /**
     * A dictionary containing a clone of all the key schemas with key the bare topic name and
     * value the instance of the AVRO schema and schema ID.
     */
    get keySchemas() { return helpers_1.clone(this.schemaRegistry.keySchemas); }
    /**
     * A dictionary containing a clone of all the value schemas with key the bare topic name and
     * value the instance of the AVRO schema and schema ID.
     */
    get valueSchemas() { return helpers_1.clone(this.schemaRegistry.valueSchemas); }
    /** After the Kafka client is connected, initialize the other services too, starting with the schema registry. */
    initialize() {
        this.schemaRegistry.init()
            .then(() => this.initProducer())
            .then(() => this.addKafkaLogger())
            .then(() => this.startHeartbeat())
            .then(() => this.addProducerTopics(this.config.produce))
            .then(() => this.initConsumer())
            .then(() => this.addConsumerTopics(this.config.consume))
            .then(() => this.configUpdated())
            .then(() => this.emit('ready'))
            .catch(err => this.emitErrorMsg(err));
    }
    pause() {
        if (!this.consumer) {
            return this.emitErrorMsg('Consumer not ready!');
        }
        this.consumer.pause();
    }
    resume() {
        if (!this.consumer) {
            return this.emitErrorMsg('Consumer not ready!');
        }
        this.consumer.resume();
    }
    pauseTopics(topics) {
        if (!this.consumer) {
            return this.emitErrorMsg('Consumer not ready!');
        }
        this.consumer.pauseTopics(topics);
    }
    resumeTopics(topics) {
        if (!this.consumer) {
            return this.emitErrorMsg('Consumer not ready!');
        }
        this.consumer.resumeTopics(topics);
    }
    close() {
        if (this.heartbeatId) {
            timers_1.clearInterval(this.heartbeatId);
        }
        if (!this.client) {
            return;
        }
        this.client.close();
    }
    send(payloads, cb) {
        if (!this.producer) {
            return this.emitErrorMsg('Producer not ready!');
        }
        payloads = payloads instanceof Array ? payloads : [payloads];
        const pl = [];
        payloads.forEach(payload => {
            if (!this.producerTopics.hasOwnProperty(payload.topic)) {
                return cb(`Topic not found: please register first!`, null);
            }
            ;
            const topic = this.producerTopics[payload.topic];
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
    get configuration() { return helpers_1.clone(this.config); }
    /**
     * Add topics (encoding utf8)
     *
     * @param topics Array of topics to add
     * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
     */
    addConsumerTopics(topics) {
        return new Promise((resolve, reject) => {
            if (!topics) {
                return resolve();
            }
            topics = topics instanceof Array ? topics : [topics];
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
    addProducerTopics(topics) {
        return new Promise((resolve, reject) => {
            if (!topics) {
                return resolve();
            }
            topics = topics instanceof Array ? topics : [topics];
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
            }
            else {
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
    loadMetadataForTopics(topics, cb) {
        if (!this.isConnected) {
            cb('Client is not connected');
        }
        this.client.loadMetadataForTopics(topics, (error, results) => {
            if (error) {
                cb(error, undefined);
            }
            cb(null, results);
        });
    }
    // PRIVATE METHODS
    initProducer() {
        return new Promise(resolve => {
            if (!this.client) {
                return this.emitErrorMsg('Client not ready!');
            }
            this.producer = new kafka_node_1.Producer(this.client);
            this.producer.on('error', error => this.emitErrorMsg(error));
            resolve();
        });
    }
    initLogger() {
        return new Promise((resolve) => {
            const loggers = [];
            const logOptions = this.config.logging;
            if (logOptions) {
                if (logOptions.logToConsole) {
                    loggers.push({
                        logger: new console_logger_1.ConsoleLogger(),
                        minLevel: logOptions.logToConsole
                    });
                }
                if (logOptions.logToFile) {
                    loggers.push({
                        logger: new file_logger_1.FileLogger(logOptions.logFile || 'log.txt'),
                        minLevel: logOptions.logToFile
                    });
                }
                this.log.initialize(loggers);
            }
            resolve();
        });
    }
    /** If required, add the Kafka logger too (after the producer has been initialised). */
    addKafkaLogger() {
        return new Promise(resolve => {
            if (!this.producer) {
                return resolve();
            }
            const logOptions = this.config.logging;
            if (logOptions && logOptions.logToKafka) {
                this.log.addLogger({
                    logger: new kafka_logger_1.KafkaLogger({
                        producer: this.producer,
                        clientId: this.config.clientId
                    }),
                    minLevel: logOptions.logToKafka
                });
            }
            resolve();
        });
    }
    initConsumer() {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                return this.emitErrorMsg('initConsumer() - Client not ready!', reject);
            }
            this.consumer = new kafka_node_1.Consumer(this.client, [], { encoding: 'buffer', autoCommit: true });
            this.consumer.on('message', message => this.handleMessage(message));
            this.consumer.on('error', error => this.emitErrorMsg(error));
            this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
            resolve();
        });
    }
    handleMessage(message) {
        const { topic, value } = message;
        if (!value) {
            return;
        }
        if (this.consumerTopics.hasOwnProperty(topic)) {
            const consumerTopic = this.consumerTopics[topic];
            if (consumerTopic.decode) {
                message.value = consumerTopic.decode(message.value);
                if (consumerTopic.decodeKey && message.key instanceof Buffer) {
                    message.key = consumerTopic.decodeKey(message.key);
                }
            }
            else {
                message.value = message.value.toString(); // decode buffer to string for normal messages
            }
        }
        this.emit('message', message);
    }
    /**
     * Add the topics to the configuration and initialize the decoders.
     * @param topics topics to add
     */
    initializeConsumerTopics(topics) {
        if (!topics) {
            return [];
        }
        let isConfigUpdated = false;
        const newTopics = [];
        topics.forEach(t => {
            if (this.consumerTopics.hasOwnProperty(t.topic))
                return;
            if (!this.schemaRegistry.valueSchemas.hasOwnProperty(t.topic)) {
                this.log.error(`initializeConsumerTopics - no schema registered for topic ${t.topic}`);
                return;
            }
            newTopics.push(t);
            if (this.config.consume && this.config.consume.filter(fr => fr.topic === t.topic).length === 0) {
                isConfigUpdated = true;
                this.config.consume.push(t);
            }
            const initializedTopic = helpers_1.clone(t);
            const avro = avro_helper_factory_1.avroHelperFactory(this.schemaRegistry, t.topic);
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
    initializeProducerTopics(topics) {
        if (!topics) {
            return [];
        }
        let isConfigUpdated = false;
        const newTopics = [];
        topics.forEach(t => {
            if (this.producerTopics.hasOwnProperty(t))
                return;
            if (!this.schemaRegistry.valueSchemas.hasOwnProperty(t)) {
                this.log.error(`initializeProducerTopics - no schema registered for topic ${t}`);
                return;
            }
            newTopics.push(t);
            if (this.config.produce && this.config.produce.indexOf(t) < 0) {
                isConfigUpdated = true;
                this.config.produce.push(t);
            }
            const initializedTopic = { topic: t };
            const avro = avro_helper_factory_1.avroHelperFactory(this.schemaRegistry, t);
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
    configUpdated() {
        return new Promise((resolve, reject) => {
            if (!this.producer) {
                return;
            }
            this.send([{
                    topic: TestBedAdapter.ConfigurationTopic,
                    key: this.config.clientId,
                    messages: this.config
                }], (err, result) => {
                if (err) {
                    this.emitErrorMsg('Producer not ready!', reject);
                }
                if (result) {
                    this.log.info(result);
                }
                resolve();
            });
        });
    }
    /**
     * Start transmitting a heartbeat message.
     */
    startHeartbeat() {
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                return resolve();
            }
            this.isConnected = true;
            // this.addProducerTopics([TestBedAdapter.HeartbeatTopic, TestBedAdapter.ConfigurationTopic])
            //   .then(() => {
            this.heartbeatId = setInterval(() => {
                if (!this.producer) {
                    return this.emitErrorMsg('Producer not ready!', reject);
                }
                this.send({
                    attributes: 1,
                    key: this.config.clientId,
                    topic: TestBedAdapter.HeartbeatTopic,
                    messages: [{ id: this.config.clientId, alive: new Date().toISOString() }]
                }, (error) => {
                    if (error) {
                        this.log.error(error);
                    }
                });
            }, this.config.heartbeatInterval || 5000);
            resolve();
        });
        // });
    }
    /**
     * Set the default options of the configuration.
     * @param options current configuration
     */
    setDefaultOptions(options) {
        const opt = Object.assign({
            kafkaHost: 'broker:3501',
            schemaRegistry: 'schema_registry:3502',
            clientId: '',
            autoConnect: true,
            sslOptions: false,
            requestTimeout: 10000,
            heartbeatInterval: 5000,
            consume: [],
            produce: [],
            logging: {},
            maxConnectionRetries: 10,
            retryTimeout: 5
        }, options);
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
    validateOptions(options) {
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
    loadOptionsFromFile(configFile = this.configFile) {
        configFile = path.resolve(configFile);
        // this.log(configFile);
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' }));
        }
        throw new Error(`Error loading options! Either supply them as parameter or as a configuration file at ${configFile}.`);
    }
    getConfig() {
        return JSON.parse(JSON.stringify(this.config));
    }
    emitErrorMsg(msg, cb) {
        this.log.error(msg);
        this.emit('error', msg);
        if (cb) {
            cb(msg);
        }
    }
}
TestBedAdapter.HeartbeatTopic = 'connect-status-heartbeat';
TestBedAdapter.ConfigurationTopic = 'connect-status-configuration';
TestBedAdapter.LogTopic = 'connect-status-log';
exports.TestBedAdapter = TestBedAdapter;
//# sourceMappingURL=test-bed-adapter.js.map