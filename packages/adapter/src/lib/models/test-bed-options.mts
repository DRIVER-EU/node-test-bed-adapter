import {
  BrokersFunction,
  ConsumerConfig,
  ConsumerGroup,
  KafkaConfig,
} from 'kafkajs';
import { LogLevel } from '../logger/index.mjs';

export interface ITestBedOptions
  extends Omit<KafkaConfig, 'brokers'>,
    Pick<ConsumerGroup, 'groupId'>,
    Pick<ConsumerConfig, 'sessionTimeout' | 'rebalanceTimeout'> {
  /** Consumer group ID of this client */
  clientId?: string;
  /** DEPRECATED, use brokers: Uri for the Kafka broker, e.g. broker:3501 */
  kafkaHost?: string;
  /** One or more kafka brokers to initialize the connection. */
  brokers?: string[] | BrokersFunction;
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
  /** When true (default), the key is a string instead of an EDXL distribution envelope. */
  stringBasedKey?: boolean;
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
  fromOffset?: 'earliest' | 'latest' | 'none';
  /** The minimum bytes (minBytes) to include in the message set for this partition. This helps bound the size of the response. */
  fetchMinBytes?: number;
  /** The maximum bytes (maxBytes) to include in the message set for this partition. This helps bound the size of the response. */
  fetchMaxBytes?: number;
  /** If true (default false), fetch all schema versions (and not only the latest) */
  fetchAllVersions?: boolean;
  /** If true (default false), fetch all schema's (and not only the consume and produce topics) */
  fetchAllSchemas?: boolean;
  /** If true, the adapter allows you to publish unvalidated messages */
  // canPublishUnvalidatedMessages?: boolean;
  /** Hearbeat interval in msec, default 10000 msec. If <= 0, do not send any heartbeats */
  heartbeatInterval?: number;
  /** Don't subscribe to the system_time topic (which is subscribed to by default) */
  ignoreTimeTopic?: boolean;
  /** Topics you want to consume */
  consume?: string | string[];
  /** Topics you want to produce */
  produce?: string | string[];
  /** How often should the adapter try to reconnect to the kafka server if the first time fails */
  maxConnectionRetries?: number;
  /** How many seconds should the adapter wait before trying to reconnect to the kafka server if the first time fails */
  retryTimeout?: number;
  /** External IP address */
  externalIP?: string;
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
  /** Specify partitioner type of the producer, all-to-1-partition = 0, random = 1, cyclic = 2, keyed = 3, custom = 4, default == 2! */
  partitionerType?: number;
  /** Default number of partitions to use when creating topics. Default 1 */
  partitions?: number;
  /** If true, automatically create topics */
  autoCreateTopics?: boolean;
}
