export enum SessionState {
  START = 'START',
  STOP = 'STOP'
}

/** This is the message for init. the trial session. */
export interface ISessionMgmt {
  /** The unique ID of the Trial */
  trialId: string;
  /** The name of the Trial */
  trialName: string;
  /** The unique ID of the Scenario */
  scenarioId: string;
  /** The name of the Scenario */
  scenarioName: string;
  /** The unique ID of the Session */
  sessionId: string;
  /** The name of the Session */
  sessionName: string;
  /** The state of the Session. */
  sessionState: SessionState;
  /** An optional comment to the session state. */
  comment?: null | undefined | string;
}
