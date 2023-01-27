export enum DistributionStatus {
  Actual = 'Actual',
  Exercise = 'Exercise',
  System = 'System',
  Test = 'Test',
  Unknown = 'Unknown',
  NoAppropriateDefault = 'NoAppropriateDefault',
}

export enum DistributionKind {
  Report = 'Report',
  Update = 'Update',
  Cancel = 'Cancel',
  Request = 'Request',
  Response = 'Response',
  Dispatch = 'Dispatch',
  Ack = 'Ack',
  Error = 'Error',
  SensorConfiguration = 'SensorConfiguration',
  SensorControl = 'SensorControl',
  SensorStatus = 'SensorStatus',
  SensorDetection = 'SensorDetection',
  Unknown = 'Unknown',
  NoAppropriateDefault = 'NoAppropriateDefault',
}

/** The required fields of an EDXL 2.0 Distribution Element */
export interface IEDXLDistribution {
  /** The unique identifier of this distribution message. */
  distributionID: string;
  /** The unique identifier of the sender. */
  senderID: string;
  /**
   * The date and time the distribution message was sent as the number of
   * milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  dateTimeSent: number;
  /**
   * The date and time the distribution message should expire as the number of
   * milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  dateTimeExpires: number;
  /** The action-ability of the message. */
  distributionStatus: DistributionStatus;
  /** The function of the message. */
  distributionKind: DistributionKind;
}

/** The key can either be a string or an IEDXLDistribution */
export type EdxlDeKey = string | IEDXLDistribution;
