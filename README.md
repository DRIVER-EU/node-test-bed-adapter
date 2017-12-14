# node-test-bed-adapter

Test-bed adapter for node.js.

# Installation

```console
npm i
npm build
npm run test
```

In order to run the tests continuously on code change, run `npm run watch`. This assumes that you have installed nodemon globally (`npm i -g nodemon`).

## Dependencies

In order to test the application, you need to have a local test-bed running in Docker. Please see [here](https://github.com/DRIVER-EU/test-bed) to get it up and running (Docker folder).

## Functionality

### Completed

- Connect to Kafka
- Publish heartbeat (topic: heartbeat-CLIENTID)
- Create AVRO schema for CAP messages (for testing purposes)
- Validate AVRO messages
- Setup test framework
- Create kafka-node mock using proxyquire

### To be done
- Publish CAP messages (for testing purposes)
- Consume CAP messages (for testing purposes)
- Create AVRO schema for Heartbeat message:
  - name of client
- Create AVRO schema for Configuration message:
- Publish configuration (topic: configuration-CLIENTID)
  - topics you consume
  - topics you produce
  - IP address and port
  - local time
- Pause consuming messages remotely
- Pause publishing messages remotely
- Validate published XML messages
- Add option to publish unvalidated messages