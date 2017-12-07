"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./utils/logger");
const kafkaLogging = require('kafka-node/logging');
kafkaLogging.setLoggerProvider(logger_1.consoleLoggerProvider);
__export(require("./index"));
//# sourceMappingURL=index-debug.js.map