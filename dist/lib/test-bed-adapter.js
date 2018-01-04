"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schema_registry_1 = require("./schema-registry");
const fs = require("fs");
const path = require("path");
const file_logger_1 = require("./logger/file-logger");
const events_1 = require("events");
const logger_1 = require("./logger/logger");
const kafka_node_1 = require("kafka-node");
const timers_1 = require("timers");
const helpers_1 = require("./utils/helpers");
const avro_helper_factory_1 = require("./avro/avro-helper-factory");
const kafka_logger_1 = require("./logger/kafka-logger");
const console_logger_1 = require("./logger/console-logger");
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
        this.defaultCallback = (error, data) => {
            if (error) {
                this.log.error(error.message);
            }
            if (data) {
                this.log.info(data);
            }
        };
        if (!config) {
            config = this.loadOptionsFromFile();
        }
        else if (typeof config === 'string') {
            config = this.loadOptionsFromFile(config);
        }
        this.validateOptions(config);
        this.config = this.setDefaultOptions(config);
        this.schemaRegistry = new schema_registry_1.SchemaRegistry(this.config);
    }
    connect() {
        this.client = new kafka_node_1.KafkaClient(this.config);
        this.initProducer();
        this.client.on('ready', () => {
            if (this.config.consume && this.config.consume.length > 0) {
                this.addConsumerTopics(this.config.consume, this.defaultCallback);
            }
        });
        this.client.on('error', (error) => {
            this.log.error(error);
            this.emit('error', error);
        });
        this.client.on('reconnect', () => {
            this.emit('reconnect');
        });
    }
    pause() {
        if (!this.consumer) {
            this.emit('error', 'Consumer not ready!');
            return;
        }
        this.consumer.pause();
    }
    resume() {
        if (!this.consumer) {
            this.emit('error', 'Consumer not ready!');
            return;
        }
        this.consumer.resume();
    }
    pauseTopics(topics) {
        if (!this.consumer) {
            this.emit('error', 'Consumer not ready!');
            return;
        }
        this.consumer.pauseTopics(topics);
    }
    resumeTopics(topics) {
        if (!this.consumer) {
            this.emit('error', 'Consumer not ready!');
            return;
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
            this.emit('error', 'Producer not ready!');
            return;
        }
        payloads = payloads instanceof Array ? payloads : [payloads];
        const pl = [];
        payloads.forEach(payload => {
            if (!this.producerTopics.hasOwnProperty(payload.topic)) {
                return cb(`Topic not found: please register first!`, null);
            }
            ;
            const topic = this.producerTopics[payload.topic];
            if (topic.isValid && topic.isValid(payload.messages)) {
                if (topic.encode) {
                    payload.messages = topic.encode(payload.messages);
                }
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
     * @param cb Callback
     * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
     */
    addConsumerTopics(topics, cb, fromOffset) {
        if (!(topics instanceof Array)) {
            topics = [topics];
        }
        this.initializeConsumerTopics(topics);
        if (!this.consumer) {
            this.initConsumer(topics);
        }
        if (!this.consumer) {
            this.emit('error', 'Consumer not ready!');
            return;
        }
        this.consumer.addTopics(topics, cb, fromOffset);
    }
    addProducerTopics(topics, cb) {
        if (!(topics instanceof Array)) {
            topics = [topics];
        }
        this.initializeProducerTopics(topics);
        if (!this.producer) {
            this.emit('error', 'Producer not ready!');
            return;
        }
        this.producer.createTopics(topics.map(t => t.topic), true, cb);
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
        if (!this.client) {
            this.emit('error', 'Client not ready!');
            return;
        }
        this.producer = new kafka_node_1.Producer(this.client);
        this.producer.on('ready', () => {
            this.initLogger();
            this.schemaRegistry.init().then(() => {
                this.startHeartbeat();
                if (this.config.produce && this.config.produce.length > 0) {
                    this.addProducerTopics(this.config.produce, this.defaultCallback);
                }
                this.emit('ready');
            });
        });
        this.producer.on('error', error => this.emit('error', error));
    }
    initLogger() {
        if (!this.producer) {
            return;
        }
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
            if (logOptions.logToKafka) {
                loggers.push({
                    logger: new kafka_logger_1.KafkaLogger({
                        producer: this.producer,
                        clientId: this.config.clientId
                    }),
                    minLevel: logOptions.logToKafka
                });
            }
        }
        this.log.initialize(loggers);
    }
    initConsumer(topics) {
        if (!this.client) {
            this.emit('error', 'Client not ready!');
            return;
        }
        this.consumer = new kafka_node_1.Consumer(this.client, topics, { encoding: 'buffer', autoCommit: true });
        this.consumer.on('message', message => this.handleMessage(message));
        this.consumer.on('error', error => this.emit('error', error));
        this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
    }
    handleMessage(message) {
        const { topic, value } = message;
        if (!value) {
            return;
        }
        if (this.consumerTopics.hasOwnProperty(topic)) {
            const consumerTopic = this.consumerTopics[topic];
            if (consumerTopic.decode) {
                const buf = new Buffer(message.value, 'binary');
                message.value = consumerTopic.decode(buf);
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
            return;
        }
        topics.forEach(t => {
            if (this.consumerTopics.hasOwnProperty(t.topic))
                return;
            if (this.config.consume && this.config.consume.indexOf(t) < 0) {
                this.config.consume.push(t);
            }
            const initializedTopic = helpers_1.clone(t);
            if (t.schemaURI) {
                const ext = path.extname(t.schemaURI).toLowerCase();
                switch (ext) {
                    case '.avsc':
                        const avro = avro_helper_factory_1.avroHelperFactory(t.schemaURI, t.type);
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
    initializeProducerTopics(topics) {
        if (!topics) {
            return;
        }
        topics.forEach(t => {
            if (this.consumerTopics.hasOwnProperty(t.topic))
                return;
            if (this.config.produce && this.config.produce.indexOf(t) < 0) {
                this.config.produce.push(t);
            }
            const initializedTopic = helpers_1.clone(t);
            if (t.schemaURI) {
                const ext = path.extname(t.schemaURI).toLowerCase();
                switch (ext) {
                    case '.avsc':
                        const avro = avro_helper_factory_1.avroHelperFactory(t.schemaURI, t.type);
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
    configUpdated() {
        if (!this.producer) {
            return;
        }
        this.producer.send([{
                topic: TestBedAdapter.ConfigurationTopic,
                messages: new kafka_node_1.KeyedMessage(this.config.clientId.toLowerCase(), JSON.stringify(this.config))
            }], (err, result) => {
            if (err) {
                this.emit('error', err);
            }
            if (result) {
                this.log.info(result);
            }
        });
    }
    /**
     * Start transmitting a heartbeat message.
     */
    startHeartbeat() {
        if (this.isConnected) {
            return;
        }
        this.isConnected = true;
        this.addProducerTopics([{ topic: TestBedAdapter.HeartbeatTopic }, { topic: TestBedAdapter.ConfigurationTopic }], (error, data) => {
            if (error) {
                throw error;
            }
            this.log.info(data);
            if (this.config.produce) {
                this.config.produce.push({ topic: TestBedAdapter.HeartbeatTopic });
            }
            this.heartbeatId = setInterval(() => {
                if (!this.producer) {
                    this.emit('error', 'Producer not ready!');
                    return;
                }
                this.producer.send([{
                        topic: TestBedAdapter.HeartbeatTopic,
                        messages: new kafka_node_1.KeyedMessage(`${this.config.clientId}`, new Date().toISOString())
                    }], (error) => {
                    if (error) {
                        this.log.error(error);
                    }
                });
            }, this.config.heartbeatInterval || 5000);
        });
    }
    /**
     * Set the default options of the configuration.
     * @param options current configuration
     */
    setDefaultOptions(options) {
        return Object.assign({
            kafkaHost: 'broker:3501',
            schemaRegistry: 'schema_registry:3502',
            clientId: '',
            autoConnect: true,
            sslOptions: false,
            heartbeatInterval: 5000,
            consume: [],
            produce: [],
            logging: {}
        }, options);
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
}
TestBedAdapter.HeartbeatTopic = 'heartbeat';
TestBedAdapter.ConfigurationTopic = 'configuration';
exports.TestBedAdapter = TestBedAdapter;
//# sourceMappingURL=test-bed-adapter.js.map