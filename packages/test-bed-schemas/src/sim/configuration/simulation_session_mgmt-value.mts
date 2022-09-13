/**
 * Initializing – preparing for the actual start of a session, including loading
 * in pre-computed data and configuring the connected application as was designed
 * for this particular use of the common simulation space; Started – the session
 * has started and is running; Stopped – the session is stopped; Closed – the
 * session is closed after all administrative tasks are done, so no more messages
 * can be exchanged
 */
export enum SessionState {
  Initializing = 'Initializing',
  Started = 'Started',
  Stopped = 'Stopped',
  Closed = 'Closed'
}

/**
 * The session management message is used for informing connected applications on
 * session details and primarily the current state of the session. *Copyright (C)
 * 2019-2020 XVR Simulation B.V., Delft, The Netherlands, Martijn Hendriks
 * <hendriks @ xvrsim.com>. This file is licensed under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface ISessionManagement {
  /** Unique case-insensitive identifier of the session */
  id: string;
  /** State the session is currently in */
  state: SessionState;
  /** Optional name of the session */
  name?: null | undefined | string;
  /**
   * Optional map containing session specific information: key – unique name of the
   * specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was or
   * needs to be performed
   */
  timestamp?: null | undefined | number;
  /**
   * Optional UNIX Epoch time in milliseconds marking the fictive date and time the
   * session should run with
   */
  simulationTime?: null | undefined | number;
}
