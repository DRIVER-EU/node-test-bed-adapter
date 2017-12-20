/// <reference types="node" />
import { EventEmitter } from 'events';
import { ProduceRequest } from 'kafka-node';
import { ITopic } from './models/topic';
import { ITestBedOptions } from './models/test-bed-options';
export declare class TestBedAdapter extends EventEmitter {
    static HeartbeatTopic: string;
    isConnected: boolean;
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
    private defaultCallback;
    constructor(config?: ITestBedOptions | string);
    connect(): void;
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
     * @param cb Callback
     * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
     */
    addTopics(topics: ITopic[] | ITopic, cb: (error: Error, data: any) => void, fromOffset?: boolean): void;
    addProducerTopics(topics: ITopic | ITopic[], cb: (error: Error, data: any) => void): void;
    /**
     * Load the metadata for all topics (in case of an empty array), or specific ones.
     * @param topics If topics is an empty array, retreive the metadata of all topics
     * @param cb callback function to return the metadata results
     */
    loadMetadataForTopics(topics: string[], cb: (error?: any, results?: any) => any): void;
    private initProducer();
    private initLogger();
    private initConsumer(topics);
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
}
