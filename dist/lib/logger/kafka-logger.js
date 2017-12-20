"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Based on winston-k
 * source: https://github.com/jackielihf/winston-k/blob/master/logger.js
 */
class KafkaLogger {
    constructor(options) {
        this.topic = `log-${options.clientId.toLowerCase()}`;
        this.producer = options.producer;
        this.producer.createTopics([this.topic], true, (err, _data) => { if (err) {
            console.error(err);
        } });
    }
    log(_level, msg, callback) {
        const payload = [{
                topic: this.topic, messages: msg
            }];
        this.producer.send(payload, (err, res) => {
            if (err) {
                if (typeof err === 'string') {
                    err = `[KAFKA] ${err}`;
                }
                else if (err.hasOwnProperty('message')) {
                    err.message = `[KAFKA] ${err.message}`;
                }
                return callback(err, null);
            }
            callback(undefined, res);
        });
    }
}
exports.KafkaLogger = KafkaLogger;
//# sourceMappingURL=kafka-logger.js.map