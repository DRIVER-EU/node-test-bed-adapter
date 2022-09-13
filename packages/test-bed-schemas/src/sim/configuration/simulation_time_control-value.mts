export enum TimeCommand {
  Init = 'Init',
  Start = 'Start',
  Pause = 'Pause',
  Update = 'Update',
  Stop = 'Stop',
  Reset = 'Reset'
}

/**
 * Message to control the simulation time: start/stop/pause the simulation, and
 * specify time and speed of it.
 */
export interface ITimeControl {
  /** The type of command to switch the state of the time-service. */
  command: TimeCommand;
  /**
   * Optional UNIX Epoch time in milliseconds marking the fictive date and time the
   * session should run with.
   */
  simulationTime?: null | undefined | number;
  /**
   * Optional speed factor to run the simulation. The range of this speed factor is
   * [0, infinity).
   */
  simulationSpeed?: null | undefined | number;
}
