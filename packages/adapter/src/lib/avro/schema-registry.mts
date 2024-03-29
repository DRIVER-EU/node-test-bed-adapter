import { default as axios, AxiosRequestConfig } from 'axios';
import avsc from 'avsc';
import { ITestBedOptions } from '../models/index.mjs';
import { Logger } from '../logger/index.mjs';
import {
  isUnique,
  isSchemaRegistryAvailable,
  resolveUrl,
} from '../utils/index.mjs';
import { HeartbeatTopic, LogTopic } from '../avro/index.mjs';

export interface ISchema {
  version: number | string;
  topic: string;
  type?: avsc.Type;
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

export type SchemaInfo = {
  srId: number;
  type: avsc.Type;
  // jsonSchema: Record<string, any>;
  // openApiModel: Record<string, any>;
};

export class SchemaRegistry {
  /**
   * A dict containing the instance of the "avsc" package, and key the SR schema id.
   * Keys are in the form 'schema-[SCHEMA_ID]'
   */
  public schemaTypeById: { [key: string]: avsc.Type } = {};

  /**
   * A dict containing all the key schemas with key the bare topic name and
   * value the instance of the "avsc" package.
   */
  public keySchemas: { [topic: string]: SchemaInfo } = {};

  /**
   * A dict containing all the value schemas with value the instance of the "avsc" package.
   * It not only contains schemas for topics with key/value pairs, but also for topics with
   * only a schema.
   */
  public valueSchemas: { [topic: string]: SchemaInfo } = {};

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
  private wrapUnions: boolean | 'auto' | 'never' | 'always';

  constructor(private options: ITestBedOptions) {
    axios.defaults.timeout = 30000;
    this.wrapUnions = options.wrapUnions || 'auto';
    this.fetchAllVersions = options.fetchAllVersions || false;
    const consume = options.consume
      ? options.consume instanceof Array
        ? options.consume
        : [options.consume]
      : [];
    const produce = options.produce
      ? options.produce instanceof Array
        ? options.produce
        : [options.produce]
      : [];
    this.selectedTopics = [...consume, ...produce].filter(isUnique);
  }

  public async init() {
    this.log.info(
      `init() - Initializing SR will fetch ${
        this.options.fetchAllSchemas ? 'all' : 'requested consumer and producer'
      } schemas from SR${
        this.options.fetchAllVersions ? ' (all versions)' : ''
      }.`
    );

    const tryToInitialize = async () => {
      try {
        await isSchemaRegistryAvailable(this.options, this.log)
          .then(() => this.fetchTopics())
          .then((t) => this.storeTopics(t))
          .then((topics) =>
            Promise.all(
              topics.map((t) => this.fetchLatestVersion(t), {
                concurrency: 10,
              })
            )
          )
          .then((topics) => topics.filter((t) => (t ? true : false)))
          .then((topics) =>
            Promise.all(
              topics.map((t) => this.fetchSchema(t!), { concurrency: 10 })
            )
          )
          .then((schemas) =>
            Promise.all(schemas.map((t) => this.registerSchemaLatest(t)))
          )
          .then((schemas) =>
            Promise.resolve(this.checkForAllVersions(schemas))
          );
      } catch (e: any) {
        throw new Error(`Schema registry initialization failed (${e}).`);
      }
    };

    const missingSchemas = () =>
      this.selectedTopics.filter((t) => !this.valueSchemas.hasOwnProperty(t));
    const isSuccess = () => {
      const missing = missingSchemas();
      return missing.length === 0 || (missing.length === 1 && !missing[0]);
    };

    const tryingToInitializeSchemas = async () => {
      let count = 0;
      await tryToInitialize().catch((e) => {
        throw new Error(e);
      });
      if (isSuccess()) {
        return;
      } else {
        const ms = `Missing schema's: ${JSON.stringify(missingSchemas())}`;
        count <= 3
          ? this.log.info(ms)
          : process.stdout.write(`${ms}... waiting ${5 * count} seconds\r`) &&
            this.log.warn(ms);
        count++;
        setTimeout(tryingToInitializeSchemas, 5 * count);
      }
    };
    await tryingToInitializeSchemas();
  }

