import { KafkaClientOptions } from 'kafka-node';
export interface ITestBedOptions extends KafkaClientOptions {
    clientId: string;
    kafkaHost: string;
    /** Hearbeat interval in msec */
    heartbeatInterval?: number;
}
