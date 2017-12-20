"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log_levels_1 = require("./log-levels");
class ConsoleLogger {
    log(level, msg, _callback) {
        switch (level) {
            case log_levels_1.LogLevel.Error:
                console.error(msg);
                break;
            case log_levels_1.LogLevel.Warn:
                console.warn(msg);
                break;
            case log_levels_1.LogLevel.Info:
                console.info(msg);
                break;
            default:
                console.log(msg);
                break;
        }
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=console-logger.js.map