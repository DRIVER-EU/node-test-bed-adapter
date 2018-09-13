import { ITestBedOptions } from '../models/test-bed-options';
import * as Promise from 'bluebird';
import { default as axios, AxiosRequestConfig } from 'axios';
import * as url from 'url';
import { Logger } from '..';
import { Type } from 'avsc';
import { TestBedAdapter } from '../test-bed-adapter';

export interface ISchema {
  version: number | string;
  topic: string;
  type?: Type;
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

export class SchemaRegistry {
  /**
   * A dict containing the instance of the "avsc" package, and key the SR schema id.
   * Keys are in the form 'schema-[SCHEMA_ID]'
   *
   * @type {Object}
   */
  public schemaTypeById: { [key: string]: Type } = {};

  /**
   * A dict containing all the key schemas with key the bare topic name and
   * value the instance of the "avsc" package.
   *
   * @type {Object}
   */
  public keySchemas: { [topic: string]: { type: Type; srId: number } } = {};

  /**
   * A dict containing all the value schemas with value the instance of the "avsc" package.
   * It not only contains schemas for topics with key/value pairs, but also for topics with
   * only a schema.
   *
   * @type {Object}
   */
  public valueSchemas: { [topic: string]: { type: Type; srId: number } } = {};

  private log = Logger.instance;
  private selectedTopics: string[] = [];
  private fetchAllVersions: boolean;
  /** List of schema topics with -value, -key annotations */
  private schemaTopics: string[] = [];
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
  private schemaMeta: { [key: string]: any } = {};
  private wrapUnions: boolean | 'auto' | 'never' | 'always' = 'auto';

  constructor(private options: ITestBedOptions) {
    axios.defaults.timeout = 30000;
    this.fetchAllVersions = options.fetchAllVersions || false;
    const consume = options.consume ? options.consume.map(c => c.topic) : [];
    const produce = options.produce ? options.produce : [];
    this.wrapUnions = <boolean | 'auto' | 'never' | 'always'>(
      (options.hasOwnProperty('wrapUnions') ? options.wrapUnions : 'auto')
    );
    this.selectedTopics = [...consume, ...produce];
  }

  public init() {
    this.log.info(
      `init() - Initializing SR will fetch ${
        this.options.fetchAllVersions
          ? 'all'
          : 'requested consumer and producer'
      } schemas from SR`
    );

    const tryToInitialize = () => {
      this.isSchemaRegistryAvailable()
        .then(() => this.fetchTopics())
        .then(t => this.storeTopics(t))
        .map((t: string) => this.fetchLatestVersion(t), { concurrency: 10 })
        .filter(t => (t ? true : false))
        .map((t: ISchemaTopic) => this.fetchSchema(t), { concurrency: 10 })
        .map((t: ISchema) => this.registerSchemaLatest(t))
        .then((t: ISchema[]) => this.checkForAllVersions(t))
        .catch(e => console.error(e));
    };
    const isSuccess = () =>
      this.selectedTopics.filter(t => t !== TestBedAdapter.ConfigurationTopic).reduce(
        (p, c) => p && this.valueSchemas.hasOwnProperty(c),
        true
      );
    return new Promise<{}>(resolve => {
      let count = 0;
      const handler = setInterval(() => {
        tryToInitialize();
        if (isSuccess()) {
          clearInterval(handler);
          resolve();
        } else {
          count === 0
            ? this.log.info('Retreiving schema\'s...')
            : count > 1
              ? process.stdout.write(
                  `Schema\'s not available... waiting ${5 *
                    (count + 1)} seconds\r`
                )
              : '';
          count++;
        }
      }, 5000);
    });
  }

