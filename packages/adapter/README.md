# node-test-bed-adapter

This is the test-bed adapter for node.js: it allows you to easily connect JavaScript and typescript services to the Apache Kafka test-bed via Node.js. Although it is specifically created for connecting to our [test-bed](https://github.com/DRIVER-EU/test-bed), it should work for any Apache Kafka version too.

The implementation is a wrapper around [kafkajs](https://www.npmjs.com/package/kafkajs), offering support for:

- AVRO schema's and messages: both key's and values should have a schema as explained [here](https:/github.com/DRIVER-EU/avro-schemas).
- Logging via console, file and via Kafka: you can set for each log provider the log level (e.g. error or debug).
- Management
  - Heartbeat (topic: connect-status-heartbeat), so you know which clients are online.
  - Logging (topic: connect-status-log): when Kafka Logging is enabled in the options.
  - system

A standalone example project can be found [here](https://github.com/DRIVER-EU/example-node-test-bed-adapter).

## Version 3: BREAKING CHANGES

Version 3 is a major update where [kafka-node](https://www.npmjs.com/package/kafka-node) has been replaced with [kafkajs](https://www.npmjs.com/package/kafkajs), as the former hadn't been updated for more than 3 years. Therefore, it has a few breaking changes:

- Preferably, your project should use ESnext (in `tsconfig` for `target`, `module` and `lib`), and set `"type"="module"` in `package.json` too. Alternatively, use `import tba from 'node-test-bed-adapter` to access the content of the module.
- `Logger` => `AdapterLogger`
- Consume topics: a list of strings. Using a [regex to subscribe to a group of topics](https://kafka.js.org/docs/consuming) is not supported.
- config option `stringBasedKey` (default true): Heartbeats and logs use the ID as key instead of an EDXL distribution message. By using string-based keys, it is easier to filter messages, cheaper to create messages, and the key can be used for routing across multiple partitions (by default, messages with the same key go to the same partition). This requires the use of the new `edxl-de-key.avsc`, which supports either strings or EDXL distribution messages as key.

## Pre-requisites

Clearly, you need to install [node.js](https://nodejs.org). After that, in order to build and install the adapter on WINDOWS, run
`npm install --global --production windows-build-tools` in a command prompt as an admin user. Most likely, you will also need to [install .NET 2 SDK](https://www.microsoft.com/en-us/download/details.aspx?id=19988), and `npm i -g node-gyp`.

## Usage

First, install the adapter, so you can import / require it in your code.

```console
npm i node-test-bed-adapter
```

In case you have problems installing the adapter, you may have to first run `npm i -g node-gyp`, which is often required to build C++ libraries (in our case, snappy compression).

See the [src/example folder](https://github.com/DRIVER-EU/node-test-bed-adapter/tree/master/src/example) for an example of a consumer and producer sending CAP messages. Examples are also present for using SSL to connect to a secure test-bed.

### Example consumer

```ts
import {
  TestBedAdapter,
  AdapterLogger,
  LogLevel,
  AdapterMessage,
} from 'node-test-bed-adapter';

const log = AdapterLogger.instance;

class Consumer {
  private id = 'tno-consumer';
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
      schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
      fetchAllSchemas: false,
      fetchAllVersions: false,
      wrapUnions: true,
      groupId: this.id,
      // consume: ['standard_cap'],
      // fromOffset: 'earliest',
      logging: {
        logToConsole: LogLevel.Info,
        logToFile: LogLevel.Info,
        logToKafka: LogLevel.Warn,
        logFile: 'log.txt',
      },
    });
    this.adapter.on('ready', () => {
      this.subscribe();
      log.info('Consumer is connected');
      this.getTopics();
    });
    this.adapter.connect();
  }

  private subscribe() {
    this.adapter.on('message', (message) => this.handleMessage(message));
    this.adapter.on('error', (err) =>
      console.error(`Consumer received an error: ${err}`)
    );
    this.adapter.on('offsetOutOfRange', (err) => {
      console.error(
        `Consumer received an offsetOutOfRange error on topic ${err.topic}.`
      );
    });
  }

  private async getTopics() {
    await this.adapter.loadMetadataForTopics([], (error, results) => {
      if (error) {
        return log.error(error);
      }
      if (results && results.length > 0) {
        results.forEach((result) => {
          console.log(JSON.stringify(result));
        });
      }
    });
  }

  private handleMessage(message: AdapterMessage) {
    const stringify = (m: string | Object) =>
      typeof m === 'string' ? m : JSON.stringify(m, null, 2);
    switch (message.topic.toLowerCase()) {
      case 'system_heartbeat':
        message.key &&
          log.info(
            `Received heartbeat message with key ${stringify(
              message.key
            )}: ${stringify(message.value)}`
          );
        break;
      default:
        message.key &&
          log.info(
            `Received ${message.topic} message with key ${stringify(
              message.key
            )}: ${stringify(message.value)}`
          );
        break;
    }
  }
}

new Consumer();
```

### Example producer

```ts
import {
  TestBedAdapter,
  AdapterLogger,
  LogLevel,
  AdapterProducerRecord,
} from 'node-test-bed-adapter';

const log = AdapterLogger.instance;

class Producer {
  private id = 'tno-producer';
  private adapter: TestBedAdapter;

  constructor() {
    const hasLargeFileService = false;
    this.adapter = new TestBedAdapter({
      kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
      schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
      largeFileService: hasLargeFileService
        ? 'localhost:9090'
        : undefined,
      // sslOptions: {
      //   pfx: fs.readFileSync('../certs/other-tool-1-client.p12'),
      //   passphrase: 'changeit',
      //   ca: fs.readFileSync('../certs/test-ca.pem'),
      //   rejectUnauthorized: true,
      // },
      groupId: this.id,
      fetchAllSchemas: false,
      fetchAllVersions: false,
      autoRegisterSchemas: false,
      wrapUnions: 'auto',
      stringBasedKey: true,
      schemaFolder: process.env.SCHEMA_FOLDER || `${process.cwd()}/src/schemas`,
      produce: [
        'standard_cap',
        'standard_geojson',
        RequestChangeOfTrialStage,
        TimeTopic,
      ],
      logging: {
        logToConsole: LogLevel.Info,
        logToKafka: LogLevel.Warn,
      },
    });
    this.adapter.on('error', (e) => console.error(e));
    this.adapter.on('ready', () => {
      log.info(`Current simulation time: ${this.adapter.simulationTime}`);
      log.info('Producer is connected');
    });
    this.adapter.connect();
  }

  /** Will only work if you are authorized to send CAP messages. */
  send(topic: string, messages: AvroMessage[]) {
    const payloads: AdapterProducerRecord = {
      topic,
      messages,
    };
    this.adapter.send(payloads, (error, data) => {
      if (error) {
        log.error(error);
      }
      if (data) {
        log.info(data);
      }
    });
  }
}

const producer = new Producer();
producer.send('standard_cap', [{ value: {}, key: 'my_key' }]);
```

## Functionality

### Features

- Connect to Kafka
- Connect to Kafka using SSL
- Publish heartbeat (topic: system-heartbeat). It requires that you produce the heartbeat topic.
- Validate AVRO messages
- Encode/decode object and keys using AVRO helper factory
- Setup test framework
- Create kafkajs mock using proxyquire
- Publish and consume CAP messages (for testing purposes)
- Test sending messages using GZip compression (set attributes to 1in ProduceRequest payload)
- Test sending an array of CAP messages - creating a Buffer per message.
- Logging via Kafka
  - allow to set the logging level/mode in the adapter): topic: log-CLIENTID
    - message: log-level, timestamp and log message
  - Created a KafkaLogger, FileLogger, and ConsoleLogger
- Configure logger (which ones to use, which debug level, output file)
- Publish configuration (topic: connect-status-configuration)
  - topics you consume
  - topics you produce
  - IP address and port
  - local time
- Discover existing topics (call method loadMetadataForTopics with empty array)
- Added support for Confluence's schema registry:
  - note that this involves using a magic byte and schemaID as part of the message, e.g. see kafka-avro on GitHub
  - also, it seems that the schema registry does not support sub-schema's, so we need to flatten them. Created a tool for that, [avro-schema-parser](npmjs.org/avro-schema-parser)
  - Schema's are automatically loaded on start-up from the registry. Topics that have no corresponding schema are ignored! For a list of schema's, see [here](github.com/DRIVER-EU/avro-schemas).
- Automatically publish schema's to the registry: using options `schemaFolder` and `autoRegisterSchemas`. See `producer.ts` in the example folder.
- Added the time service: through it, you can get the simulationTime, simulationSpeed, state, and elapsed trial time.
- Listens to topic access invite messages: when the admin tool sends them, the adapter will download the required schema's and start listening or publishing to them. You can still specify the consume/produce topics regularly, by specifying it on initialization, but when the Test-bed is operating in secure mode, you may not get access to these topics before receiving an invitation.
- Added the uploadFile service for uploading files to the Test-bed. Also added a helper callback method that automatically publishes a messsage to the system_large_file_update topic.
- Added support for GeoJSON processing: see `./src/example/producer.ts`.

## Build

Assuming you have node (8 or higher) have installed, you can do the following:

```console
npm i
npm build
npm run test
```

In order to run the tests continuously on code change, run `npm run watch`. This assumes that you have installed `nodemon` globally (`npm i -g nodemon`).

## Examples

In the [src/example/](https://github.com/DRIVER-EU/node-test-bed-adapter/tree/master/src/example) folder, several examples of producers and consumers of messages can be found. Basically, they follow the same procedure:

1. Read the configuration options (e.g. kafka broker, schema registry, etc.).
2. Create a new adapter.
3. When the adapter is up-and-running (adapter has emitted the `ready` event), subscribe to messages.
4. Upon receipt of a new message, handle it.

## Dependencies

In order to test the application, you need to have a local test-bed running in Docker. Please see [here](https://github.com/DRIVER-EU/test-bed) to get it up and running (Docker folder).

### Remarks when using the Kafka schema registry

- In order to register a schema with Confluence's schema registry, the schema file may only define one top-level schema, i.e. although the AVRO specifications allow you to use an array of schema's, the registry needs to know which one you are using. This implies that all referenced schema's needs to be in-lined. Please have a look at the avro-schema-parser project to learn more.
- Internally, Confluence extends the byte encoded messages by prepending a Magic Byte (byte 0) and schema ID (bytes 1-4) to the encoded message. For more information, see [here](https://docs.confluent.io/current/schema-registry/docs/serializer-formatter.html#wire-format). We need to use this too in order for the Kafka REST service, topic viewer, etc. to work.
- A JavaScript implementation can be found [here](https://github.com/waldophotos/kafka-avro). Unfortunately, it depends on the librdkafka client, which does not compile on (my setup of) Windows.
