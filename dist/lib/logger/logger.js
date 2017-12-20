"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const log_levels_1 = require("./log-levels");
/**
 * Singleton logger, who is given a list of loggers that do the actual logging.
 *
 * Event emitter:
 * 'error': Returns logger's error
 * 'message': Returns logger's message
 */
class Logger extends events_1.EventEmitter {
    constructor() {
        super();
        this.minLevel = log_levels_1.LogLevel.Error;
        this.isInitialized = false;
    }
    static get instance() {
        if (!Logger._instance) {
            Logger._instance = new Logger();
        }
        return Logger._instance;
    }
    initialize(loggers) {
        this.loggers = loggers;
        this.minLevel = loggers.reduce((p, c) => c.minLevel < p ? c.minLevel : p, Number.MAX_SAFE_INTEGER);
        this.isInitialized = true;
    }
    info(msg, meta) { this.log(log_levels_1.LogLevel.Info, msg, meta); }
    debug(msg, meta) { this.log(log_levels_1.LogLevel.Debug, msg, meta); }
    warn(msg, meta) { this.log(log_levels_1.LogLevel.Warn, msg, meta); }
    error(msg, meta) { this.log(log_levels_1.LogLevel.Error, msg, meta); }
    sill(msg, meta) { this.log(log_levels_1.LogLevel.Sill, msg, meta); }
    verbose(msg, meta) { this.log(log_levels_1.LogLevel.Verbose, msg, meta); }
    log(level, msg, meta) {
        if (!this.isInitialized || level > this.minLevel || !this.loggers) {
            return;
        }
        const fmtMsg = this.formatter(msg, meta, log_levels_1.LogLevel[level]);
        this.loggers.filter(logger => level <= logger.minLevel).forEach(logger => logger.logger.log(level, fmtMsg, (err, result) => {
            if (err) {
                this.emit('error', err);
            }
            else if (result) {
                this.emit('message', result);
            }
        }));
    }
    formatter(msg, meta, level = log_levels_1.LogLevel[log_levels_1.LogLevel.Info]) {
        const metadata = meta && Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${new Date().toISOString()} [${level.toUpperCase()}] - ${msg ? msg : ''}${metadata ? ' - ' + metadata : ''}`;
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map