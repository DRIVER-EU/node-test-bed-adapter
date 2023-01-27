/**
 * The default key, as used in the test-bed, is based on the required fields of an EDXL 2.0 Distribution Element.
 */
export interface IDefaultKey {
  /**
   * The unique identifier of this distribution message.
   */
  distributionID: string;
  /**
   * The unique identifier of the sender.
   */
  senderID: string;
  /**
   * The date and time the distribution message was sent as the number of milliseconds
   * from the UNIX epoch, 1 January 1970 00:00:00.000 UTC.
   */
  dateTimeSent: number;
  /**
   * The date and time the distribution message should expire as the number of milliseconds
   * from the UNIX epoch, 1 January 1970 00:00:00.000 UTC.
   */
  dateTimeExpires: number;
  /**
   * The action-ability of the message.
   */
  distributionStatus:
    | 'Actual'
    | 'Exercise'
    | 'System'
    | 'Test'
    | 'Unknown'
    | 'NoAppropriateDefault';
  /**
   * The function of the message.
   */
  distributionKind:
    | 'Report'
    | 'Update'
    | 'Cancel'
    | 'Request'
    | 'Response'
    | 'Dispatch'
    | 'Ack'
    | 'Error'
    | 'SensorConfiguration'
    | 'SensorControl'
    | 'SensorStatus'
    | 'SensorDetection'
    | 'Unknown'
    | 'NoAppropriateDefault';
}

/** The default key is either a string, or an EDXLDistribution message */
export const defaultKeySchema = [
  'string',
  {
    type: 'record',
    name: 'EDXLDistribution',
    namespace: 'eu.driver.model.edxl',
    doc: 'The required fields of an EDXL 2.0 Distribution Element',
    fields: [
      {
        name: 'distributionID',
        type: 'string',
        doc: 'The unique identifier of this distribution message.',
      },
      {
        name: 'senderID',
        type: 'string',
        doc: 'The unique identifier of the sender.',
      },
      {
        name: 'dateTimeSent',
        type: 'long',
        doc: 'The date and time the distribution message was sent as the number of milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.',
        logicalType: 'timestamp-millis',
      },
      {
        name: 'dateTimeExpires',
        type: 'long',
        doc: 'The date and time the distribution message should expire as the number of milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.',
        logicalType: 'timestamp-millis',
      },
      {
        name: 'distributionStatus',
        type: {
          type: 'enum',
          name: 'DistributionStatus',
          symbols: [
            'Actual',
            'Exercise',
            'System',
            'Test',
            'Unknown',
            'NoAppropriateDefault',
          ],
        },
        doc: 'The action-ability of the message.',
      },
      {
        name: 'distributionKind',
        type: {
          type: 'enum',
          name: 'DistributionKind',
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
            'NoAppropriateDefault',
          ],
        },
        doc: 'The function of the message.',
      },
    ],
  },
];
