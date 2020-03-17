/**
 * A location is defined as a WGS84-based standard representation of a location on
 * earth
 */
export interface ILocation {
  /** In decimal degrees, ranging from [-90, 90] where 0 is the equator */
  latitude: number;
  /**
   * In decimal degrees, ranging from (-180, 180] where 0 is the Prime Meridian
   * (line going through the geographic north, Greenwich, and the geographic south)
   */
  longitude: number;
  /**
   * Optional in meters, where 0 is the surface of the WGS84-based ellipsoid, or
   * another agreed upon common ground level (specified inside the configuration
   * guidelines). A positive number indicates a location outside the ellipsoid (or
   * above the ground level), while a negative number indicates a location inside
   * the ellipsoid (or below the ground level). If an altitude is not provided, it
   * is presumed that the location is at the ground level of the provided latitude
   * and longitude coordinates
   */
  altitude?: null | undefined | number;
}

/**
 * An orientation is defined in the aviation axes conventions representation. It
 * is a left-handed item-centric reference system, with in default initial state
 * its heading/yaw-axis pointing away from the centre of the WGS84-based
 * ellipsoid, its pitch-axis pointing to the right, and its roll/bank-axis
 * pointing forward
 */
export interface IOrientation {
  /**
   * In decimal degrees, ranging from [0, 360) where 0 is pointing towards the
   * geographic north. The yaw value is applied in a clockwise rotation over the
   * item’s heading/yaw-axis. A yaw value of 90 makes the item face east, while a
   * yaw of 270 makes it face west
   */
  yaw: number;
  /**
   * In decimal degrees, ranging from [-90, 90] where 0 is perpendicular to the line
   * crossing the item’s location and the centre of the WGS84-based ellipsoid. The
   * pitch value is applied in a counter-clockwise rotation over the item’s
   * pitch-axis. A pitch value of 45 makes the item face 45 degrees upwards, while
   * a pitch of -20 makes it face 20 degrees downwards
   */
  pitch: number;
  /**
   * In decimal degrees, ranging from (-180, 180] where 0 is perpendicular to the
   * line crossing the item’s location and the centre of the WGS84-based ellipsoid.
   * The roll value is applied in a clockwise rotation over the item’s
   * roll/bank-axis. A roll value of 45 makes the item roll 45 degrees to the
   * right, while a roll of -50 makes it roll 50 degrees to the left
   */
  roll: number;
}

/**
 * A velocity is defined in the aviation axes conventions representation of a
 * velocity vector. It is a left-handed item-centric reference system, with in
 * default initial state its heading/yaw-axis pointing away from the centre of
 * the WGS84-based ellipsoid, its pitch-axis pointing to the right, and its
 * roll/bank-axis pointing forward
 */
export interface IVelocity {
  /**
   * In decimal degrees, ranging from [0, 360) where 0 is pointing towards the
   * geographic north. The yaw value is applied in a clockwise rotation over the
   * item’s heading/yaw-axis. A yaw value of 90 makes the item face east, while a
   * yaw of 270 makes it face west
   */
  yaw: number;
  /**
   * In decimal degrees, ranging from [-90, 90] where 0 is perpendicular to the line
   * crossing the item’s location and the centre of the WGS84-based ellipsoid. The
   * pitch value is applied in a counter-clockwise rotation over the item’s
   * pitch-axis. A pitch value of 45 makes the item face 45 degrees upwards, while
   * a pitch of -20 makes it face 20 degrees downwards
   */
  pitch: number;
  /**
   * In meter per seconds, ranging from [0, infinity) where 0 is standing still
   * relative to the earth’s rotation
   */
  magnitude: number;
}

/**
 * An item is a specific entity that is bound to one position in the world. It
 * should represent a tangible object, person or vehicle. *Copyright (C)
 * 2019-2020 XVR Simulation B.V., Delft, The Netherlands, Martijn Hendriks
 * <hendriks @ xvrsim.com>. This file is licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IItem {
  /** Unique case-insensitive identifier of the item */
  id: string;
  /** Location of the item */
  location: ILocation;
  /** Optional orientation of the item */
  orientation?: null | undefined | IOrientation;
  /** Optional velocity of the item */
  velocity?: null | undefined | IVelocity;
  /** Optional name of the item */
  name?: null | undefined | string;
  /** Optional description of the item */
  description?: null | undefined | string;
  /** Optional type of the item */
  type?: null | undefined | string;
  /**
   * Optional unique case-insensitive identifier of the connected application owning
   * the item
   */
  owner?: null | undefined | string;
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was
   * performed
   */
  timestamp?: null | undefined | number;
  /**
   * Optional map containing item specific information: key – unique name of the
   * specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
  /** Optional list of item identifiers that belong to this item */
  children?: null | undefined | string[];
}
