import { ITiming, TimeState } from '../avro-schemas/core';

/**
 * A service to maintain the simulation time and scenario duration.
 * When no simulation is running, returns the actual system time.
 */
export class TimeService {
  private updatedSimTimeAt: number = Date.now();
  /**
   * The date and time the trialTime was updated as the number of milliseconds
   * from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  private updatedAt = Date.now();
  /**
   * The fictive date and time of the simulation / trial as the number of milliseconds
   * from the UNIX epoch, 1 January 1970 00:00:00.000 UTC.
   */
  private pTrialTime = Date.now();
  /**
   * The number of milliseconds from the start of the trial.
   */
  private pTimeElapsed = 0;
  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  private pTrialTimeSpeed = 1;
  /** The state of the Test-bed Time Service */
  private pState = TimeState.Idle;

  /**
   * Set the simulation time.
   *
   * @param simTime Received time message
   */
  public setSimTime(tm: ITiming) {
    const latency = 0; // this.updatedSimTimeAt - tm.updatedAt;
    this.updatedSimTimeAt = Date.now();
    this.updatedAt = tm.updatedAt;
    this.pTrialTimeSpeed = tm.trialTimeSpeed;
    this.pTimeElapsed = tm.timeElapsed;
    if (tm.state) {
      this.pState = tm.state;
    }
    this.pTrialTime = tm.trialTime + latency * tm.trialTimeSpeed;
  }

  /**
   * Get the simulation time as Date.
   */
  public get trialTime(): Date {
    const now = Date.now();
    const timePassedSinceLastUpdate = now - this.updatedSimTimeAt;
    return this.pState === TimeState.Idle
      ? new Date()
      : new Date(this.pTrialTime + timePassedSinceLastUpdate * this.pTrialTimeSpeed);
  }

  /**
   * Get elapsed time in msec.
   */
  public get timeElapsed(): number {
    const now = Date.now();
    const timePassedSinceLastUpdate = now - this.updatedSimTimeAt;
    return this.pTrialTime + timePassedSinceLastUpdate;
  }

  public get state(): TimeState {
    return this.pState;
  }

  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  public get trialTimeSpeed(): number {
    return this.pTrialTimeSpeed;
  }
}
