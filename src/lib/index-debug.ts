import { consoleLoggerProvider } from './utils/logger';
const kafkaLogging = require('kafka-node/logging');
kafkaLogging.setLoggerProvider(consoleLoggerProvider);

export * from './index';
