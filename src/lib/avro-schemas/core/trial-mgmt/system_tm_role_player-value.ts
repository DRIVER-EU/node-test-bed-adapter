export enum Type {
  CALL = 'CALL',
  ACTION = 'ACTION',
  MESSAGE = 'MESSAGE',
  MAIL = 'MAIL',
  TWEET = 'TWEET'
}

/**
 * This is the message for role players, which is sent when the task is done.
 */
export interface IRolePlayerMessage {
  /** The unique ID of the message */
  id: string;
  /** The type of role play. */
  type: Type;
  /** The title of the role play message. */
  title: string;
  /** The headline of the role play message. */
  headline: string;
  /** The longer description of the role play message. */
  description: string;
  /** The name of the person that has to handle the message. */
  rolePlayerName: string;
  /** The names of the person that have to receive the message. */
  participantNames?: null | undefined | string[];
  /** An optional comment to the session state. */
  comment?: null | undefined | string;
}
