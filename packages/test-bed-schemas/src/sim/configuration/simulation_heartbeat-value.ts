/**
 * A heartbeat message is used to derive the state of responsiveness of a
 * connected application
 */
export interface IHeartbeat {
  /**
   * Unique case-insensitive identifier of the connected application sending out
   * this message
   */
  id: string;
  /**
   * UNIX Epoch time in milliseconds marking the time the connected application was
   * last responding
   */
  alive: number;
  /**
   * Optional case-insensitive identifier from which device or location this message
   * was sent (e.g. IP address, machine name)
   */
  origin?: null | undefined | string;
}