  /** Register a new topic */
  public async registerNewTopic(newTopic: string) {
    const topics: string[] = [];
    const vs = `${newTopic}-value`;
    if (this.schemaTopics.indexOf(vs) < 0) {
      topics.push(vs);
    }
    const ks = `${newTopic}-key`;
    if (this.schemaTopics.indexOf(ks) < 0) {
      topics.push(ks);
    }
    if (topics.length === 0) {
      // Nothing to resolve
      return true;
    }
    try {
      const schemaTopics = await Promise.all(
        topics.map((t) => this.fetchLatestVersion(t), { concurrency: 10 })
      );
      const schemas = await Promise.all(
        schemaTopics.map((t) => this.fetchSchema(t!), { concurrency: 10 })
      );
      await Promise.all(schemas.map((t) => this.registerSchemaLatest(t)));
      this.schemaTopics = [...this.schemaTopics, ...topics];
      return true;
    } catch (e) {
      this.log.error(e as string);
      return false;
    }
  }

  public unregisterTopic(topic: string) {
    const t = `${topic}-value`;
    const k = `${topic}-key`;
    const i = this.schemaTopics.indexOf(t);
    if (i < 0) {
      return;
    }
    this.schemaTopics = this.schemaTopics.filter((st) => st !== t && st !== k);
  }

  private processSelectedTopics() {
    return new Promise<string[]>((resolve) => {
      const topics: string[] = [];

      this.selectedTopics
        .filter((t) => !this.valueSchemas.hasOwnProperty(t))
        .forEach((selectedTopic) => {
          topics.push(selectedTopic + '-value');
          topics.push(selectedTopic + '-key');
        });

      resolve(topics);
    });
  }

  /** Get all the topics that are registered with the schema registry */
  private fetchAllSchemaTopics() {
    return new Promise<string[]>(async (resolve) => {
      const fetchAllTopicsUrl = resolveUrl(
        this.options.schemaRegistry,
        'subjects'
      );
      this.log.debug(
        `fetchAllSchemaTopics() - Fetching all schemas using url: ${fetchAllTopicsUrl}`
      );

      try {
        const response = await Promise.resolve(axios.get(fetchAllTopicsUrl));
        this.log.debug(
          `fetchAllSchemaTopics() - Fetched total schemas: ${response.data.length}.`
        );
        resolve(response.data);
      } catch (err: any) {
        this.suppressAxiosError(err);
        resolve([]);
      }
    });
  }

  private registerSchemaLatest(schemaObj: ISchema) {
    return new Promise<ISchema>((resolve) => {
      this.log.debug(
        `registerSchemaLatest() - Registering ${schemaObj.schemaType} schema: ${schemaObj.topic}`
      );

      try {
        schemaObj.type = avsc.Type.forSchema(
          JSON.parse(schemaObj.responseRaw.schema),
          {
            wrapUnions: this.wrapUnionType(schemaObj.topic),
          }
        );
      } catch (ex) {
        this.log.warn({
          message:
            'registerSchemaLatest() - Error parsing schema... moving on:',
          topic: schemaObj.schemaTopicRaw,
          error: (ex as Record<string, unknown>).message,
        });
        resolve(schemaObj);
      }

      this.log.debug(
        `registerSchemaLatest() - Registered ${schemaObj.schemaType} schema: ${schemaObj.topic}`
      );

      const type = schemaObj.type as avsc.Type;
      // const jsonSchema = avroToJSONSchema((type as any).getSchema());
      // console.log(jsonSchema);

      // const openApiModel = await toOpenApi({
      //   $schema: 'http://json-schema.org/draft-04/schema#',
      //   title: 'Person',
      //   description: 'some description',
      //   type: 'object',
      //   properties: {
      //     name: {
      //       description: 'name',
      //       type: 'string',
      //     },
      //     favorite_number: {
      //       type: 'number',
      //     },
      //     favorite_color: {
      //       type: 'string',
      //     },
      //   },
      //   required: ['name', 'favorite_number', 'favorite_color'],
      // });
      // const openApiModel = await toOpenApi(jsonSchema);
      // console.log(openApiModel);
      this.schemaTypeById['schema-' + schemaObj.responseRaw.id] = type;
      if (schemaObj.schemaType.toLowerCase() === 'key') {
        this.keySchemas[schemaObj.topic] = {
          srId: schemaObj.responseRaw.id,
          type,
          // jsonSchema: {},
          // openApiModel: {},
        };
      } else {
        this.valueSchemas[schemaObj.topic] = {
          srId: schemaObj.responseRaw.id,
          type,
          // jsonSchema: {},
          // openApiModel: {},
        };
        this.schemaMeta[schemaObj.topic] = schemaObj.responseRaw;
      }
      resolve(schemaObj);
    });
  }

