"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const url = require("url");
const Promise = require("bluebird");
const axios_1 = require("axios");
const __1 = require("..");
/**
 * Helper class to publish schema's to the schema registry.
 *
 * After publishing, the schema ID is returned. Although we might store
 * it and pass it on to the schema registry, that is not done, as this
 * makes things more complicated (stronger coupling between this class
 * and the schema registry). Also, we may not retreive the latest version
 * of the schema topic.
 */
class SchemaPublisher {
    constructor(options) {
        this.isInitialized = false;
        this.log = __1.Logger.instance;
        this.schemaRegistryUrl = options.schemaRegistry;
        this.schemaFolder = path.resolve(process.cwd(), options.schemaFolder || '');
        this.retryTimeout = options.retryTimeout ? options.retryTimeout : 5;
        this.maxConnectionRetries = options.maxConnectionRetries ? options.maxConnectionRetries : 10;
        if (options.schemaFolder && options.autoRegisterSchemas) {
            this.isInitialized = true;
        }
    }
    init() {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                return resolve();
            }
            this.isSchemaRegistryAvailable().then(() => {
                const files = helpers_1.findFilesInDir(this.schemaFolder, '.avsc');
                Promise.map(files, (f) => this.uploadSchema(f)).then(() => resolve()).catch((err) => reject(err));
            });
        });
    }
    isSchemaRegistryAvailable() {
        const MAX_RETRIES = this.maxConnectionRetries;
        const RETRY_TIMEOUT = this.retryTimeout * 1000;
        return new Promise((resolve) => {
            const srUrl = this.schemaRegistryUrl;
            let retries = MAX_RETRIES;
            const intervalId = setInterval(() => {
                axios_1.default
                    .get(srUrl)
                    .then(() => {
                    this.log.info(`isSchemaRegistryAvailable - Accessed schema registry in ${MAX_RETRIES - retries}x.`);
                    clearInterval(intervalId);
                    resolve();
                })
                    .catch(() => {
                    retries--;
                    this.log.warn(`isSchemaRegistryAvailable - Failed to access schema registry at ${srUrl}. Retried ${MAX_RETRIES -
                        retries}x.`);
                    if (retries === 0) {
                        this.log.error(`isSchemaRegistryAvailable - Cannot access schema registry at ${srUrl}. Retried ${MAX_RETRIES}x. Exiting...`);
                        process.exit(1);
                    }
                });
            }, RETRY_TIMEOUT);
        });
    }
    uploadSchema(schemaFilename) {
        return new Promise((resolve, reject) => {
            const schemaTopic = path.basename(schemaFilename).replace(path.extname(schemaFilename), '');
            const uri = url.resolve(this.schemaRegistryUrl, `/subjects/${schemaTopic}/versions`);
            const schema = JSON.parse(fs.readFileSync(schemaFilename, { encoding: 'utf8' }));
            this.log.debug(`uploadSchema() - Uploading schema from ${schemaFilename} to url: ${uri}`);
            return Promise.resolve(axios_1.default.post(uri, { schema: JSON.stringify(schema) }, {
                headers: { 'Content-type': 'application/vnd.schemaregistry.v1+json' }
            }))
                .then((response) => {
                this.log.info(`uploadSchema() - Uploading ${schemaTopic} to ${uri} ready.`);
                resolve(response.data);
            })
                .catch((err) => {
                this.suppressAxiosError(err, resolve, reject);
            });
        });
    }
    suppressAxiosError(err, resolve, reject) {
        if (!err.response) {
            // not an axios error, bail early
            reject(err);
            throw err;
        }
        this.log.debug('suppressAxiosError() - http error, will continue operation.', {
            error: err.message,
            url: err.config.url
        });
        resolve();
    }
}
exports.SchemaPublisher = SchemaPublisher;
//# sourceMappingURL=schema-publisher.js.map