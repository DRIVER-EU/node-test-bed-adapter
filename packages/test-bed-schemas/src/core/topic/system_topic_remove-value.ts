/**
 * The message send to the adapter(s) to inform them that the topic is going to be
 * removed.
 */
export interface ITopicRemove {
  /** Sender Client id */
  id: string;
  /** The name of the Topic to be created by the admin tool. */
  topicName: string;
}