  private isSchemaRegistryAvailable() {
    const MAX_RETRIES = 10;
    return new Promise(resolve => {
      const srUrl = this.options.schemaRegistry;
      let retries = MAX_RETRIES;
      const intervalId = setInterval(() => {
        axios
          .get(srUrl)
          .then(() => {
            this.log.debug(
              `isSchemaRegistryAvailable - Accessed schema registry in ${MAX_RETRIES -
                retries}x.`
            );
            clearInterval(intervalId);
            resolve();
          })
          .catch(() => {
            retries--;
            this.log.warn(
              `isSchemaRegistryAvailable - Access schema registry at ${srUrl}. Retried ${MAX_RETRIES -
                retries}x.`
            );
            if (retries === 0) {
              this.log.error(
                `isSchemaRegistryAvailable - Cannot access schema registry at ${srUrl}. Retried ${MAX_RETRIES}x. Exiting...`
              );
              process.exit(1);
            }
          });
      }, 5000);
    });
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
      const fetchAllTopicsUrl = url.resolve(
        this.options.schemaRegistry,
        '/subjects'
      );
      this.log.debug(
        `fetchAllSchemaTopics() - Fetching all schemas using url: ${fetchAllTopicsUrl}`
      );

      return Promise.resolve(axios.get(fetchAllTopicsUrl))
        .then(response => {
          this.log.debug(
            `fetchAllSchemaTopics() - Fetched total schemas: ${
              response.data.length
            }.`
          );
          resolve(response.data);
        })
        .catch(err => {
          this.suppressAxiosError(err);
          resolve([]);
        });
    });
  }

  private registerSchemaLatest(schemaObj: ISchema) {
    return new Promise<ISchema>(resolve => {
      this.log.debug(
        `registerSchemaLatest() - Registering ${schemaObj.schemaType} schema: ${
          schemaObj.topic
        }`
      );

      try {
        schemaObj.type = Type.forSchema(
          JSON.parse(schemaObj.responseRaw.schema),
          { wrapUnions: this.wrapUnions }
        );
      } catch (ex) {
        this.log.warn({
          message:
            'registerSchemaLatest() - Error parsing schema... moving on:',
          topic: schemaObj.schemaTopicRaw,
          error: ex.message
        });
        resolve(schemaObj);
      }

      this.log.debug(
        `registerSchemaLatest() - Registered ${schemaObj.schemaType} schema: ${
          schemaObj.topic
        }`
      );

      this.schemaTypeById[
        'schema-' + schemaObj.responseRaw.id
      ] = schemaObj.type as Type;
      if (schemaObj.schemaType.toLowerCase() === 'key') {
        this.keySchemas[schemaObj.topic] = {
          type: schemaObj.type as Type,
          srId: schemaObj.responseRaw.id
        };
      } else {
        this.valueSchemas[schemaObj.topic] = {
          type: schemaObj.type as Type,
          srId: schemaObj.responseRaw.id
        };
        this.schemaMeta[schemaObj.topic] = schemaObj.responseRaw;
      }
      resolve(schemaObj);
    });
  }

  private storeTopics(schemaTopics: string[]) {
    return new Promise<string[]>(resolve => {
      if (this.schemaTopics.length !== schemaTopics.length) {
        this.schemaTopics = schemaTopics;
        this.log.info(`Storing ${schemaTopics.length / 2} topics.`);
      }
      resolve(schemaTopics);
    });
  }

  private fetchLatestVersion(schemaTopic: string) {
    return new Promise<ISchemaTopic>(resolve => {
      const fetchLatestVersionUrl = url.resolve(
        this.options.schemaRegistry,
        `/subjects/${schemaTopic}/versions/latest`
      );

      this.log.debug(
        `fetchLatestVersion() - Fetching latest topic version from url:\n${fetchLatestVersionUrl}`
      );

      return Promise.resolve(axios.get(fetchLatestVersionUrl))
        .then(response => {
          this.log.debug(
            'fetchLatestVersion() - Fetched latest topic version from url: ' +
              fetchLatestVersionUrl
          );

          resolve({
            version: response.data.version,
            schemaTopic: schemaTopic
          } as ISchemaTopic);
        })
        .catch(err => {
          this.suppressAxiosError(err);
          resolve();
        });
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
    return new Promise<ISchema[]>(resolve => {
      if (!this.fetchAllVersions) {
        resolve(registeredSchemas);
        return;
      }

      // Fetch and register all past versions for each schema.
      return Promise.resolve(this.schemaTopics)
        .map((t: string) => this.fetchAllSchemaVersions(t), { concurrency: 10 })
        .filter((t: ISchemaTopic[]) => (t ? true : false))
        .then((t: ISchemaTopic[][]) => this.flattenResults(t))
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
      this.log.debug(
        `registerSchema() - Registering ${schemaObj.schemaType} schema: ${
          schemaObj.topic
        }`
      );

      try {
        schemaObj.type = Type.forSchema(
          JSON.parse(schemaObj.responseRaw.schema),
          { wrapUnions: this.wrapUnions }
        );
      } catch (ex) {
        this.log.warn({
          message: 'registerSchema() - Error parsing schema:',
          topic: schemaObj.schemaTopicRaw,
          error: ex.message
        });
        resolve(schemaObj);
      }

      this.log.debug(
        `registerSchema() - Registered ${schemaObj.schemaType} schema by id ${
          schemaObj.responseRaw.id
        }: ${schemaObj.topic}`
      );

      if (schemaObj.schemaType.toLowerCase() === 'value') {
        this.schemaTypeById[
          'schema-' + schemaObj.responseRaw.id
        ] = schemaObj.type as Type;
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
  private fetchAllSchemaVersions(schemaTopic: string) {
    return new Promise<ISchemaTopic[]>(resolve => {
      const fetchVersionsUrl = url.resolve(
        this.options.schemaRegistry,
        '/subjects/' + schemaTopic + '/versions'
      );

      this.log.debug(
        'fetchAllSchemaVersions() - Fetching schema versions: ' +
          fetchVersionsUrl
      );

      return Promise.resolve(
        axios.get(fetchVersionsUrl, {
          headers: {
            Accept: 'application/vnd.schemaregistry.v1+json'
          }
        } as AxiosRequestConfig)
      )
        .then(response => {
          this.log.debug(
            'fetchAllSchemaVersions() - Fetched schema versions: ' +
              fetchVersionsUrl
          );

          resolve(
            response.data
              .filter(
                (_version: number, index: number) =>
                  index < response.data.length - 1
              ) // I already resolved the latest version
              .map((version: number) => ({
                version: version,
                schemaTopic: schemaTopic
              }))
          );
        })
        .catch(err => {
          this.suppressAxiosError(err);
          resolve();
        });
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
      config = Object.assign({
        headers: {
          Accept: 'application/vnd.schemaregistry.v1+json'
        },
        config
      } as AxiosRequestConfig);
      const schemaTopic = topicMeta.schemaTopic;
      if (!schemaTopic) {
        return resolve();
      }
      const version = topicMeta.version;
      const parts = schemaTopic.split('-');
      const schemaType = parts.pop();
      const topic = parts.join('-') || schemaType;

      const fetchSchemaUrl = url.resolve(
        this.options.schemaRegistry,
        `/subjects/${schemaTopic}/versions/${version}`
      );

      this.log.debug(`fetchSchema() - Fetching schema url: ${fetchSchemaUrl}`);

      return Promise.resolve(axios.get(fetchSchemaUrl, config))
        .then(response => {
          this.log.debug(
            `fetchSchema() - Fetched schema url: ${fetchSchemaUrl}`
          );

          resolve({
            version: version,
            responseRaw: response.data,
            schemaType: schemaType,
            schemaTopicRaw: schemaTopic,
            topic: topic
          } as ISchema);
        })
        .catch(err => this.suppressAxiosError(err));
    });
  }

  // private suppressAxiosError(err: { response: string; message: string; config: { url: string } }) {
  //   this.log.warn({
  //     message: 'suppressAxiosError() - http error, will continue operation.',
  //     error: err.message,
  //     url: err.config.url,
  //   });
  //   return null;
  // }

  private suppressAxiosError(_err: {
    port: string;
    message: string;
    config: { url: string };
  }) {
    // this.log.warn({
    //   message: 'handleAxiosError() - http error:',
    //   error: err.message,
    //   url: err.config.url
    // });
    // throw err;
  }
}
