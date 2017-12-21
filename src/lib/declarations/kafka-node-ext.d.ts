export interface INode {
  nodeId: number;
  host: string;
  port: number;
}

export interface INodeItem { [nodeId: string]: INode }

export interface ITopicMetadata {
  topic: string;
  partition: number;
  leader: number;
  replicas: number[];
  isr: number[]
}

export interface ITopicMetadataItem { [partitionId: string]: ITopicMetadata }

export interface ITopicsMetadata extends Array<INodeItem | { metadata: { [topic: string]: ITopicMetadataItem } }> {}
