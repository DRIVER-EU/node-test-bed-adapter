"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLoggerProvider = (name) => {
    // do something with the name
    console.log(name);
    return {
        debug: console.log.bind(console),
        info: console.info.bind(console),
        warn: console.warn.bind(console),
        error: console.error.bind(console)
    };
};
//# sourceMappingURL=logger.js.map