  private storeTopics(schemaTopics: string[]) {
    return new Promise<string[]>((resolve) => {
      if (this.schemaTopics.length !== schemaTopics.length) {
        const getTopics = () =>
          schemaTopics
            .filter((t) => t.indexOf('-value') > 0)
            .map((t) => t.substr(0, t.indexOf('-value')))
            .join(', ');
        this.schemaTopics = schemaTopics;
        this.log.info(
          `Storing ${schemaTopics.length / 2} topics: ${getTopics()}`
        );
      }
      resolve(schemaTopics);
    });
  }

  /** Fetch the latest version of a topic */
  private fetchLatestVersion(schemaTopic: string) {
    return new Promise<ISchemaTopic | void>((resolve) => {
      const fetchLatestVersionUrl = resolveUrl(
        this.options.schemaRegistry,
        `subjects/${schemaTopic}/versions/latest`
      );

      this.log.debug(
        `fetchLatestVersion() - Fetching latest topic version from url:\n${fetchLatestVersionUrl}`
      );

      return Promise.resolve(axios.get(fetchLatestVersionUrl))
        .then((response) => {
          this.log.debug(
            'fetchLatestVersion() - Fetched latest topic version from url: ' +
              fetchLatestVersionUrl
          );

          resolve({
            version: response.data.version,
            schemaTopic: schemaTopic,
          } as ISchemaTopic);
        })
        .catch((err) => {
          this.suppressAxiosError(err);
          resolve();
        });
    });
  }

  /**
   * After the initial schema registration is complete check if it is required to
   * fetch all the past versions for each topic and concatenate those results.
   *
   * @param {ISchema[]} registeredSchemas The registered schemas from the first op.
   * @return {Promise(Array.<Object>)} The same schemas plus all the versions if requested.
   * @private
   */
  private checkForAllVersions(registeredSchemas: ISchema[]): Promise<any> {
    return new Promise<ISchema[]>((resolve) => {
      if (!this.fetchAllVersions) {
        resolve(registeredSchemas);
        return;
      }

      // Fetch and register all past versions for each schema.
      return Promise.resolve(this.schemaTopics)
        .then((t) =>
          Promise.all(
            t.map((t: string) => this.fetchAllSchemaVersions(t), {
              concurrency: 10,
            })
          )
        )
        .then((topics) =>
          topics.filter((t: ISchemaTopic[]) => (t ? true : false))
        )
        .then((t: ISchemaTopic[][]) => Promise.resolve(this.flattenResults(t)))
        .then((topics) =>
          Promise.all(
            topics.map((t: ISchemaTopic) => this.fetchSchema(t), {
              concurrency: 10,
            })
          )
        )
        .then((schemas) =>
          Promise.all(schemas.map((t: ISchema) => this.registerSchema(t)))
        )
        .then((allRegisteredSchemas: ISchema[]) =>
          resolve(registeredSchemas.concat(allRegisteredSchemas))
        );
    });
  }

