"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultKeySchema = {
    type: 'record',
    name: 'EDXLDistribution',
    namespace: 'eu.driver.model.edxl',
    doc: 'The required fields of an EDXL 2.0 Distribution Element',
    fields: [
        {
            name: 'distributionID',
            type: 'string',
            doc: 'The unique identifier of this distribution message.'
        },
        {
            name: 'senderID',
            type: 'string',
            doc: 'The unique identifier of the sender.'
        },
        {
            name: 'dateTimeSent',
            type: 'long',
            logicalType: 'timestamp-millis',
            doc: 'The date and time the distribution message was sent as the number of milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.'
        },
        {
            name: 'dateTimeExpires',
            type: 'long',
            logicalType: 'timestamp-millis',
            doc: 'The date and time the distribution message should expire as the number of milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.'
        },
        {
            name: 'distributionStatus',
            type: {
                name: 'DistributionStatus',
                namespace: 'eu.driver.model.edxl',
                type: 'enum',
                symbols: ['Actual', 'Exercise', 'System', 'Test', 'Unknown', 'NoAppropriateDefault']
            },
            doc: 'The action-ability of the message.'
        },
        {
            name: 'distributionKind',
            type: {
                name: 'DistributionKind',
                namespace: 'eu.driver.model.edxl',
                type: 'enum',
                symbols: [
                    'Report',
                    'Update',
                    'Cancel',
                    'Request',
                    'Response',
                    'Dispatch',
                    'Ack',
                    'Error',
                    'SensorConfiguration',
                    'SensorControl',
                    'SensorStatus',
                    'SensorDetection',
                    'Unknown',
                    'NoAppropriateDefault'
                ]
            },
            doc: 'The function of the message.'
        }
    ]
};
//# sourceMappingURL=default-key-schema.js.map