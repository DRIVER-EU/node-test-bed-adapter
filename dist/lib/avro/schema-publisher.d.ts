/// <reference types="bluebird" />
import * as Promise from 'bluebird';
import { ITestBedOptions } from './../models/test-bed-options';
/**
 * Helper class to publish schema's to the schema registry.
 *
 * After publishing, the schema ID is returned. Although we might store
 * it and pass it on to the schema registry, that is not done, as this
 * makes things more complicated (stronger coupling between this class
 * and the schema registry). Also, we may not retreive the latest version
 * of the schema topic.
 */
export declare class SchemaPublisher {
    private schemaRegistryUrl;
    private schemaFolder;
    private isInitialized;
    private log;
    constructor(options: ITestBedOptions);
    init(): Promise<{}>;
    private uploadSchema(schemaFilename);
    private suppressAxiosError(err, resolve, reject);
}
