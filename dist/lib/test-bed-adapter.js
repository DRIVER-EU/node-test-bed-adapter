"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const kafka_node_1 = require("kafka-node");
const events_1 = require("events");
const timers_1 = require("timers");
class TestBedAdapter extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.isConnected = false;
        this.configFile = path.resolve('test-bed-config.json');
        if (!options) {
            options = this.loadOptionsFromFile();
        }
        this.validateOptions(options);
        this.options = this.setDefaultOptions(options);
        this.heartbeatTopic = `heartbeat-${this.options.clientId}`;
    }
    connect() {
        this.client = new kafka_node_1.KafkaClient(this.options);
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
    close() {
        timers_1.clearInterval(this.heartbeatId);
        this.client.close();
    }
    /**
     *
     * @param topics Array of topics to add
     * @param cb Callback
     * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
     */
    addTopics(topics, cb, fromOffset) {
        if (typeof topics === 'string') {
            topics = [topics];
        }
        const offsetFetchRequests = topics.map(t => ({ topic: t }));
        if (!this.consumer) {
            this.consumer = new kafka_node_1.Consumer(this.client, offsetFetchRequests, { encoding: 'utf8' });
            this.consumer.on('message', message => this.emit('message', message));
            this.consumer.on('error', error => this.emit('error', error));
            this.consumer.on('offsetOutOfRange', error => this.emit('offsetOutOfRange', error));
        }
        else {
            this.consumer.addTopics(offsetFetchRequests, cb, fromOffset);
        }
    }
    startHeartbeat() {
        this.isConnected = true;
        this.producer = new kafka_node_1.Producer(this.client);
        this.producer.createTopics([this.heartbeatTopic], (error, data) => {
            if (error) {
                throw new Error(error);
            }
            console.log(data);
            this.heartbeatId = setInterval(() => {
                this.producer.send([{
                        topic: this.heartbeatTopic,
                        messages: [
                            new kafka_node_1.KeyedMessage('alive', `${this.options.clientId}`),
                            new kafka_node_1.KeyedMessage('time', new Date().toISOString())
                        ]
                    }], (error) => {
                    if (error) {
                        console.error(error);
                    }
                });
            }, this.options.heartbeatInterval || 5000);
        });
    }
    setDefaultOptions(options) {
        return Object.assign({
            kafkaHost: '',
            clientId: '',
            autoConnect: true,
            sslOptions: false,
            heartbeatInterval: 5000
        }, options);
    }
    validateOptions(options) {
        if (!options.clientId) {
            throw new Error('No clientId specified!');
        }
        if (!options.kafkaHost) {
            throw new Error('No kafkaHost specified!');
        }
    }
    loadOptionsFromFile() {
        if (fs.existsSync(this.configFile)) {
            return JSON.parse(fs.readFileSync(this.configFile, { encoding: 'utf8' }));
        }
        throw new Error(`Error loading options! Either supply them as parameter or as a configuration file at ${this.configFile}.`);
    }
}
exports.TestBedAdapter = TestBedAdapter;
//# sourceMappingURL=test-bed-adapter.js.map