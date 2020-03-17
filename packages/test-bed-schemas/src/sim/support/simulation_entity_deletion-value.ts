/**
 * An entity deletion message is a support messages indicating a shared entity
 * should no longer be shared. *Copyright (C) 2019-2020 XVR Simulation B.V.,
 * Delft, The Netherlands, Martijn Hendriks <hendriks @ xvrsim.com>. This file is
 * licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IEntityDeletion {
  /** Unique case-insensitive identifier of the entity */
  id: string;
  /**
   * Optional unique case-insensitive identifier of the connected application owning
   * the entity
   */
  owner?: null | undefined | string;
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was
   * performed
   */
  timestamp?: null | undefined | number;
}
