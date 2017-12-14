import { OffsetFetchRequest } from 'kafka-node';
/**
 * Topic configuration for consumers or producers.
 */
export interface ITopic extends OffsetFetchRequest {
    /** Reference to an XSD or AVSC schema (based on the extension, .xsd or .avsc respectively) */
    schemaURI?: string;
    /** A schema may contain many types - indicate which you want to use (usage: namespace.name). */
    type?: string;
}
export interface IInitializedTopic extends ITopic {
    validate?: (msg: Object) => boolean;
    encode?: (msg: Object) => any;
    decode?: (msg: Object) => any;
}
