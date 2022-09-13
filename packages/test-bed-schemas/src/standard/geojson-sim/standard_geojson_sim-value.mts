export enum TypeEnum {
  OBJECT = 'OBJECT',
  PERSON = 'PERSON',
  CAR = 'CAR',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  BOAT = 'BOAT',
  PLANE = 'PLANE',
  HELICOPTER = 'HELICOPTER',
  MOTORCYCLE = 'MOTORCYCLE',
  DRONE = 'DRONE',
  UNIT = 'UNIT',
  STATION = 'STATION',
  UNITGROUP = 'UNITGROUP',
  UNKNOWN = 'UNKNOWN',
}

/** Specfic properties for an Simulated entity */
export interface ISimulatedEntityProperties {
  /** globally unique identifier for this entity */
  guid: string;
  /** name of this entity */
  name: string;
  /** speed of the entity in m/s */
  speed?: null | undefined | number;
  type: TypeEnum;
  /**
   * Label that describes the domain of the entity. E.g. Police, Medical, Fire or
   * Military.
   */
  label: string;
  /**
   * Entities contained by this entity. Only used for Units, Stations and Unit
   * Groups. Array of strings consists of guids.
   */
  subEntities?: null | undefined | string[];
}
