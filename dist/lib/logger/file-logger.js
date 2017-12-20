"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
/**
 * A simple file logger that appends the text to a log file.
 */
class FileLogger {
    constructor(file) {
        this.file = file;
    }
    log(_level, msg, callback) {
        fs.appendFile(this.file, msg + '\n', err => {
            if (callback) {
                return callback(err, null);
            }
            if (err) {
                throw err;
            }
        });
    }
}
exports.FileLogger = FileLogger;
//# sourceMappingURL=file-logger.js.map