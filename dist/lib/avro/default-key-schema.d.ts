export declare const defaultKeySchema: {
    type: string;
    name: string;
    namespace: string;
    doc: string;
    fields: ({
        name: string;
        type: string;
        doc: string;
        logicalType?: undefined;
    } | {
        name: string;
        type: string;
        logicalType: string;
        doc: string;
    } | {
        name: string;
        type: {
            name: string;
            namespace: string;
            type: string;
            symbols: string[];
        };
        doc: string;
        logicalType?: undefined;
    })[];
};
