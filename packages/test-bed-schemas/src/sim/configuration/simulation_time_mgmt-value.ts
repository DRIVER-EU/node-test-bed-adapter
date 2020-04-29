/**
 * Initialization – preparing for the actual start of the simulation time; Started
 * – the simulation time is started; Paused – the simulation time is paused;
 * Stopped – the simulation time is stopped; Reset – the simulation time is reset
 */
export enum TimeState {
  Initialization = 'Initialization',
  Started = 'Started',
  Paused = 'Paused',
  Stopped = 'Stopped',
  Reset = 'Reset'
}

/**
 * The time management message can be used for informing connected applications on
 * time progression and changes. *Copyright (C) 2019-2020 XVR Simulation B.V.,
 * Delft, The Netherlands, Martijn Hendriks <hendriks @ xvrsim.com>. This file is
 * licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface ITimeManagement {
  /** State the time is currently in */
  state: TimeState;
  /**
   * Optional map containing session time specific information: key – unique name of
   * the specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was or
   * needs to be performed
   */
  timestamp?: null | undefined | number;
  /**
   * Optional UNIX Epoch time in milliseconds marking the fictive date and time the
   * session should run with
   */
  simulationTime?: null | undefined | number;
  /**
   * Optional speed factor this session wants to run a simulation. The range of this
   * speed factor is [0, infinity)
   */
  simulationSpeed?: null | undefined | number;
}
