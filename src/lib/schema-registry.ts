import { ITestBedOptions } from './models/test-bed-options';
import * as Promise from 'bluebird';
import { default as axios, AxiosRequestConfig } from 'axios';
import * as url from 'url';
import * as avro from 'avsc';
import { Logger } from '.';

export interface ISchema {
  version: number | string;
  topic: string;
  type?: any; // IAvroSchema
  schemaType: string;
  schemaTopicRaw: string;
  responseRaw: {
    schema: string;
    id: number
  };
}

export interface ISchemaTopic { version: string; schemaTopic: string; }

export class SchemaRegistry {
  private log = Logger.instance;
  private selectedTopics: string[] = [];
  private fetchAllVersions: boolean = true;
  /** List of schema topics with -value, -key annotations */
  private schemaTopics: string[] = [];
  private schemaTypeById: { [key: string]: any } = {};
  private valueSchemas: { [key: string]: any } = {};
  private schemaMeta: { [key: string]: any } = {};
  private keySchemas: { [key: string]: any } = {};

  constructor(private options: ITestBedOptions) {
    // const consume = options.consume ? options.consume.map(t => t.topic) : [];
    // const produce = options.produce ? options.produce.map(t => t.topic) : [];
    // this.selectedTopics = [...consume, ...produce];
  }

  public init() {
    this.log.info('init() - Initializing SR will fetch all schemas from SR');

    return this.fetchTopics()
      .then(t => this.storeTopics(t))
      .map((t: string) => this.fetchLatestVersion(t), { concurrency: 10 })
      .filter(t => t ? true : false)
      .map((t: ISchemaTopic) => this.fetchSchema(t), { concurrency: 10 })
      .map((t: ISchema) => this.registerSchemaLatest(t))
      .then((t: ISchema[]) => this.checkForAllVersions(t));
  }

  private processSelectedTopics() {
    return new Promise<string[]>(resolve => {
      const topics: string[] = [];

      this.selectedTopics.forEach(selectedTopic => {
        topics.push(selectedTopic + '-value');
        topics.push(selectedTopic + '-key');
      });

      resolve(topics);
    });
  }

  private fetchAllSchemaTopics() {
    return new Promise<string[]>(resolve => {
      const fetchAllTopicsUrl = url.resolve(this.options.schemaRegistry, '/subjects');
      this.log.debug(`fetchAllSchemaTopics() - Fetching all schemas using url: ${fetchAllTopicsUrl}`);

      return Promise.resolve(axios.get(fetchAllTopicsUrl))
        .then((response) => {
          this.log.info(`fetchAllSchemaTopics() - Fetched total schemas: ${response.data.length}.`);
          resolve(response.data);
        })
        .catch(this.suppressAxiosError);
    });
  }

  private suppressAxiosError(err: { response: string; message: string; config: { url: string }; }) {
    if (!err.response) {
      // not an axios error, bail early
      throw err;
    }
    this.log.debug('suppressAxiosError() - http error, will continue operation.',
      { error: err.message, url: err.config.url });
    return null;
  }

  private registerSchemaLatest(schemaObj: ISchema) {
    return new Promise<ISchema>(resolve => {
      this.log.debug(`registerSchemaLatest() - Registering schema: ${schemaObj.topic}`);

      try {
        schemaObj.type = avro.Type.forSchema(JSON.parse(schemaObj.responseRaw.schema), { wrapUnions: true });
      } catch (ex) {
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
      } else {
        this.keySchemas[schemaObj.topic] = schemaObj.type;
      }
      resolve(schemaObj);
    });
  }

  private storeTopics(schemaTopics: string[]) {
    this.schemaTopics = schemaTopics;
    return schemaTopics;
  }

