import { TestBedAdapter, Logger, LogLevel } from '../lib';

const log = Logger.instance;

class SilentProducer {
  private id = 'tno';
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: process.env.KAFKA_HOST || 'localhost:3501',
      schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
      // largeFileService: 'localhost:9090',
      // sslOptions: {
      //   pfx: fs.readFileSync('../certs/other-tool-1-client.p12'),
      //   passphrase: 'changeit',
      //   ca: fs.readFileSync('../certs/test-ca.pem'),
      //   rejectUnauthorized: true,
      // },
      clientId: this.id,
      fetchAllSchemas: false,
      fetchAllVersions: false,
      autoRegisterSchemas: true,
      autoRegisterDefaultSchemas: false,
      wrapUnions: 'auto',
      schemaFolder:
        process.env.SCHEMA_FOLDER || `${__dirname}/../../src/data/schemas`,
      produce: process.env.PRODUCE_TOPICS
        ? process.env.PRODUCE_TOPICS.split(',')
        : undefined,
      logging: {
        logToConsole: LogLevel.Info,
        logToKafka: LogLevel.Info,
      },
    });
    this.adapter.on('error', e => console.error(e));
    this.adapter.on('ready', async () => {
      const createdTopics = await this.adapter.createTopics(
        this.adapter.uploadedSchemas
      );
      log.info(
        `Created the following topics:\n${createdTopics
          .map(t => `- ${t}`)
          .join('\n')}\n`
      );
      log.info('Exiting...');
      process.exit(0);
    });
    this.adapter.connect();
  }
}

new SilentProducer();
