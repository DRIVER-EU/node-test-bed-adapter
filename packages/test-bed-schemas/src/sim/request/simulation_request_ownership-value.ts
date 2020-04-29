/**
 * An ownership request is a specific request for becoming owner of a given
 * simulation entity. *Copyright (C) 2019-2020 XVR Simulation B.V., Delft, The
 * Netherlands, Martijn Hendriks <hendriks @ xvrsim.com>. This file is licensed
 * under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IRequestOwnership {
  /** Unique case-insensitive identifier of the request */
  id: string;
  /**
   * Unique case-insensitive identifier of the connected application sending the
   * request
   */
  applicant: string;
  /**
   * Unique case-insensitive identifier of the entity the applicant requests
   * ownership over
   */
  entity: string;
  /**
   * Optional map containing ownership request specific information: key – unique
   * name of the specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
}
