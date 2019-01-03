import { TimeState } from './time-state';

/**
 * Timing message to distribute the trial time.
 */
export interface ITimeMessage {
  /**
   * The date and time the trialTime was updated as the number of milliseconds
   * from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  updatedAt: number;
  /**
   * The fictive date and time of the simulation / trial as the number of milliseconds
   * from the UNIX epoch, 1 January 1970 00:00:00.000 UTC.
   */
  trialTime: number;
  /**
   * The number of milliseconds from the start of the trial.
   */
  timeElapsed: number;
  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  trialTimeSpeed: number;
  /** The state of the Test-bed Time Service */
  state: TimeState;
}
