/** Heartbeat message, indicating that the client is still alive. */
export interface IHeartbeat {
  /** ID of the client */
  id: string;
  /**
   * The date and time the distribution message was sent as the number of
   * milliseconds from the unix epoch, 1 January 1970 00:00:00.000 UTC.
   */
  alive: number;
}
