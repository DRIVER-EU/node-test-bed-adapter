import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as Promise from 'bluebird';
import { findFilesInDir } from './../utils/helpers';
import { ITestBedOptions } from './../models/test-bed-options';
import { default as axios, AxiosRequestConfig } from 'axios';
import { Logger } from '..';

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
  private schemaRegistryUrl: string;
  private schemaFolder: string;
  private isInitialized = false;
  private log = Logger.instance;

  constructor(options: ITestBedOptions) {
    this.schemaRegistryUrl = options.schemaRegistry;
    this.schemaFolder = path.resolve(process.cwd(), (options.schemaFolder || ''));
    if (options.schemaFolder && options.autoRegisterSchemas) {
      this.isInitialized = true;
    }
  }

  public init() {
    return new Promise((resolve, reject) => {
      if (!this.isInitialized) { reject('SchemaPublisher.init() - is not initialized!'); }
      const files = findFilesInDir(this.schemaFolder, '.avsc');
      Promise.map(files, f => this.uploadSchema(f))
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }

  private uploadSchema(schemaFilename: string) {
    return new Promise(resolve => {
      const schemaTopic = path.basename(schemaFilename)
        .replace(path.extname(schemaFilename), '');
      const uri = url.resolve(this.schemaRegistryUrl, `/subjects/${schemaTopic}/versions`);
      const schema = JSON.parse(fs.readFileSync(schemaFilename, { encoding: 'utf8' }));
      this.log.debug(`uploadSchema() - Uploading schema from ${schemaFilename} to url: ${uri}`);

      return Promise.resolve(axios.post(uri, { schema: JSON.stringify(schema) }, {
        headers: { 'Content-type': 'application/vnd.schemaregistry.v1+json' }
      }))
        .then((response) => {
          this.log.info(`uploadSchema() - Uploading ${schemaTopic} to ${uri} ready.`);
          resolve(response.data);
        })
        .catch(err => {
          this.suppressAxiosError(err);
          resolve();
        });
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
}