import {
  FeatureType,
  IPoint,
  IMultiPoint,
  ILineString,
  IMultiLineString,
  IPolygon,
  IMultiPolygon,
} from '../../index.mjs';

export interface ISource {
  filename: string;
  camera_make?: null | undefined | string;
  width: number;
  size: number;
  height: number;
  direction?: null | undefined | number;
  camera_model?: null | undefined | string;
  field_of_view?: null | undefined | number;
}

export interface Imeta {
  Source: ISource;
}

export interface IRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  quality: number;
}

export interface Imeta {
  Region: IRegion;
}

export interface Ifiles {
  id: number;
  file_type: number;
  size: number | null | undefined;
  state: number;
  created: string;
  request_until?: null | undefined | string;
  meta?: null | undefined | string | Imeta;
  hash?: null | undefined | string;
  url?: null | undefined | string;
}

export interface Iproperties {
  id: number;
  priority: number;
  viewed: boolean;
  signature: string;
  instant: string;
  created?: null | undefined | string;
  updated: string;
  caption?: null | undefined | string;
  interpretation: string | null | undefined;
  meta: Imeta;
  version: string | null | undefined;
  application_id: string | null | undefined;
  seen: string | null | undefined;
  started: string | null | undefined;
  stopped: string | null | undefined;
  location_latitude: number;
  location_longitude: number;
  location_time: string;
  location_accuracy: number | null | undefined;
  location_altitude: number | null | undefined;
  location_provider: string | null | undefined;
  location_speed: number | null | undefined;
  location_meta: string | null | undefined;
  mission_id: number | null | undefined;
  mission_name: string | null | undefined;
  thumbnail_hash: string;
  preview_hash: string;
  category_id: number | null | undefined;
  category_name: string | null | undefined;
  application_device_type: number | null | undefined;
  application_last_login: string | null | undefined;
  application_phone: string | null | undefined;
  application_last_rate: number | null | undefined;
  application_updated: string | null | undefined;
  application_created: string | null | undefined;
  application_application_type: number | null | undefined;
  application_connection_type: number | null | undefined;
  application_connection_state: number | null | undefined;
  user_name: string;
  user_id: number;
  user_username: string;
  user_color: string | null | undefined;
  user_connection_type: number | null | undefined;
  user_last_login: string | null | undefined;
  user_last_rate: number | null | undefined;
  observation_url: string;
  observation_type: string;
  preview_url: string;
  preview_with_overlay_url: string;
  thumbnail_url: string;
  files: Ifiles[];
}

/** A GeoJSON Feature object */
export interface IPhotoFeature {
  type: FeatureType;
  bbox?: null | undefined | number[];
  geometry:
    | IPoint
    | IMultiPoint
    | ILineString
    | IMultiLineString
    | IPolygon
    | IMultiPolygon;
  properties: Iproperties;
}
