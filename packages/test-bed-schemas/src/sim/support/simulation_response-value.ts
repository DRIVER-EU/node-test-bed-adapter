/**
 * A response message is a support message for responding to a received common
 * simulation space message. *Copyright (C) 2019-2020 XVR Simulation B.V., Delft,
 * The Netherlands, Martijn Hendriks <hendriks @ xvrsim.com>. This file is
 * licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IResponse {
  /** Unique case-insensitive identifier of the response */
  id: string;
  /**
   * Unique case-insensitive identifier of the request this response is responding to
   */
  request: string;
  /**
   * Optional HTTP status code that best serves the response. Configuration
   * guidelines might define new response codes that better fit the needs of that
   * common simulation space
   */
  code?: null | undefined | number;
  /** Optional information accompanying the response code */
  message?: null | undefined | string;
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the respond was given
   */
  timestamp?: null | undefined | number;
}