  private fetchLatestVersion(schemaTopic: string) {
    return new Promise<ISchemaTopic>(resolve => {
      const fetchLatestVersionUrl = url.resolve(this.options.schemaRegistry, `/subjects/${schemaTopic}/versions/latest`);

      this.log.debug(`fetchLatestVersion()() - Fetching latest topic version from url:\n${fetchLatestVersionUrl}`);

      return Promise.resolve(axios.get(fetchLatestVersionUrl))
        .then((response) => {
          this.log.debug('fetchLatestVersion() - Fetched latest topic version from url:', fetchLatestVersionUrl);

          resolve({
            version: response.data.version,
            schemaTopic: schemaTopic,
          } as ISchemaTopic);
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
  private checkForAllVersions(registeredSchemas: ISchema[]) {
    return new Promise(resolve => {
      if (!this.fetchAllVersions) {
        resolve(registeredSchemas);
      }

      // Fetch and register all past versions for each schema.
      return Promise.resolve(this.schemaTopics)
        .map((t: ISchemaTopic) => this.fetchAllSchemaVersions(t), { concurrency: 10 })
        .filter(t => t ? true : false)
        .then(t => this.flattenResults(t))
        .map((t: ISchemaTopic) => this.fetchSchema(t), { concurrency: 10 })
        .map((t: ISchema) => this.registerSchema(t))
        .then((allRegisteredSchemas: ISchema[]) => {
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
  private registerSchema(schemaObj: ISchema) {
    return new Promise<ISchema>(resolve => {
      this.log.debug('registerSchema() - Registering schema:', schemaObj.topic);

      try {
        schemaObj.type = avro.Type.forSchema(JSON.parse(schemaObj.responseRaw.schema), { wrapUnions: true });
      } catch (ex) {
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
  private fetchAllSchemaVersions(schemaTopic: ISchemaTopic) {
    return new Promise(resolve => {
      const fetchVersionsUrl = url.resolve(this.options.schemaRegistry, '/subjects/' + schemaTopic + '/versions');

      this.log.debug('fetchAllSchemaVersions() - Fetching schema versions:', fetchVersionsUrl);

      return Promise.resolve(axios.get(fetchVersionsUrl))
        .then((response) => {
          this.log.debug('fetchAllSchemaVersions() - Fetched schema versions:', fetchVersionsUrl);

          resolve(response.data.map((version: string) => ({
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
  private flattenResults(results: ISchemaTopic[][]) {
    return new Promise<ISchemaTopic[]>(resolve => {
      const flattenedResults: ISchemaTopic[] = [];
      results.map((schemaVersions: ISchemaTopic[]) => {
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
  private fetchTopics() {
    if (this.selectedTopics.length > 0) {
      return this.processSelectedTopics();
    } else {
      return this.fetchAllSchemaTopics();
    }
  }

  private fetchSchema(topicMeta: ISchemaTopic, config?: AxiosRequestConfig) {
    return new Promise<ISchema>(resolve => {
      const schemaTopic = topicMeta.schemaTopic;
      const version = topicMeta.version;
      const parts = schemaTopic.split('-');
      const schemaType = parts.pop();
      const topic = parts.join('-') || schemaType;

      const fetchSchemaUrl = url.resolve(this.options.schemaRegistry, `/subjects/${schemaTopic}/versions/${version}`);

      this.log.debug(`fetchSchema() - Fetching schema url: ${fetchSchemaUrl}`);

      return Promise.resolve(axios.get(fetchSchemaUrl, config))
        .then((response) => {
          this.log.debug(`fetchSchema() - Fetched schema url: ${fetchSchemaUrl}`);

          resolve({
            version: version,
            responseRaw: response.data,
            schemaType: schemaType,
            schemaTopicRaw: schemaTopic,
            topic: topic,
          } as ISchema);
        })
        .catch(this.handleAxiosError);
    });
  }

  private handleAxiosError(err: { port: string; message: string, config: { url: string } }) {
    if (!err.port) {
      // not an axios error, bail early
      throw err;
    }
    this.log.warn('handleAxiosError() - http error:', { message: err.message, url: err.config.url });
    throw err;
  };
}