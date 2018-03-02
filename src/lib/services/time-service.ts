import { ITimeMessage } from '../models/time-message';

/**
 * A service to maintain the simulation time and scenario duration.
 * When no simulation is running, returns the actual system time.
 */
export class TimeService {
  private updatedSimTimeAt: number = Date.now();
  private curSimTime = this.updatedSimTimeAt;
  private trialTimeSpeed: number = 1;

  /**
   * Set the simulation time.
   *
   * @param simTime Received time message
   */
  public setSimTime(tm: ITimeMessage) {
    this.trialTimeSpeed = tm.trialTimeSpeed;
    this.updatedSimTimeAt = Date.now();
    const latency = this.updatedSimTimeAt - tm.updatedAt;
    this.curSimTime = tm.trialTime + latency * tm.trialTimeSpeed;
  }

  /**
   * Get the simulation time as Date.
   */
  public get simTime(): Date {
    const now = Date.now();
    const timePassedSinceLastUpdate = now - this.updatedSimTimeAt;
    return new Date(this.curSimTime + timePassedSinceLastUpdate * this.trialTimeSpeed);
  }
}