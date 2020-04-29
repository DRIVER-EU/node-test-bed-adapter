/**
 * Initialization message, contains simulation file names and settings (sent to
 * SUMO)
 */
export interface ISumoConfiguration {
  /**
   * Configuration file name (can be an absolute or relative path). This file
   * contains references to the network and the routes etc.
   */
  configFile: string;
  /** Begin time of the simulation in milliseconds >= 0 */
  begin: number;
  /** End time of the simulation in milliseconds > begin */
  end: number;
  /** Aggregation period for simulation outputs in milliseconds > 0 */
  aggregation: number;
  /**
   * Aggregation period for the outputs of each vehicle in milliseconds (default is
   * -1, which means do not collect individual data)
   */
  singleVehicle: number;
  /**
   * Aggregation period for the statistics about affected traffic in milliseconds
   */
  affectedTraffic: number;
}
