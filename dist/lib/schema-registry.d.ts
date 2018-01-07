/// <reference types="bluebird" />
import { ITestBedOptions } from './models/test-bed-options';
import * as Promise from 'bluebird';
import { IAvroType } from './declarations/avro';
export interface ISchema {
    version: number | string;
    topic: string;
    type?: IAvroType;
    schemaType: string;
    schemaTopicRaw: string;
    responseRaw: {
        schema: string;
        id: number;
    };
}
export interface ISchemaTopic {
    version: string;
    schemaTopic: string;
}
export declare class SchemaRegistry {
    private options;
    /**
     * A dict containing the instance of the "avsc" package, and key the SR schema id.
     * Keys are in the form 'schema-[SCHEMA_ID]'
     *
     * @type {Object}
     */
    schemaTypeById: {
        [key: string]: IAvroType;
    };
    /**
     * A dict containing all the key schemas with key the bare topic name and
     * value the instance of the "avsc" package.
     *
     * @type {Object}
     */
    keySchemas: {
        [topic: string]: {
            type: IAvroType;
            srId: number;
        };
    };
    /**
     * A dict containing all the value schemas with key the bare topic name and
     * value the instance of the "avsc" package. It not only contains schemas for
     * topics with key/value pairs, but also for topics with only a schema.
     *
     * @type {Object}
     */
    valueSchemas: {
        [topic: string]: {
            type: IAvroType;
            srId: number;
        };
    };
    private log;
    private selectedTopics;
    private fetchAllVersions;
    /** List of schema topics with -value, -key annotations */
    private schemaTopics;
    /**
     * A dict containing all the value schemas metadata, with key the bare
     * topic name and value the SR response on that topic:
     *
     * 'subject' {string} The full topic name, including the '-value' suffix.
     * 'version' {number} The version number of the schema.
     * 'id' {number} The schema id.
     * 'schema' {string} JSON serialized schema.
     *
     * @type {Object}
     */
    private schemaMeta;
    constructor(options: ITestBedOptions);
    init(): Promise<ISchema[]>;
    private processSelectedTopics();
    private fetchAllSchemaTopics();
    private suppressAxiosError(err);
    private registerSchemaLatest(schemaObj);
    private storeTopics(schemaTopics);
    private fetchLatestVersion(schemaTopic);
    /**
     * After the initial schema registration is complete check if it is required to
     * fetch all the past versions for each topic and concatenate those results.
     *
     * @param {Array.<Object>} registeredSchemas The registered schemas from the first op.
     * @return {Promise(Array.<Object>)} The same schemas plus all the versions if requested.
     * @private
     */
    private checkForAllVersions(registeredSchemas);
    /**
     * Register the provided schema locally using avro.
     *
     * @param {Object} schemaObj Schema object as produced by fetchSchema().
     * @return {Promise(Array.<Object>)} A Promise with the object received
     *   augmented with the "type" property which stores the parsed avro schema.
     * @private
     */
    private registerSchema(schemaObj);
    /**
     * Fetch all available versions for a subject from the SR.
     *
     * @return {Promise(Array.<Object>)} A Promise with an array of objects
     *   containing the topic name and version number.
     * @private
     */
    private fetchAllSchemaVersions(schemaTopic);
    /**
     * Flatten the array of arrays produced by fetchAllSchemaVersions().
     *
     * @param results Results as produced by fetchAllSchemaVersions().
     * @return Flattened results.
     * @private
     */
    private flattenResults(results);
    /**
     * A master wrapper method to determine if all topics or just specific ones
     * need to be fetched.
     *
     * @return {Promise(Array.<string>)} A Promise with an arrray of string topics.
     * @private
     */
    private fetchTopics();
    private fetchSchema(topicMeta, config?);
    private handleAxiosError(err);
}
