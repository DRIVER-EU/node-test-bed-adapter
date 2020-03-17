export interface IsubscribeAllowed {
  /** Sender Client id */
  id: string;
}

export interface IpublishedAllowed {
  /** Sender Client id */
  id: string;
}

/**
 * The message send to the admin tool to request a topic to be created and grant
 * clients access as publisher/subscriber to them.
 */
export interface ITopicCreate {
  /** Sender Client id */
  id: string;
  /** The name of the Topic to be created by the admin tool. */
  topicName: string;
  /** The standard (schema) that should be registered for this topic. */
  standard: string;
  /**
   * The version of the standard (schema) that should be registered for this topic.
   */
  version: string;
  /** Indicates which clients are allowed to connect as subscriber. */
  subscribeAllowed: IsubscribeAllowed;
  /** Indicates which clients are allowed to connect as publisher. */
  publishedAllowed: IpublishedAllowed;
}
