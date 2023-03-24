import { existsSync, readdirSync, lstatSync } from 'fs';
import { default as axios } from 'axios';
import * as path from 'path';
import { Readable } from 'stream';
import { DataType, ILargeDataUpdate } from 'test-bed-schemas';
import { TestBedAdapter, RecordMetadata } from '../index.mjs';
import { LargeDataUpdateTopic } from '../avro/index.mjs';
import { AdapterProducerRecord, ITestBedOptions } from '../models/index.mjs';
import { Logger } from '../logger/logger.mjs';

export const clone = <T extends any>(model: T) => {
  return JSON.parse(JSON.stringify(model)) as T;
};

/**
 * Find all files recursively in specific folder with specific extension
 *
 * @param directoryName Path relative to this file or other file which requires this files
 * @param ext Extension name, e.g: '.html'
 * @return Result files with path string in an array
 */
export const findFilesInDir = (directoryName: string, ext: string) => {
  ext = (ext[0] === '.' ? ext : `.${ext}`).toLowerCase();
  let results: string[] = [];

  if (!existsSync(directoryName)) {
    console.error(`Error - Directory ${directoryName} does not exist`);
    return [];
  }

  readdirSync(directoryName).forEach((f) => {
    const filename = path.join(directoryName, f);
    const stat = lstatSync(filename);
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, ext)); // recurse
    } else if (path.extname(filename).toLowerCase() === ext) {
      results.push(filename);
    }
  });
  return results;
};

/**
 * Look for schema files that represent a value, but without a corresponding key file, i.e.
 * a schema file names <topic>-value.avsc should also have a <topic>-key.avsc.
 *
 * @param files Found schema files
 * @return missing key schema files
 */
export const findMissingKeyFiles = (files: string[]) => {
  return files
    .filter((f) => path.basename(f).indexOf('-value.avsc') >= 0)
    .reduce((p, c) => {
      const keyFile = c.replace('-value.avsc', '-key.avsc');
      if (files.filter((f) => f.indexOf(keyFile) >= 0).length > 0) {
        return p;
      }
      p.push(keyFile);
      return p;
    }, [] as string[]);
};

/**
 * Create a RFC4122 version 4 GUID
 *
 * @see https://stackoverflow.com/a/2117523/319711
 *
 * @returns RFC4122 version 4 compliant GUID
 */
export const uuid4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    // tslint:disable-next-line:no-bitwise
    const r = (Math.random() * 16) | 0;
    // tslint:disable-next-line:no-bitwise
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Check if the object is empty.
 * @param obj Any object
 * @see https://stackoverflow.com/a/32108184/319711
 */
export const isEmptyObject = (obj: Object) =>
  Object.keys(obj).length === 0 && obj.constructor === Object;

/** Convert a buffer to a readable stream, e.g. to send it via FormData */
export const bufferToStream = (buffer: Buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

/**
 * Helper function to create a callback that automatically sends a large file upload message
 * to the Test-bed's LargeDataUpdateTopic (system_large_data_update). This callback can be
 * passed to the uploadFile function of the adapter.
 *
 * @param adapter test bed adapter, needed to send the message
 * @param title title of the large file upload message
 * @param description description of the large file upload message
 * @param dataType data type of the message
 * @param callback to return the result of the large file upload (default logs errors)
 */
export const largeFileUploadCallback = (
  adapter: TestBedAdapter,
  title?: string,
  description?: string,
  dataType = DataType.other,
  cb: (err: Error, data?: RecordMetadata[]) => void = (err) =>
    err ? Logger.instance.error(err) : undefined
) => {
  return (err?: Error, url?: string) => {
    if (err) {
      return cb(err);
    }
    const msg = {
      url,
      title,
      description,
      dataType,
    } as ILargeDataUpdate;
    const payload: AdapterProducerRecord = {
      topic: LargeDataUpdateTopic,
      messages: [{ value: msg }],
    };
    adapter.send(payload, cb);
  };
};

/** Is unique filter for array filter method */
export const isUnique = <T extends any>(value: T, index: number, arr: T[]) =>
  arr.indexOf(value) === index;

/** Check if the schema registry is available */
export const isSchemaRegistryAvailable = (
  options: ITestBedOptions,
  log: Logger
) => {
  const timeout = (options.retryTimeout || 5) * 1000;
  const maxRetries = options.maxConnectionRetries || 20;
  return new Promise<void>((resolve) => {
    let retries = maxRetries;
    const intervalId = setInterval(() => {
      const url = resolveUrl(options.schemaRegistry, 'subjects');
      axios
        .get(url)
        .then(() => {
          log.info(
            `isSchemaRegistryAvailable - Accessed schema registry in ${
              maxRetries - retries
            }x.`
          );
          clearInterval(intervalId);
          resolve();
        })
        .catch(() => {
          retries--;
          log.warn(
            `isSchemaRegistryAvailable - Failed to access schema registry at ${url}. Retried ${
              maxRetries - retries
            }x.`
          );
          if (retries === 0) {
            log.error(
              `isSchemaRegistryAvailable - Cannot access schema registry at ${url}. Retried ${maxRetries}x. Exiting...`
            );
            process.exit(1);
          }
        });
    }, timeout);
  });
};

export const resolveUrl = (from: string, to: string) => {
  const resolvedUrl = new URL(to, new URL(from, 'resolve://'));
  if (resolvedUrl.protocol === 'resolve:') {
    // `from` is a relative URL.
    const { pathname, search, hash } = resolvedUrl;
    return pathname + search + hash;
  }
  return resolvedUrl.toString();
};
