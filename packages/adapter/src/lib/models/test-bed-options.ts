import { KafkaClientOptions, OffsetFetchRequest } from 'kafka-node';
import { LogLevel } from '../logger/log-levels';

export interface ITestBedOptions extends KafkaClientOptions {
  /** Unique ID of this client */
  clientId: string;
  /** Uri for the Kafka broker, e.g. broker:3501 */
  kafkaHost: string;
  /** Uri for the schema registry, e.g. schema_registry:3502 */
  schemaRegistry: string;
  /** Uri for the large file service, e.g. localhost:9090/api */
  largeFileService?: string;
  /** SSL Options for secure connection to broker, see https://nodejs.org/api/tls.html#tls_tls_connect_options_callback */
  sslOptions?: {
    /** Reads the public key + certificate */
    pfx?: Buffer;
    /** Alternatives (to pfx), use a key and cert */
    key?: Buffer; // fs.readFileSync('client-key.pem'),
    /** Alternatives (to pfx), use a key and cert */
    cert?: Buffer; // fs.readFileSync('client-cert.pem'),
    /** Passphrase for your key */
    passphrase: string;
    /** Reads the certificate authority's public key (so we can use the Test-bed's self-signed certificates) */
    ca: Buffer;
    /** Do not connect when the server's certificate is not accepted. */
    rejectUnauthorized: boolean;
  };
  /** Avro parser setting: whether to wrap union types in schema*/
  wrapUnions?: boolean | 'auto' | 'never' | 'always';
  /**
   * If true (default), automatically register typical Test-bed schema's. In normal situations,
   * you should at least register the HeartbeatTopic, LogTopic and, optionally, the TimeTopic.
   * - consumer topics:
   *   - TimeTopic: for listening to the time
   *   - AccessInviteTopic: For receiving invitations to connect
   * - publisher topics:
   *   - HeartbeatTopic: To notify the admin tool that you are online
   *   - LogTopic: To log data to Kafka, making it visible for the admin tool
   *   - LargeDataUpdateTopic: Only when the `largeFileService` is provided
   */
  autoRegisterDefaultSchemas?: boolean;
  /** If true, automatically register schema's on startup */
  autoRegisterSchemas?: boolean;
  /** If autoRegisterSchemas is true, contains the folder with *.avsc schema's to register */
  schemaFolder?: string;
  /** If set true, use the topics offset to retreive messages */
  fromOffset?: boolean;
  /** If true (default false), fetch all schema versions (and not only the latest) */
  fetchAllVersions?: boolean;
  /** If true (default false), fetch all schema's (and not only the consume and produce topics) */
  fetchAllSchemas?: boolean;
  /** If true, the adapter allows you to publish unvalidated messages */
  // canPublishUnvalidatedMessages?: boolean;
  /** Hearbeat interval in msec */
  heartbeatInterval?: number;
  /** Don't subscribe to the system_time topic (which is subscribed to by default) */
  ignoreTimeTopic?: boolean;
  /** Topics you want to consume */
  consume?: OffsetFetchRequest[];
  /** Topics you want to produce */
  produce?: string[];
  /** How often should the adapter try to reconnect to the kafka server if the first time fails */
  maxConnectionRetries?: number;
  /** How many seconds should the adapter wait before trying to reconnect to the kafka server if the first time fails */
  retryTimeout?: number;
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
}
