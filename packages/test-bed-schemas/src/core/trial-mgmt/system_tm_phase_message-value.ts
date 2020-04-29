export enum Phase {
  PROPER_NAME = 'PROPER_NAME',
  INITIALIZATION = 'INITIALIZATION',
  PREPARATION = 'PREPARATION',
  PRE_INCIDENT = 'PRE_INCIDENT',
  INCIDENT = 'INCIDENT',
  POST_INCIDENT = 'POST_INCIDENT'
}

/** This is the message for phase information. */
export interface IPhaseMessage {
  /** The unique ID of the message */
  id: string;
  /** The current active phase. */
  phase: Phase;
  /** Indicating if started (true) or ended (false). */
  isStarting: boolean;
  /** An optional alternative name for the phase. Linked to PROPER_NAME. */
  alternativeName?: null | undefined | string;
}
