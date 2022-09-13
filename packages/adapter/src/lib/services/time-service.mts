import { ITimeManagement, TimeState } from 'test-bed-schemas';

/**
 * A service to maintain the simulation time and scenario duration.
 * When no simulation is running, returns the actual system time.
 */
export class TimeService {
  private updatedSimTimeAt: number = Date.now();
  /**
   * The date and time the simulationTime was updated as the number of milliseconds
   * from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  private timestamp = Date.now();
  /**
   * The fictive date and time of the simulation / trial as the number of milliseconds
   * from the UNIX epoch, 1 January 1970 00:00:00.000 UTC.
   */
  private simTime = Date.now();
  /**
   * The number of milliseconds from the start of the trial.
   */
  private simTimeElapsed = 0;
  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  private simSpeed = 1;
  /** The state of the Test-bed Time Service */
  private state = TimeState.Reset;

  /**
   * Set the simulation time.
   *
   * @param simTime Received time message
   */
  public setSimTime(tm: ITimeManagement) {
    if (tm.timestamp) {
      this.timestamp = tm.timestamp;
    }
    this.updatedSimTimeAt = Date.now();
    // const latency = this.updatedSimTimeAt - this.timestamp;
    this.simSpeed = tm.simulationSpeed || 1;
    if (tm.tags && tm.tags.hasOwnProperty('timeElapsed')) {
      this.simTimeElapsed = +tm.tags.timeElapsed;
    }
    if (tm.state) {
      this.state = tm.state;
    }
    this.simTime = tm.simulationTime ? tm.simulationTime : Date.now();
  }

  /**
   * Get the simulation time as Date.
   */
  public get simulationTime(): Date {
    if (this.state === TimeState.Reset) {
      return new Date();
    }
    const timePassedSinceLastUpdate = Date.now() - this.updatedSimTimeAt;
    return new Date(this.simTime + timePassedSinceLastUpdate * this.simSpeed);
  }

  /**
   * Get elapsed time in msec.
   */
  public get timeElapsed(): number {
    const timePassedSinceLastUpdate = Date.now() - this.updatedSimTimeAt;
    return this.simTimeElapsed + timePassedSinceLastUpdate;
  }

  public get timeState(): TimeState {
    return this.state;
  }

  /**
   * Positive number, indicating how fast the simulation / trial time moves with respect
   * to the actual time. A value of 0 means a pause, 1 is as fast as real-time.
   */
  public get simulationSpeed(): number {
    return this.simSpeed;
  }
}
