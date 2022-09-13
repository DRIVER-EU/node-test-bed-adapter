export enum Status {
  Actual = 'Actual',
  Exercise = 'Exercise',
  System = 'System',
  Test = 'Test',
  Draft = 'Draft'
}

export enum MsgType {
  Alert = 'Alert',
  Update = 'Update',
  Cancel = 'Cancel',
  Ack = 'Ack',
  Error = 'Error'
}

export enum Scope {
  Public = 'Public',
  Restricted = 'Restricted',
  Private = 'Private'
}

export enum Category {
  Geo = 'Geo',
  Met = 'Met',
  Safety = 'Safety',
  Security = 'Security',
  Rescue = 'Rescue',
  Fire = 'Fire',
  Health = 'Health',
  Env = 'Env',
  Transport = 'Transport',
  Infra = 'Infra',
  CBRNE = 'CBRNE',
  Other = 'Other'
}

export enum ResponseType {
  Shelter = 'Shelter',
  Evacuate = 'Evacuate',
  Prepare = 'Prepare',
  Execute = 'Execute',
  Avoid = 'Avoid',
  Monitor = 'Monitor',
  Assess = 'Assess',
  AllClear = 'AllClear',
  None = 'None'
}

export enum Urgency {
  Immediate = 'Immediate',
  Expected = 'Expected',
  Future = 'Future',
  Past = 'Past',
  Unknown = 'Unknown'
}

export enum Severity {
  Extreme = 'Extreme',
  Severe = 'Severe',
  Moderate = 'Moderate',
  Minor = 'Minor',
  Unknown = 'Unknown'
}

export enum Certainty {
  Observed = 'Observed',
  Likely = 'Likely',
  Possible = 'Possible',
  Unlikely = 'Unlikely',
  Unknown = 'Unknown'
}

export interface IValueNamePair {
  valueName: string;
  value: string;
}

export interface IResource {
  resourceDesc: string;
  size?: null | undefined | number;
  /** TODO, anyURI */
  uri?: null | undefined | string;
  /** The mimetype of the resource! */
  mimeType?: null | undefined | string;
  deferUri?: null | undefined | string;
  digest?: null | undefined | string;
}

export interface IArea {
  areaDesc: string;
  polygon?: null | undefined | string | string[];
  circle?: null | undefined | string | string[];
  geocode?: null | undefined | IValueNamePair | IValueNamePair[];
  altitude?: null | undefined | number;
  ceiling?: null | undefined | number;
}

export interface IInfo {
  language: string | null | undefined;
  category: Category | Category[];
  event: string;
  responseType?: null | undefined | ResponseType | ResponseType[];
  urgency: Urgency;
  severity: Severity;
  certainty: Certainty;
  audience?: null | undefined | string;
  eventCode?: null | undefined | IValueNamePair | IValueNamePair[];
  /** TODO: datetime */
  effective?: null | undefined | string;
  /** TODO: datetime */
  onset?: null | undefined | string;
  /** TODO: datetime */
  expires?: null | undefined | string;
  senderName?: null | undefined | string;
  headline?: null | undefined | string;
  description?: null | undefined | string;
  instruction?: null | undefined | string;
  /** TODO: anyURI */
  web?: null | undefined | string;
  contact?: null | undefined | string;
  parameter?: null | undefined | IValueNamePair | IValueNamePair[];
  resource?: null | undefined | IResource | IResource[];
  area?: null | undefined | IArea | IArea[];
}

/** CAP Alert Message (version 1.2) */
export interface IAlert {
  identifier: string;
  sender: string;
  /** TODO xs:dateTime Used pattern */
  sent: string;
  status: Status;
  msgType: MsgType;
  source?: null | undefined | string;
  scope: Scope;
  restriction?: null | undefined | string;
  addresses?: null | undefined | string;
  code?: null | undefined | string | string[];
  note?: null | undefined | string;
  references?: null | undefined | string;
  incidents?: null | undefined | string;
  info?: null | undefined | IInfo | IInfo[];
}
