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

## Functionality

### Completed

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
