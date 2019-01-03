export enum TimeControlCommand {
  INIT = 'Init',
  START = 'Start',
  PAUSE = 'Pause',
  UPDATE = 'Update',
  STOP = 'Stop',
  RESET = 'Reset',
}

/**
 * Time control message to distribute the trial state.
 */
export interface ITimeControlMessage {
  /**
   * The type of command to switch the state of the time-service.
   */
  command: TimeControlCommand;
  /**
   * The fictive date and time of the simulation / trial as the number of milliseconds
   * from the UNIX epoch, 1 January 1970 00:00:00.000 UTC.
   */
  trialTime: number;
  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  trialTimeSpeed: number;
}
