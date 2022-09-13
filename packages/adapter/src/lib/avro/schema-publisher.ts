import {
  findMissingKeyFiles,
  findFilesInDir,
  isSchemaRegistryAvailable,
} from '../index.mjs';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import Promise from 'bluebird';
import { ITestBedOptions } from '../models';
import { default as axios } from 'axios';
import { Logger } from '../index.mjs';
import { defaultKeySchema } from './default-key-schema';

/**
 * Helper class to publish schema's to the schema registry.
 *
 * After publishing, the schema ID is returned. Although we might store
 * it and pass it on to the schema registry, that is not done, as this
 * makes things more complicated (stronger coupling between this class
 * and the schema registry). Also, we may not retreive the latest version
 * of the schema topic.
 */
export class SchemaPublisher {
  private schemaFolder: string;
  private isInitialized = false;
  private log = Logger.instance;
  private topics = [] as string[];

  constructor(private options: ITestBedOptions) {
    this.schemaFolder = path.resolve(process.cwd(), options.schemaFolder || '');
    if (options.schemaFolder && options.autoRegisterSchemas) {
      this.isInitialized = true;
    }
  }

  public init() {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) {
        return resolve();
      }
      isSchemaRegistryAvailable(this.options, this.log).then(() => {
        const files = findFilesInDir(this.schemaFolder, '.avsc');
        const missing = findMissingKeyFiles(files);
        this.topics = files
          .filter((file) => /-value/i.test(file))
          .map((file) =>
            path
              .basename(file)
              .replace(path.extname(file), '')
              .replace('-value', '')
          );
        Promise.map([...files, ...missing], (f, i) =>
          this.uploadSchema(f, i >= files.length)
        )
          .then(() => resolve())
          .catch((err) => reject(err));
      });
    });
  }

  public get uploadedSchemas() {
    return [...this.topics];
  }

  private uploadSchema(schemaFilename: string, useDefaultKeySchema: boolean) {
    return new Promise((resolve, reject) => {
      const schemaTopic = path
        .basename(schemaFilename)
        .replace(path.extname(schemaFilename), '');
      const uri = url.resolve(
        this.options.schemaRegistry,
        `subjects/${schemaTopic}/versions`
      );
      const schema = useDefaultKeySchema
        ? defaultKeySchema
        : JSON.parse(fs.readFileSync(schemaFilename, { encoding: 'utf8' }));
      this.log.info(
        `uploadSchema() - Uploading schema from ${schemaFilename} to url: ${uri}`
      );

      return Promise.resolve(
        axios.post(
          uri,
          { schema: JSON.stringify(schema) },
          {
            headers: {
              'Content-type': 'application/vnd.schemaregistry.v1+json',
            },
          }
        )
      )
        .then((response) => {
          this.log.info(
            `uploadSchema() - Uploading ${schemaTopic} to ${uri} ready.`
          );
          resolve(response.data);
        })
        .catch((err) => {
          this.suppressAxiosError(err, resolve, reject);
        });
    });
  }

  private suppressAxiosError(
    err: { response: string; message: string; config: { url: string } },
    resolve: Function,
    reject: Function
  ) {
    if (!err.response) {
      // not an axios error, bail early
      reject(err);
      throw err;
    }
    this.log.warn({
      message: 'suppressAxiosError() - http error, will continue operation.',
      error: err.message,
      url: err.config.url,
    });
    resolve();
  }
}
