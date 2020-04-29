export interface ILINKCONTEXT {
  ID: string;
  ROLE?: null | undefined | string;
}

export interface IORIGINCONTEXT {
  ORG_ID: string;
  USER_ID?: null | undefined | string;
  NAME?: null | undefined | string;
}

export interface IEXTERNAL_INFOCONTEXT {
  FREETEXT?: null | undefined | string;
  URI: string;
  TYPE?: null | undefined | string;
}

export interface ICONTEXT {
  ID: string;
  MODE: string;
  MSGTYPE: string;
  CREATION?: null | undefined | number;
  LINK?: null | undefined | ILINKCONTEXT[];
  LEVEL?: null | undefined | string;
  SECLASS?: null | undefined | string;
  FREETEXT?: null | undefined | string;
  URGENCY?: null | undefined | string;
  ORIGIN?: null | undefined | IORIGINCONTEXT;
  EXTERNAL_INFO?: null | undefined | IEXTERNAL_INFOCONTEXT[];
}

export interface IETYPEEVENT {
  CATEGORY: string[];
  ACTOR: string[];
  LOCTYPE: string[];
  ENV: string[];
}

export interface IREFERENCEEVENT {
  ORG_ID: string;
  OTHER_EVENT_ID: string[];
}

export interface ICASUALTIESEVENT {
  CONTEXT: string;
  DATIME?: null | undefined | number;
  DECONT?: null | undefined | string;
  TRIAGERED?: null | undefined | string;
  TRIAGEYELLOW?: null | undefined | string;
  TRIAGEGREEN?: null | undefined | string;
  TRIAGEBLACK?: null | undefined | string;
  MISSING?: null | undefined | string;
}

export interface IEVACEVENT {
  DATIME?: null | undefined | number;
  DISPLACED?: null | undefined | string;
  EVACUATED?: null | undefined | string;
}

export interface ICOORDType {
  LAT: number;
  LON: number;
  HEIGHT?: null | undefined | number;
}

export interface IPOSITION {
  LOC_ID?: null | undefined | string;
  NAME?: null | undefined | string;
  TYPE?: null | undefined | string;
  COORDSYS?: null | undefined | string;
  COORD: ICOORDType[];
  HEIGHT_ROLE?: null | undefined | string;
  ADDRESS: string[];
}

export interface IEGEOEVENT {
  DATIME?: null | undefined | number;
  TYPE: string;
  POSITION: IPOSITION;
  WEATHER: string[];
  FREETEXT?: null | undefined | string;
  ID?: null | undefined | string;
  STATUS?: null | undefined | string;
}

export interface IEVENT {
  ID: string;
  NAME?: null | undefined | string;
  MAIN_EVENT_ID?: null | undefined | string;
  ETYPE?: null | undefined | IETYPEEVENT;
  SOURCE?: null | undefined | string;
  SCALE?: null | undefined | string;
  CERTAINTY?: null | undefined | string;
  DECL_DATIME?: null | undefined | number;
  OCC_DATIME?: null | undefined | number;
  OBS_DATIME?: null | undefined | number;
  STATUS?: null | undefined | string;
  RISK_ASSESSMNT?: null | undefined | string;
  REFERENCE?: null | undefined | IREFERENCEEVENT[];
  CASUALTIES?: null | undefined | ICASUALTIESEVENT[];
  EVAC?: null | undefined | IEVACEVENT[];
  EGEO?: null | undefined | IEGEOEVENT[];
  CAUSE?: null | undefined | string;
  FREETEXT?: null | undefined | string;
}

export interface IRTYPERESOURCE {
  CLASS: string;
  CAPABILITY: string[];
  CHARACTERISTICS: string[];
}

export interface IRGEORESOURCE {
  DATIME?: null | undefined | number;
  TYPE: string;
  POSITION: IPOSITION;
  FREETEXT?: null | undefined | string;
  ID?: null | undefined | string;
}

export interface ICONTACTRESOURCE {
  TYPE: string;
  DETAIL: string;
}

export interface IRESOURCE {
  RTYPE: IRTYPERESOURCE;
  ID?: null | undefined | string;
  ORG_ID?: null | undefined | string;
  NAME?: null | undefined | string;
  FREETEXT?: null | undefined | string;
  RGEO: IRGEORESOURCE[];
  QUANTITY?: null | undefined | number;
  UM?: null | undefined | string;
  STATUS?: null | undefined | string;
  NATIONALITY?: null | undefined | string;
  CONTACT: ICONTACTRESOURCE[];
}

export interface IMISSION {
  TYPE: string[];
  FREETEXT?: null | undefined | string;
  ID?: null | undefined | string;
  MAIN_MISSION_ID?: null | undefined | string;
  ORG_ID?: null | undefined | string;
  NAME?: null | undefined | string;
  STATUS?: null | undefined | string;
  START_TIME?: null | undefined | number;
  END_TIME?: null | undefined | number;
  RESOURCE_ID: string[];
  PARENT_MISSION_ID: string[];
  CHILD_MISSION_ID: string[];
  POSITION?: null | undefined | IPOSITION;
  PRIORITY?: null | undefined | string;
}

/** EMSI (TSO) Message (version 2.0) */
export interface ITSO_2_0 {
  CONTEXT: ICONTEXT;
  EVENT?: null | undefined | IEVENT;
  RESOURCE?: null | undefined | IRESOURCE[];
  MISSION?: null | undefined | IMISSION[];
}
