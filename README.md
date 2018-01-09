# node-test-bed-adapter

This is a test-bed adapter for node.js: it allows you to easily connect javascript and typescript services to the Apache Kafka test-bed via Node.js. Although it is specifically created for connecting to our [test-bed](https://github.com/DRIVER-EU/test-bed), it should work for any Apache Kafka version too.

The implementation is a wrapper around [kafka-node](https://www.npmjs.com/package/kafka-node), offering support for:
- AVRO schema's and messages
- Logging via console, file and via Kafka: you can set for each log provider the log level (e.g. error or debug)
- Management
  - Heartbeat (topic: heartbeat), so you know which clients are online
  - Logging (topic: log-clientID): when Kafka Logging is enabled in the options
  - Configuration (topic: configuration), so you can see which topics clients consume and produce

## Usage

First, install the adapter, so you can import / require it in your code.

```console
npm i node-test-bed-adapter
```
In case you have problems installing the adapter, you may have to first run `npm i -g node-gyp`, which is often required to build C++ libraries (in our case, snappy compression).

See the [src/example folder](https://github.com/DRIVER-EU/node-test-bed-adapter/tree/master/src/example) for an example of a consumer and producer sending CAP messages.

## Functionality

### Completed

- Connect to Kafka
- Publish heartbeat (topic: connect-status-heartbeat)
- Create AVRO schema for CAP messages (for testing purposes)
- Validate AVRO messages
- Encode/decode object and keys using AVRO helper factory
- Setup test framework
- Create kafka-node mock using proxyquire
- Publish and consume CAP messages (for testing purposes)
- Test sending messages using GZip compression (set attributes to 1in ProduceRequest payload)
- Test sending an array of CAP messages - creating a Buffer per message.
- Logging via Kafka (e.g. [log4j-kafka appender](https://logging.apache.org/log4j/2.x/manual/appenders.html#KafkaAppender)
  - allow to set the logging level/mode in the adapter): topic: log-CLIENTID
    - message: log-level, timestamp and log message
  - const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5
  }, see [RFC5424](https://tools.ietf.org/html/rfc5424)
  - Created a KafkaLogger, FileLogger, and ConsoleLogger
- Configure logger (which ones to use, which debug level, output file)
- Publish configuration (topic: connect-status-configuration)
  - topics you consume
  - topics you produce
  - IP address and port
  - local time
- Discover existing topics (call method loadMetadataForTopics with empty array)
- Added support for Confluence's schema registry:
  - note that this involves using a magic byte and schemaID as part of the message, e.g. see kafka-avro on Github
  - also, it seems that the schema registry does not support sub-schema's, so we need to flatten them. Created a tool for that, [avro-schema-parser](npmjs.org/avro-schema-parser)
  - Schema's are automatically loaded on startup from the registry. Topics that have no corresponding schema are ignored! For a list of schema's, see [here](github.com/DRIVER-EU/avro-schemas).
- Create AVRO schema for Configuration, Log and Heartbeat message
- Automatically publish schema's to the registry: using options `schemaFolder` and `autoRegisterSchemas`. See producer.ts in the example folder.
- Test configuration, log and heartbeat schema's: note that we need to precede them with 'connect-status' in order to show them as system topics, see this [issue](https://github.com/Landoop/kafka-topics-ui/issues/100) and [here](https://github.com/Landoop/kafka-topics-ui/issues/99), and both key and value require a schema, as discussed [here](https://github.com/Landoop/kafka-topics-ui/issues/84).

### To be done

- Add support for [LogicalType](https://avro.apache.org/docs/current/spec.html#Logical+Types), e.g. Timestamp (millisecond precision), e.g. { "type": "long", "logicalType": "timestamp-millis" }, where the long stores the number of milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.
- Add to Travis CI
- Pause consuming messages remotely
- Pause publishing messages remotely

# Build

Assuming you have node (8 or higher) have installed, you can do the following:

```console
npm i
npm build
npm run test
```

In order to run the tests continuously on code change, run `npm run watch`. This assumes that you have installed nodemon globally (`npm i -g nodemon`).

## Dependencies

In order to test the application, you need to have a local test-bed running in Docker. Please see [here](https://github.com/DRIVER-EU/test-bed) to get it up and running (Docker folder).

### Remarks when using the Kafka schema registry

- In order to register a schema with Confluence's schema registry, the schema file may only define one top-level schema, i.e. although the AVRO specifications allow you to use an array of schema's, the registry needs to know which one you are using. This implies that all referenced schema's needs to be inlined. Please have a look at the avro-schema-parser project to learn more.
- Internally, Confluence extends the byte encoded messages by prepending a Magic Byte (byte 0) and schema ID (bytes 1-4) to the encoded message. For more information, see [here](https://docs.confluent.io/current/schema-registry/docs/serializer-formatter.html#wire-format). We need to use this too in order for the Kafka REST service, topic viewer, etc. to work.
- A Javascript implementation can be found [here](https://github.com/waldophotos/kafka-avro). Unfortunately, it depends on the librdkafka client, which does not compile on (my setup of) Windows.

# TODO

Investigate if we can use something like [scribe](https://bluejamesbond.github.io/Scribe.js/) for monitoring our logs (even though the scribe project is abandoned, or so it seems from the commit log).
