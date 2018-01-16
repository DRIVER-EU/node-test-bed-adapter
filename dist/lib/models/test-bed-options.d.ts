import { KafkaClientOptions, OffsetFetchRequest } from 'kafka-node';
import { LogLevel } from '../logger/log-levels';
export interface ITestBedOptions extends KafkaClientOptions {
    /** Unique ID of this client */
    clientId: string;
    /** Uri for the Kafka broker, e.g. broker:3501 */
    kafkaHost: string;
    /** Uri for the schema registry, e.g. schema_registry:3502 */
    schemaRegistry: string;
    /** If true, automatically register schema's on startup */
    autoRegisterSchemas?: boolean;
    /** If autoRegisterSchemas is true, contains the folder with *.avsc schema's to register */
    schemaFolder?: string;
    /** If true (default false), fetch all schema versions (and not only the latest) */
    fetchAllVersions?: boolean;
    /** If true (default false), fetch all schema's (and not only the consume and produce topics) */
    fetchAllSchemas?: boolean;
    /** If true, the adapter allows you to publish unvalidated messages */
    /** Hearbeat interval in msec */
    heartbeatInterval?: number;
    /** Topics you want to consume */
    consume?: OffsetFetchRequest[];
    /** Topics you want to produce */
    produce?: string[];
    /** Specifiy logging options */
    logging?: {
        /** If set, log to file */
        logToFile?: LogLevel;
        /** Name of the log file */
        logFile?: string;
        /** If set, log to console */
        logToConsole?: LogLevel;
        /** If set, log to Kafka */
        logToKafka?: LogLevel;
    };
    /** How often should the adapter try to reconnect to the kafka server if the first time fails */
    maxConnectionRetries?: number;
    /** How many seconds should the adapter wait before trying to reconnect to the kafka server if the first time fails */
    retryTimeout?: number;
}
