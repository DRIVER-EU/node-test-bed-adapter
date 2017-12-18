"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const kafka_node_1 = require("kafka-node");
const events_1 = require("events");
const timers_1 = require("timers");
const helpers_1 = require("./utils/helpers");
const index_debug_1 = require("./index-debug");
class TestBedAdapter extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.isConnected = false;
        /** Map of all initialized topics, i.e. with validators/encoders/decoders */
        this.consumerTopics = {};
        this.producerTopics = {};
        /** Location of the configuration file */
        this.configFile = 'config/test-bed-config.json';
        this.defaultCallback = (error, data) => {
            if (error) {
                console.error(error.message);
            }
            if (data) {
                console.log(data);
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
    }
    connect() {
        this.client = new kafka_node_1.KafkaClient(this.config);
        this.initProducer();
        this.client.on('ready', () => {
            if (this.config.consume && this.config.consume.length > 0) {
                this.addTopics(this.config.consume, this.defaultCallback);
            }
        });
        this.client.on('error', (error) => {
            console.error(error);
            this.emit('error', error);
        });
        this.client.on('reconnect', () => {
            this.emit('reconnect');
        });
    }
    initProducer() {
        this.producer = new kafka_node_1.Producer(this.client);
        this.producer.on('ready', () => {
            this.startHeartbeat();
            if (this.config.produce && this.config.produce.length > 0) {
                this.addProducerTopics(this.config.produce, this.defaultCallback);
            }
            this.emit('ready');
        });
        this.producer.on('error', error => this.emit('error', error));
    }
    initConsumer(topics) {
        this.consumer = new kafka_node_1.Consumer(this.client, topics, { encoding: 'buffer', autoCommit: true });
        this.consumer.on('message', message => this.handleMessage(message));
        this.consumer.on('error', error => this.emit('error', error));
        this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
    }
    pause() {
        this.consumer.pause();
    }
    resume() {
        this.consumer.resume();
    }
    pauseTopics(topics) {
        this.consumer.pauseTopics(topics);
    }
    resumeTopics(topics) {
        this.consumer.resumeTopics(topics);
    }
    close() {
        timers_1.clearInterval(this.heartbeatId);
        this.client.close();
    }
    send(payloads, cb) {
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
    addTopics(topics, cb, fromOffset) {
        if (!(topics instanceof Array)) {
            topics = [topics];
        }
        this.initializeConsumerTopics(topics);
        if (!this.consumer) {
            this.initConsumer(topics);
        }
        this.consumer.addTopics(topics, cb, fromOffset);
    }
    addProducerTopics(topics, cb) {
        if (!(topics instanceof Array)) {
            topics = [topics];
        }
        this.initializeProducerTopics(topics);
        this.producer.createTopics(topics.map(t => t.topic), true, cb);
    }
    /**
     * Load the metadata for all topics (in case of an empty array), or specific ones.
     * @param topics If topics is an empty array, retreive the metadata of all topics
     * @param cb callback function to return the metadata results
     */
    loadMetadataForTopics(topics, cb) {
        if (!this.isConnected) {
            cb('Client is not connected');
        }
        this.client.loadMetadataForTopics(topics, (error, results) => {
            if (error) {
                return console.error(error);
            }
            console.log(results);
            // console.log('%j', _.get(results, '1.metadata'));
        });
    }
    handleMessage(message) {
        const { topic } = message;
        if (this.consumerTopics.hasOwnProperty(topic)) {
            const consumerTopic = this.consumerTopics[topic];
            if (consumerTopic.decode) {
                const buf = new Buffer(message.value, 'binary');
                message.value = consumerTopic.decode(buf);
            }
            else {
                message.value = message.value.toString(); // decode buffer to string for normal messages
            }
            this.emit('message', message);
        }
        else {
            this.emit('message', message);
        }
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
                        const avro = index_debug_1.avroHelperFactory(t.schemaURI, t.type);
                        initializedTopic.decode = avro.decode;
                        // initializedTopic.decode = avro.toString;
                        break;
                    default:
                        console.error(`Unknown schema type: ${t.schemaURI}. Ignoring.`);
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
                        const avro = index_debug_1.avroHelperFactory(t.schemaURI, t.type);
                        initializedTopic.encode = avro.encode;
                        initializedTopic.isValid = avro.isValid;
                        break;
                    default:
                        console.error(`Unknown schema type: ${t.schemaURI}. Ignoring.`);
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
        // TODO Send an update that the configuration has changed
    }
    /**
     * Start transmitting a heartbeat message.
     */
    startHeartbeat() {
        this.isConnected = true;
        this.addProducerTopics({ topic: TestBedAdapter.HeartbeatTopic }, (error, data) => {
            if (error) {
                throw error;
            }
            console.log(data);
            if (this.config.produce) {
                this.config.produce.push({ topic: TestBedAdapter.HeartbeatTopic });
            }
            this.heartbeatId = setInterval(() => {
                console.log('.');
                this.producer.send([{
                        topic: TestBedAdapter.HeartbeatTopic,
                        messages: new kafka_node_1.KeyedMessage(`${this.config.clientId}`, new Date().toISOString())
                    }], (error) => {
                    if (error) {
                        console.error(error);
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
            kafkaHost: '',
            clientId: '',
            autoConnect: true,
            sslOptions: false,
            heartbeatInterval: 5000,
            consume: [],
            produce: []
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
        // console.log(configFile);
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile, { encoding: 'utf8' }));
        }
        throw new Error(`Error loading options! Either supply them as parameter or as a configuration file at ${configFile}.`);
    }
}
TestBedAdapter.HeartbeatTopic = 'heartbeat';
exports.TestBedAdapter = TestBedAdapter;
//# sourceMappingURL=test-bed-adapter.js.map