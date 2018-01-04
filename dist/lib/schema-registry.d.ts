/// <reference types="bluebird" />
import { ITestBedOptions } from './models/test-bed-options';
import * as Promise from 'bluebird';
export interface ISchema {
    version: number | string;
    topic: string;
    type?: any;
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
    private log;
    private selectedTopics;
    private fetchAllVersions;
    /** List of schema topics with -value, -key annotations */
    private schemaTopics;
    private schemaTypeById;
    private valueSchemas;
    private schemaMeta;
    private keySchemas;
    constructor(options: ITestBedOptions);
    init(): Promise<{}>;
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
