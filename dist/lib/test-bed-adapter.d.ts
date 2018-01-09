/// <reference types="node" />
/// <reference types="bluebird" />
import { ITopicsMetadata } from './declarations/kafka-node-ext';
import * as Promise from 'bluebird';
import { EventEmitter } from 'events';
import { ProduceRequest, OffsetFetchRequest } from 'kafka-node';
import { ITestBedOptions } from './models/test-bed-options';
import { IAvroType } from './declarations/avro';
export declare class TestBedAdapter extends EventEmitter {
    static HeartbeatTopic: string;
    static ConfigurationTopic: string;
    static LogTopic: string;
    isConnected: boolean;
    private schemaPublisher;
    private schemaRegistry;
    private log;
    private client?;
    private producer?;
    private consumer?;
    private config;
    private heartbeatId?;
    /** Map of all initialized topics, i.e. with validators/encoders/decoders */
    private consumerTopics;
    private producerTopics;
    /** Location of the configuration file */
    private configFile;
    constructor(config?: ITestBedOptions | string);
    connect(): void;
    /**
     * A dictionary containing a clone of all the key schemas with key the bare topic name and
     * value the instance of the AVRO schema and schema ID.
     */
    readonly keySchemas: {
        [topic: string]: {
            type: IAvroType;
            srId: number;
        };
    };
    /**
     * A dictionary containing a clone of all the value schemas with key the bare topic name and
     * value the instance of the AVRO schema and schema ID.
     */
    readonly valueSchemas: {
        [topic: string]: {
            type: IAvroType;
            srId: number;
        };
    };
    /** After the Kafka client is connected, initialize the other services too, starting with the schema registry. */
    private initialize();
    pause(): void;
    resume(): void;
    pauseTopics(topics: string[]): void;
    resumeTopics(topics: string[]): void;
    close(): void;
    send(payloads: ProduceRequest | ProduceRequest[], cb: (error: any, data: any) => any): void;
    /**
     * Returns (a clone of) the configuration options.
     */
    readonly configuration: ITestBedOptions;
    /**
     * Add topics (encoding utf8)
     *
     * @param topics Array of topics to add
     * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
     */
    addConsumerTopics(topics?: OffsetFetchRequest | OffsetFetchRequest[]): Promise<OffsetFetchRequest[]>;
    addProducerTopics(topics?: string | string[]): Promise<string[]>;
    /**
     * Load the metadata for all topics (in case of an empty array), or specific ones.
     *
     * @param topics If topics is an empty array, retreive the metadata of all topics
     * @param cb callback function to return the metadata results
     */
    loadMetadataForTopics(topics: string[], cb: (error?: any, results?: ITopicsMetadata) => void): void;
    private initProducer();
    private initLogger();
    /** If required, add the Kafka logger too (after the producer has been initialised). */
    private addKafkaLogger();
    private initConsumer();
    private handleMessage(message);
    /**
     * Add the topics to the configuration and initialize the decoders.
     * @param topics topics to add
     */
    private initializeConsumerTopics(topics?);
    /**
     * Add the topics to the configuration and initialize the encoders/validators.
     * @param topics topics to add
     */
    private initializeProducerTopics(topics?);
    /**
     * Configuration has changed.
     */
    private configUpdated();
    /**
     * Start transmitting a heartbeat message.
     */
    private startHeartbeat();
    /**
     * Set the default options of the configuration.
     * @param options current configuration
     */
    private setDefaultOptions(options);
    /**
     * Validate that all required options are set, or throw an error if not.
     * @param options current configuration
     */
    private validateOptions(options);
    /**
     * Load the configuration options from file.
     * @param configFile configuration file path
     */
    private loadOptionsFromFile(configFile?);
    private emitErrorMsg(msg, cb?);
}
