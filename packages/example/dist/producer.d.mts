import { TestBedAdapter, DataType, ISendResponse } from 'node-test-bed-adapter';
/**
 * Helper function to create a callback that automatically sends a large file upload message
 * to the Test-bed's LargeDataUpdateTopic (system_large_data_update). This callback can be
 * passed to the uploadFile function of the adapter.
 *
 * @param adapter test bed adapter, needed to send the message
 * @param title title of the large file upload message
 * @param description description of the large file upload message
 * @param dataType data type of the message
 * @param callback to return the result of the large file upload (default logs errors)
 */
export declare const largeFileUploadCallback: (adapter: TestBedAdapter, title?: string, description?: string, dataType?: DataType, cb?: (err: any, data?: ISendResponse) => void) => (err?: Error, url?: string) => void;