  private wrapUnionType(schemaType: string) {
    switch (schemaType) {
      case HeartbeatTopic:
      case LogTopic:
        return 'auto';
      default:
        return this.wrapUnions;
    }
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
    return new Promise<ISchema>((resolve) => {
      this.log.debug(
        `registerSchema() - Registering ${schemaObj.schemaType} schema: ${schemaObj.topic}`
      );

      try {
        schemaObj.type = avsc.Type.forSchema(
          JSON.parse(schemaObj.responseRaw.schema),
          {
            wrapUnions: this.wrapUnionType(schemaObj.topic),
          }
        );
      } catch (ex) {
        this.log.warn({
          message: 'registerSchema() - Error parsing schema:',
          topic: schemaObj.schemaTopicRaw,
          error: (ex as Record<string, unknown>).message,
        });
        resolve(schemaObj);
      }

      this.log.debug(
        `registerSchema() - Registered ${schemaObj.schemaType} schema by id ${schemaObj.responseRaw.id}: ${schemaObj.topic}`
      );

      if (schemaObj.schemaType.toLowerCase() === 'value') {
        this.schemaTypeById['schema-' + schemaObj.responseRaw.id] =
          schemaObj.type as avsc.Type;
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
    return new Promise<ISchemaTopic[]>((resolve) => {
      const fetchVersionsUrl = resolveUrl(
        this.options.schemaRegistry,
        'subjects/' + schemaTopic + '/versions'
      );

      this.log.debug(
        'fetchAllSchemaVersions() - Fetching schema versions: ' +
          fetchVersionsUrl
      );

      return Promise.resolve(
        axios.get(fetchVersionsUrl, {
          headers: {
            Accept: 'application/vnd.schemaregistry.v1+json',
          },
        } as AxiosRequestConfig)
      )
        .then((response) => {
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
                schemaTopic: schemaTopic,
              }))
          );
        })
        .catch((err) => {
          this.suppressAxiosError(err);
          resolve([]);
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
    return new Promise<ISchemaTopic[]>((resolve) => {
      const flattenedResults: ISchemaTopic[] = [];
      results.map((schemaVersions: ISchemaTopic[]) => {
        schemaVersions.forEach((schemaVersion) => {
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
   * @return A Promise with an arrray of string topics.
   * @private
   */
  private async fetchTopics() {
    return this.options.fetchAllSchemas
      ? this.fetchAllSchemaTopics()
      : this.processSelectedTopics();
  }

  private fetchSchema(topicMeta: ISchemaTopic, config?: AxiosRequestConfig) {
    return new Promise<ISchema>((resolve) => {
      config = Object.assign({
        headers: {
          Accept: 'application/vnd.schemaregistry.v1+json',
        },
        config,
      } as AxiosRequestConfig);
      const schemaTopic = topicMeta.schemaTopic;
      if (!schemaTopic) {
        return resolve({} as ISchema);
      }
      const version = topicMeta.version;
      const parts = schemaTopic.split('-');
      const schemaType = parts.pop();
      const topic = parts.join('-') || schemaType;

      const fetchSchemaUrl = resolveUrl(
        this.options.schemaRegistry,
        `subjects/${schemaTopic}/versions/${version}`
      );

      this.log.debug(`fetchSchema() - Fetching schema url: ${fetchSchemaUrl}`);

      return Promise.resolve(axios.get(fetchSchemaUrl, config))
        .then((response) => {
          this.log.debug(
            `fetchSchema() - Fetched schema url: ${fetchSchemaUrl}`
          );

          resolve({
            version,
            responseRaw: response.data,
            schemaType,
            schemaTopicRaw: schemaTopic,
            topic,
          } as ISchema);
        })
        .catch((err) => this.suppressAxiosError(err));
    });
  }

  private suppressAxiosError(_err: {
    port: string;
    message: string;
    config: { url: string };
  }) {}
}
