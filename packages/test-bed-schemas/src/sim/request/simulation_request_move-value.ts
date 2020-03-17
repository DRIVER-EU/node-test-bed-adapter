import { ILocation } from '../..';

/**
 * Straight – move in a direct line to all waypoints without taking into account
 * the terrain; CrossCountry – move directly to all waypoints without taking into
 * account the roads; OnlyRoads – stay on the roads to get to the closest point
 * to the waypoints that is still on a road; RoadsAndCrossCountry – move to the
 * waypoints by taking into account the roads; it is allowed to go off the road
 */
export enum MoveType {
  Straight = 'Straight',
  CrossCountry = 'CrossCountry',
  OnlyRoads = 'OnlyRoads',
  RoadsAndCrossCountry = 'RoadsAndCrossCountry',
}

/**
 * A move request is a specific request for moving or transporting a given
 * simulation entity towards a given destination, possibly over a given set of
 * waypoints or route. *Copyright (C) 2019-2020 XVR Simulation B.V., Delft, The
 * Netherlands, Martijn Hendriks <hendriks @ xvrsim.com>. This file is licensed
 * under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IRequestMove {
  /** Unique case-insensitive identifier of the request */
  id: string;
  /**
   * Unique case-insensitive identifier of the connected application sending the
   * request
   */
  applicant: string;
  /**
   * Unique identifiers of the entities the applicant requests to be moved. This
   * also allows multiple entities to move in a convoy
   */
  entities: string[];
  /**
   * Unique identifier of the entity the applicant requests the given entities to
   * move to
   */
  destination: string;
  /** Optional list of locations to visit consecutively along the movement */
  waypoints: ILocation[];
  /** Optional type of movement */
  moveType: MoveType;
  /**
   * Optional feature collection identifier of the preferred route that should be
   * followed. This property should not be used together with the waypoints property
   */
  route?: null | undefined | string;
  /**
   * Optional map containing transport request specific information: key – unique
   * name of the specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
}
