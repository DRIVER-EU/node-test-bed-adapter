/// <reference types="node" />
import { ITestBedOptions } from './models/test-bed-options';
import { EventEmitter } from 'events';
export declare class TestBedAdapter extends EventEmitter {
    isConnected: boolean;
    private client;
    private producer;
    private consumer;
    private options;
    private heartbeatTopic;
    private heartbeatId;
    private configFile;
    constructor(options?: ITestBedOptions);
    connect(): void;
    pause(): void;
    resume(): void;
    pauseTopics(topics: string[]): void;
    resumeTopics(topics: string[]): void;
    close(): void;
    /**
     *
     * @param topics Array of topics to add
     * @param cb Callback
     * @param fromOffset if true, the consumer will fetch message from the specified offset, otherwise it will fetch message from the last commited offset of the topic.
     */
    addTopics(topics: string | string[], cb: (error: Error, data: any) => void, fromOffset?: boolean): void;
    /**
     * Load the metadata for all topics (in case of an empty array), or specific ones.
     * @param topics If topics is an empty array, retreive the metadata of all topics
     * @param cb callback function to return the metadata results
     */
    loadMetadataForTopics(topics: string[], cb: (error?: any, results?: any) => any): void;
    private startHeartbeat();
    private setDefaultOptions(options);
    private validateOptions(options);
    private loadOptionsFromFile();
}
