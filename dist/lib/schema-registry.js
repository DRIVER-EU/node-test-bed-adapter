"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const axios_1 = require("axios");
const url = require("url");
const avro = require("avsc");
const _1 = require(".");
class SchemaRegistry {
    constructor(options) {
        this.options = options;
        this.log = _1.Logger.instance;
        this.selectedTopics = [];
        this.fetchAllVersions = true;
        /** List of schema topics with -value, -key annotations */
        this.schemaTopics = [];
        this.schemaTypeById = {};
        this.valueSchemas = {};
        this.schemaMeta = {};
        this.keySchemas = {};
        // const consume = options.consume ? options.consume.map(t => t.topic) : [];
        // const produce = options.produce ? options.produce.map(t => t.topic) : [];
        // this.selectedTopics = [...consume, ...produce];
    }
    init() {
        this.log.info('init() - Initializing SR will fetch all schemas from SR');
        return this.fetchTopics()
            .then(t => this.storeTopics(t))
            .map((t) => this.fetchLatestVersion(t), { concurrency: 10 })
            .filter(t => t ? true : false)
            .map((t) => this.fetchSchema(t), { concurrency: 10 })
            .map((t) => this.registerSchemaLatest(t))
            .then((t) => this.checkForAllVersions(t));
    }
    processSelectedTopics() {
        return new Promise(resolve => {
            const topics = [];
            this.selectedTopics.forEach(selectedTopic => {
                topics.push(selectedTopic + '-value');
                topics.push(selectedTopic + '-key');
            });
            resolve(topics);
        });
    }
    fetchAllSchemaTopics() {
        return new Promise(resolve => {
            const fetchAllTopicsUrl = url.resolve(this.options.schemaRegistry, '/subjects');
            this.log.debug(`fetchAllSchemaTopics() - Fetching all schemas using url: ${fetchAllTopicsUrl}`);
            return Promise.resolve(axios_1.default.get(fetchAllTopicsUrl))
                .then((response) => {
                this.log.info(`fetchAllSchemaTopics() - Fetched total schemas: ${response.data.length}.`);
                resolve(response.data);
            })
                .catch(this.suppressAxiosError);
        });
    }
    suppressAxiosError(err) {
        if (!err.response) {
            // not an axios error, bail early
            throw err;
        }
        this.log.debug('suppressAxiosError() - http error, will continue operation.', { error: err.message, url: err.config.url });
        return null;
    }
    registerSchemaLatest(schemaObj) {
        return new Promise(resolve => {
            this.log.debug(`registerSchemaLatest() - Registering schema: ${schemaObj.topic}`);
            try {
                schemaObj.type = avro.Type.forSchema(JSON.parse(schemaObj.responseRaw.schema), { wrapUnions: true });
            }
            catch (ex) {
                this.log.warn('registerSchemaLatest() - Error parsing schema... moving on:', {
                    topic: schemaObj.schemaTopicRaw,
                    error: ex.message
                });
                resolve(schemaObj);
            }
            this.log.debug(`registerSchemaLatest() - Registered schema: ${schemaObj.topic}`);
            if (schemaObj.schemaType.toLowerCase() === 'value') {
                this.schemaTypeById['schema-' + schemaObj.responseRaw.id] = schemaObj.type;
                this.valueSchemas[schemaObj.topic] = schemaObj.type;
                this.schemaMeta[schemaObj.topic] = schemaObj.responseRaw;
            }
            else {
                this.keySchemas[schemaObj.topic] = schemaObj.type;
            }
            resolve(schemaObj);
        });
    }
    storeTopics(schemaTopics) {
        this.schemaTopics = schemaTopics;
        return schemaTopics;
    }
    fetchLatestVersion(schemaTopic) {
        return new Promise(resolve => {
            const fetchLatestVersionUrl = url.resolve(this.options.schemaRegistry, `/subjects/${schemaTopic}/versions/latest`);
            this.log.debug(`fetchLatestVersion()() - Fetching latest topic version from url:\n${fetchLatestVersionUrl}`);
            return Promise.resolve(axios_1.default.get(fetchLatestVersionUrl))
                .then((response) => {
                this.log.debug('fetchLatestVersion() - Fetched latest topic version from url:', fetchLatestVersionUrl);
                resolve({
                    version: response.data.version,
                    schemaTopic: schemaTopic,
                });
            })
                .catch(this.suppressAxiosError);
        });
    }
    /**
     * After the initial schema registration is complete check if it is required to
     * fetch all the past versions for each topic and concatenate those results.
     *
     * @param {Array.<Object>} registeredSchemas The registered schemas from the first op.
     * @return {Promise(Array.<Object>)} The same schemas plus all the versions if requested.
     * @private
     */
    checkForAllVersions(registeredSchemas) {
        return new Promise(resolve => {
            if (!this.fetchAllVersions) {
                resolve(registeredSchemas);
            }
            // Fetch and register all past versions for each schema.
            return Promise.resolve(this.schemaTopics)
                .map((t) => this.fetchAllSchemaVersions(t), { concurrency: 10 })
                .filter(t => t ? true : false)
                .then(t => this.flattenResults(t))
                .map((t) => this.fetchSchema(t), { concurrency: 10 })
                .map((t) => this.registerSchema(t))
                .then((allRegisteredSchemas) => {
                resolve(registeredSchemas.concat(allRegisteredSchemas));
            });
        });
    }
    /**
   * Register the provided schema locally using avro.
   *
   * @param {Object} schemaObj Schema object as produced by fetchSchema().
   * @return {Promise(Array.<Object>)} A Promise with the object received
   *   augmented with the "type" property which stores the parsed avro schema.
   * @private
   */
    registerSchema(schemaObj) {
        return new Promise(resolve => {
            this.log.debug('registerSchema() - Registering schema:', schemaObj.topic);
            try {
                schemaObj.type = avro.Type.forSchema(JSON.parse(schemaObj.responseRaw.schema), { wrapUnions: true });
            }
            catch (ex) {
                this.log.warn('registerSchema() - Error parsing schema:', {
                    topic: schemaObj.schemaTopicRaw,
                    error: ex.message
                });
                resolve(schemaObj);
            }
            this.log.debug('registerSchema() - Registered schema:', schemaObj.topic);
            if (schemaObj.schemaType.toLowerCase() === 'value') {
                this.schemaTypeById['schema-' + schemaObj.responseRaw.id] = schemaObj.type;
            }
            resolve(schemaObj);
        });
    }
    /**
     * Fetch all available versions for a subject from the SR.
     *
     * @return {Promise(Array.<Object>)} A Promise with an array of objects
     *   containing the topic name and version number.
     * @private
     */
    fetchAllSchemaVersions(schemaTopic) {
        return new Promise(resolve => {
            const fetchVersionsUrl = url.resolve(this.options.schemaRegistry, '/subjects/' + schemaTopic + '/versions');
            this.log.debug('fetchAllSchemaVersions() - Fetching schema versions:', fetchVersionsUrl);
            return Promise.resolve(axios_1.default.get(fetchVersionsUrl))
                .then((response) => {
                this.log.debug('fetchAllSchemaVersions() - Fetched schema versions:', fetchVersionsUrl);
                resolve(response.data.map((version) => ({
                    version: version,
                    schemaTopic: schemaTopic,
                })));
            })
                .catch(this.suppressAxiosError);
        });
    }
    /**
     * Flatten the array of arrays produced by fetchAllSchemaVersions().
     *
     * @param results Results as produced by fetchAllSchemaVersions().
     * @return Flattened results.
     * @private
     */
    flattenResults(results) {
        return new Promise(resolve => {
            const flattenedResults = [];
            results.map((schemaVersions) => {
                schemaVersions.forEach(schemaVersion => {
                    flattenedResults.push(schemaVersion);
                });
            });
            resolve(flattenedResults);
        });
    }
    /**
     * A master wrapper method to determine if all topics or just specific ones
     * need to be fetched.
     *
     * @return {Promise(Array.<string>)} A Promise with an arrray of string topics.
     * @private
     */
    fetchTopics() {
        if (this.selectedTopics.length > 0) {
            return this.processSelectedTopics();
        }
        else {
            return this.fetchAllSchemaTopics();
        }
    }
    fetchSchema(topicMeta, config) {
        return new Promise(resolve => {
            const schemaTopic = topicMeta.schemaTopic;
            const version = topicMeta.version;
            const parts = schemaTopic.split('-');
            const schemaType = parts.pop();
            const topic = parts.join('-') || schemaType;
            const fetchSchemaUrl = url.resolve(this.options.schemaRegistry, `/subjects/${schemaTopic}/versions/${version}`);
            this.log.debug(`fetchSchema() - Fetching schema url: ${fetchSchemaUrl}`);
            return Promise.resolve(axios_1.default.get(fetchSchemaUrl, config))
                .then((response) => {
                this.log.debug(`fetchSchema() - Fetched schema url: ${fetchSchemaUrl}`);
                resolve({
                    version: version,
                    responseRaw: response.data,
                    schemaType: schemaType,
                    schemaTopicRaw: schemaTopic,
                    topic: topic,
                });
            })
                .catch(this.handleAxiosError);
        });
    }
    handleAxiosError(err) {
        if (!err.port) {
            // not an axios error, bail early
            throw err;
        }
        this.log.warn('handleAxiosError() - http error:', { message: err.message, url: err.config.url });
        throw err;
    }
    ;
}
exports.SchemaRegistry = SchemaRegistry;
//# sourceMappingURL=schema-registry.js.map