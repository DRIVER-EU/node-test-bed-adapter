"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const url = require("url");
const Promise = require("bluebird");
const helpers_1 = require("./../utils/helpers");
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
        this.schemaFolder = path.resolve(process.cwd(), (options.schemaFolder || ''));
        if (options.schemaFolder && options.autoRegisterSchemas) {
            this.isInitialized = true;
        }
    }
    init() {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized) {
                reject('SchemaPublisher.init() - is not initialized!');
            }
            const files = helpers_1.findFilesInDir(this.schemaFolder, '.avsc');
            Promise.map(files, f => this.uploadSchema(f))
                .then(() => resolve())
                .catch(err => reject(err));
        });
    }
    uploadSchema(schemaFilename) {
        return new Promise(resolve => {
            const schemaTopic = path.basename(schemaFilename)
                .replace(path.extname(schemaFilename), '');
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
                .catch(err => {
                this.suppressAxiosError(err);
                resolve();
            });
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
}
exports.SchemaPublisher = SchemaPublisher;
//# sourceMappingURL=schema-publisher.js.map