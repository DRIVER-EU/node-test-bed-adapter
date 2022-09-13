export enum AttrType {
  MSISDN = 'MSISDN',
  IMSI = 'IMSI',
  IMEI = 'IMEI',
  MIN = 'MIN',
  MDN = 'MDN',
  EME_MSID = 'EME_MSID',
  ASID = 'ASID',
  OPE_ID = 'OPE_ID',
  IPV4 = 'IPV4',
  IPV6 = 'IPV6',
  SESSID = 'SESSID'
}

export enum AttrEnc {
  ASC = 'ASC',
  CRP = 'CRP'
}

export interface IMsid {
  msid: string;
  attr_type: AttrType;
  attr_enc: AttrEnc;
}

export interface ITime {
  /** UTC Timestamp in milliseconds. Original MLP uses String: yyyyMMddhhmmss */
  time: number;
  /**
   * Specifies the UTC [UTC] offset in hours and minutes. Positive values indicate
   * time zones east of Greenwich.
   */
  attr_utc_off: string;
}

export interface ICoord {
  /** The first coordinate in a coordinate system (30 27 45.3N) */
  X: string;
  /**
   * Second ordinate in a coordinate.system (45 25 52.9E). This is optional if it is
   * a linear coordinate system.
   */
  Y?: null | undefined | string;
  /**
   * Third ordinate in a coordinate system which has at least three ordinates.
   */
  Z?: null | undefined | string;
}

export interface IPoint {
  coord: ICoord;
  attr_gid?: null | undefined | string;
  attr_srsName?: null | undefined | string;
}

export interface ILineString {
  /** Must contain at least 2 coordinates */
  coord: ICoord[];
  attr_gid?: null | undefined | string;
  attr_srsName?: null | undefined | string;
}

export interface ILinearRing {
  /** Must contain at least 3 coordinates */
  coords: ICoord[];
}

export interface IPolygon {
  outerBoundaryIs: ILinearRing;
  innerBoundaryIs?: null | undefined | ILinearRing[];
  attr_gid?: null | undefined | string;
  attr_srsName?: null | undefined | string;
}

/**
 * TODO: fix coord top left and bottom right names to be compatible with schema
 */
export interface IBox {
  coordTopLeft: ICoord;
  coordBottomRight: ICoord;
  attr_gid?: null | undefined | string;
  attr_srsName?: null | undefined | string;
}

export enum DistanceUnit {
  meter = 'meter'
}

export interface ICircularArea {
  coord: ICoord;
  radius: number;
  distanceUnit?: null | undefined | DistanceUnit;
  attr_gid?: null | undefined | string;
  attr_srsName?: null | undefined | string;
}

export enum AngularUnit {
  Degrees = 'Degrees',
  Radians = 'Radians'
}

export interface ICircularArcArea {
  coord: ICoord;
  inRadius: number;
  outRadius: number;
  startAngle: number;
  stopAngle: number;
  angularUnit?: null | undefined | AngularUnit;
  distanceUnit?: null | undefined | DistanceUnit;
  attr_gid?: null | undefined | string;
  attr_srsName?: null | undefined | string;
}

export interface IEllipticalArea {
  coord: ICoord;
  angle: number;
  semiMajor: number;
  semiMinor: number;
  stopAngle: number;
  angularUnit?: null | undefined | AngularUnit;
  distanceUnit?: null | undefined | DistanceUnit;
  attr_gid?: null | undefined | string;
  attr_srsName?: null | undefined | string;
}

export interface IAlt {
  /** Altitude in meters */
  alt: number;
}

export interface IAltAcc {
  /** Accuracy of Altitude in meters */
  alt_acc?: null | undefined | number;
}

