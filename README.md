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

See the [src/example folder](https://github.com/DRIVER-EU/node-test-bed-adapter/tree/master/src/example) for an example of a consumer and producer sending CAP messages.

## Functionality

### Completed

- Connect to Kafka
- Publish heartbeat (topic: heartbeat)
- Create AVRO schema for CAP messages (for testing purposes)
- Validate AVRO messages
- Encode/decode object using AVRO helper factory
- Setup test framework
- Create kafka-node mock using proxyquire
- Publish CAP messages (for testing purposes)
- Consume CAP messages (for testing purposes)
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
- Publish configuration (topic: configuration)
  - topics you consume
  - topics you produce
  - IP address and port
  - local time

### To be done

- Create AVRO schema for Heartbeat message?: topic = 'heartbeat'
  - key: name of client
  - value: current time
- Create AVRO schema for Configuration message?:
- Pause consuming messages remotely
- Pause publishing messages remotely
- Validate published XML messages
- Send XML messages
- Add option to publish unvalidated messages

- REST interface -> not directly in here: we will create a new project, test-bed-rest-service, using this adapter.

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

## Observations creating an AVRO schema

The AVRO schema is specified [here](https://avro.apache.org/docs/current/spec.html). When creating a new schema from scratch based on an XML schema definition (XSD), most conversions are quite straightforward. However, there were some small issues that I observed while converting the [CAP XML Schema](https://github.com/DRIVER-EU/node-test-bed-adapter/blob/master/data/cap/cap.xsd) definition to a [CAP AVRO schema](https://github.com/DRIVER-EU/node-test-bed-adapter/blob/master/data/cap/cap.avsc):

- The CAP xsd contains an `any` element, meaning that you can put anything you like in the CAP message. Besides the fact that I don't consider this a good idea, I also do not know how to encode this in AVRO. So for now, I have ignored it.
- The CAP schema uses `xs:dateTime`, which is basically a string that can be validated using a regular expression pattern. In AVRO, such functionality seems to be missing, and I represented it using a string. Alternatively, we could use a [LogicalType](https://avro.apache.org/docs/current/spec.html#Logical+Types) for this, but those must be defined in each adapter.
- The CAP schema uses `minOccors = "0"` (optional element). I've converted this to an AVRO UnionType, for example when the type is `xs:string`, it becomes `type: ["null", "string"], default: null`.
- The CAP schema uses `maxOccors = "unbounded"` (array). I've converted this to an AVRO UnionType, for example when the type is `xs:string`, it becomes `type: ["null", "string", { type: "array", items: "string" }], default: null`. So the element is optional (type is null and default is null), a simple string, or a string array.
- The CAP schema contains many types: each type has been converted to an AVRO `enum` with symbols (e.g. for `simpleType`)), or `record` (e.g. for `complexType`). As a consequence, the AVRO schema may contain many types, in which case we need to specify the actual (top) type that we will use for validating/encoding/decoding messages.