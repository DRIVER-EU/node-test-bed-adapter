/**
 * The message send by the admin tool to tell the adaptor to which topic he is
 * invited to join.
 */
export interface ITopicInvite {
  /** Client id */
  id: string;
  /** The name of the Topic to which the adaptor (client) is invited to join. */
  topicName: string;
  /** Indicates if the client is allowed to connect as subscriber. */
  subscribeAllowed: boolean;
  /** Indicates if the client is allowed to connect as subscriber. */
  publishAllowed: boolean;
}