export interface IPd {
  time: ITime;
  /**
   * TODO: add  MultiLineString | MultiPoint | MultiPolygon if they are needed
   */
  shape: IPoint | ILineString | IPolygon | IBox | ICircularArea | ICircularArcArea | IEllipticalArea;
  alt?: null | undefined | IAlt;
  altAcc?: null | undefined | IAltAcc;
  /** Speed in m/s */
  speed?: null | undefined | number;
  /** Direction of movement in degrees */
  direction?: null | undefined | number;
  /**
   * Probability in percent that the Mobile Station is located in the position area
   * that is returned
   */
  lev_conf?: null | undefined | number;
}

export enum ResultEnum {
  OK = 'OK',
  SYSTEM_FAILURE = 'SYSTEM_FAILURE',
  UNSPECIFIED_ERROR = 'UNSPECIFIED_ERROR',
  UNAUTHORIZED_APPLICATION = 'UNAUTHORIZED_APPLICATION',
  UNKNOWN_SUBSCRIBER = 'UNKNOWN_SUBSCRIBER',
  ABSENT_SUBSCRIBER = 'ABSENT_SUBSCRIBER',
  POSITION_METHOD_FAILURE = 'POSITION_METHOD_FAILURE',
  CONGESTION_IN_LOCATION_SERVER = 'CONGESTION_IN_LOCATION_SERVER',
  CONGESTION_IN_MOBILE_NETWORK = 'CONGESTION_IN_MOBILE_NETWORK',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  TOO_MANY_POSITION_ITEMS = 'TOO_MANY_POSITION_ITEMS',
  FORMAT_ERROR = 'FORMAT_ERROR',
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  PROTOCOL_ELEMENT_NOT_SUPPORTED = 'PROTOCOL_ELEMENT_NOT_SUPPORTED',
  SERVICE_NOT_SUPPORTED = 'SERVICE_NOT_SUPPORTED',
  PROTOCOL_ELEMENT_ATTRIBUTE_NOT_SUPPORTED = 'PROTOCOL_ELEMENT_ATTRIBUTE_NOT_SUPPORTED',
  INVALID_PROTOCOL_ELEMENT_VALUE = 'INVALID_PROTOCOL_ELEMENT_VALUE',
  INVALID_PROTOCOL_ELEMENT_ATTRIBUTE_VALUE = 'INVALID_PROTOCOL_ELEMENT_ATTRIBUTE_VALUE',
  PROTOCOL_ELEMENT_VALUE_NOT_SUPPORTED = 'PROTOCOL_ELEMENT_VALUE_NOT_SUPPORTED',
  PROTOCOL_ELEMENT_ATTRIBUTE_VALUE_NOT_SUPPORTED = 'PROTOCOL_ELEMENT_ATTRIBUTE_VALUE_NOT_SUPPORTED',
  QOP_NOT_ATTAINABLE = 'QOP_NOT_ATTAINABLE',
  POSITIONING_NOT_ALLOWED = 'POSITIONING_NOT_ALLOWED',
  DISALLOWED_BY_LOCAL_REGULATIONS = 'DISALLOWED_BY_LOCAL_REGULATIONS',
  MISCONFIGURATION_OF_LOCATION_SERVER = 'MISCONFIGURATION_OF_LOCATION_SERVER'
}

export interface IResult {
  /** See MLP 3.1 specifications chapter 5.4 on Result Codes */
  result: ResultEnum;
  /** See MLP 3.1 specifications chapter 5.4 on Result Codes */
  attr_resid: string;
}

export interface IPoserr {
  result: IResult;
  add_info?: null | undefined | string;
  time: ITime;
}

export interface IPos {
  msid: IMsid;
  pd?: null | undefined | IPd;
  poserr?: null | undefined | IPoserr;
}

/**
 * Mobile Location Protocol (MLP) Approved Version 3.1.
 * http://www.openmobilealliance.org/release/MLP/V3_1-20110920-A/OMA-LIF-MLP-V3_1-
 * 20110920-A.pdf - Standard Location Report (5.2.3.7)
 */
export interface ISlRep {
  attr_ver: string;
  pos: IPos;
}
