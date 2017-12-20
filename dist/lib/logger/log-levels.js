"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Default log levels, as defined in [RFC5424](https://tools.ietf.org/html/rfc5424).
 */
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Error"] = 0] = "Error";
    LogLevel[LogLevel["Warn"] = 1] = "Warn";
    LogLevel[LogLevel["Info"] = 2] = "Info";
    LogLevel[LogLevel["Verbose"] = 3] = "Verbose";
    LogLevel[LogLevel["Debug"] = 4] = "Debug";
    LogLevel[LogLevel["Sill"] = 5] = "Sill";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
//# sourceMappingURL=log-levels.js.map