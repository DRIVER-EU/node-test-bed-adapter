import { ILocation, MoveType } from '../..';

/**
 * A route request is a specific request for calculating a route from a starting
 * location, passing through several waypoints. *Copyright (C) 2019-2020 XVR
 * Simulation B.V., Delft, The Netherlands, Martijn Hendriks <hendriks @
 * xvrsim.com>. This file is licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IRequestRoute {
  /** Unique case-insensitive identifier of the request */
  id: string;
  /**
   * Unique case-insensitive identifier of the connected application sending the
   * request
   */
  applicant: string;
  /** Location that marks the start of the route */
  start: ILocation;
  /** Ordered list of locations to visit consecutively */
  waypoints: ILocation[];
  /** Optional type of movement to consider calculating the route */
  moveType: MoveType;
  /**
   * Optional map containing route request specific information: key – unique name
   * of the specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
}
