import { KafkaClientOptions } from 'kafka-node';
import { ITopic } from './topic';
export interface ITestBedOptions extends KafkaClientOptions {
    clientId: string;
    kafkaHost: string;
    /** If true, the adapter allows you to publish unvalidated messages */
    canPublishUnvalidatedMessages?: boolean;
    /** Hearbeat interval in msec */
    heartbeatInterval?: number;
    /** Topics you want to consume */
    consume?: ITopic[];
    /** Topics you want to produce */
    produce?: ITopic[];
}
