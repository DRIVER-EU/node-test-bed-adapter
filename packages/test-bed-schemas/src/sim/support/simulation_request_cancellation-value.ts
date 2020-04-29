/**
 * A request cancellation message is a support message indicating a pending
 * request to be cancelled. *Copyright (C) 2019-2020 XVR Simulation B.V., Delft,
 * The Netherlands, Martijn Hendriks <hendriks @ xvrsim.com>. This file is
 * licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IRequestCancellation {
  /** Unique case-insensitive identifier of the request */
  id: string;
  /**
   * Unique case-insensitive identifier of the connected application sending the
   * request
   */
  applicant: string;
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was
   * performed
   */
  timestamp?: null | undefined | number;
}
