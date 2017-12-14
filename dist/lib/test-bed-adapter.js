"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const kafka_node_1 = require("kafka-node");
const events_1 = require("events");
const timers_1 = require("timers");
const helpers_1 = require("./utils/helpers");
class TestBedAdapter extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.isConnected = false;
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
        if (this.config.consume) {
            this.initializeConsumerTopics(this.config.consume);
        }
        this.heartbeatTopic = `heartbeat-${this.config.clientId}`;
    }
    connect() {
        this.client = new kafka_node_1.KafkaClient(this.config);
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
        payloads.forEach(payload => {
            if (this.producerTopics.hasOwnProperty(payload.topic)) {
                this.initializeProducerTopic(payload);
            }
            ;
        });
        this.producer.send(payloads, cb);
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
            this.consumer = new kafka_node_1.Consumer(this.client, topics, { encoding: 'utf8' });
            this.consumer.on('message', message => this.emit('message', message));
            this.consumer.on('error', error => this.emit('error', error));
            this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
        }
        this.consumer.addTopics(topics, cb, fromOffset);
    }
    /**
     * Add topics (encoding Buffer)
     *
     * @param topics Array of topics to add
     * @param cb Callback
     * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
     */
    addBinaryTopics(topics, cb, fromOffset) {
        if (!(topics instanceof Array)) {
            topics = [topics];
        }
        this.initializeConsumerTopics(topics);
        if (!this.binaryConsumer) {
            this.binaryConsumer = new kafka_node_1.Consumer(this.client, topics, { encoding: 'buffer' });
            this.binaryConsumer.on('message', message => this.emit('message', message));
            this.binaryConsumer.on('error', error => this.emit('error', error));
            this.binaryConsumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
        }
        else {
            this.binaryConsumer.addTopics(topics, cb, fromOffset);
        }
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
    /**
     * Add the topics to the configuration and initialize the decoders.
     * @param topics topics to add
     */
    initializeConsumerTopics(topics) {
        if (!this.config.consume) {
            return;
        }
        topics.forEach(t => {
            if (this.consumerTopics.hasOwnProperty(t.topic))
                return;
            const initializedTopic = helpers_1.clone(t);
            // TODO Initialize decoder, e.g. for AVRO messages.
            this.consumerTopics[t.topic] = initializedTopic;
        });
        this.config.consume.push(...topics);
    }
    /**
     * Add the topics to the configuration and initialize the encoders/validators.
     * @param topics topics to add
     */
    initializeProducerTopic(pr) {
        if (!this.config.produce) {
            return;
        }
        const initializedTopic = { topic: pr.topic, partition: pr.partition };
        // TODO Initialize encoder en validator, e.g. for AVRO messages.`
        // const validator =
        this.consumerTopics[pr.topic] = initializedTopic;
        this.config.produce.push(initializedTopic);
    }
    /**
     * Start transmitting a heartbeat message.
     */
    startHeartbeat() {
        this.isConnected = true;
        this.producer = new kafka_node_1.Producer(this.client);
        this.producer.on('ready', () => {
            this.producer.createTopics([this.heartbeatTopic], (error, data) => {
                if (error) {
                    throw new Error(error);
                }
                console.log(data);
                if (this.config.produce) {
                    this.config.produce.push({ topic: this.heartbeatTopic });
                }
                this.heartbeatId = setInterval(() => {
                    this.producer.send([{
                            topic: this.heartbeatTopic,
                            messages: [
                                new kafka_node_1.KeyedMessage('alive', `${this.config.clientId}`),
                                new kafka_node_1.KeyedMessage('time', new Date().toISOString())
                            ]
                        }], (error) => {
                        if (error) {
                            console.error(error);
                        }
                    });
                }, this.config.heartbeatInterval || 5000);
            });
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
exports.TestBedAdapter = TestBedAdapter;
//# sourceMappingURL=test-bed-adapter.js.map