/**
 * A start inject request is a specific request for starting a pre-defined
 * sequence of events defined at one or more connected applications. *Copyright
 * (C) 2019-2020 XVR Simulation B.V., Delft, The Netherlands, Martijn Hendriks
 * <hendriks @ xvrsim.com>. This file is licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IRequestStartInject {
  /** Unique case-insensitive identifier of the request */
  id: string;
  /**
   * Unique case-insensitive identifier of the connected application sending the
   * request
   */
  applicant: string;
  /** Case-insensitive name of the inject that is requested to start */
  inject: string;
  /**
   * Optional map containing start inject request specific information: key – unique
   * name of the specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
}
