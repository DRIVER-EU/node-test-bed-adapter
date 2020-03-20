export enum Command {
  Init = 'Init',
  Start = 'Start',
  Pause = 'Pause',
  Update = 'Update',
  Stop = 'Stop',
  Reset = 'Reset'
}

/** TimingControl message to distribute the trial time changes. */
export interface ITimingControl {
  /** The type of command to switch the state of the time-service. */
  command: Command;
  /**
   * The date and time the distribution message was sent as the number of
   * milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  trialTime?: null | undefined | number;
  /** The Trialtime speed factor. */
  trialTimeSpeed?: null | undefined | number;
}
