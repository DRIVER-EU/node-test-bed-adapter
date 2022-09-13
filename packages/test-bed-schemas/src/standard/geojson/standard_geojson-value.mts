export enum FeatureCollectionType {
  FeatureCollection = 'FeatureCollection'
}

export enum FeatureType {
  Feature = 'Feature'
}

export enum PointType {
  Point = 'Point'
}

/** Describes a point geometry */
export interface IPoint {
  type: PointType;
  coordinates: number[];
}

export enum MultiPointType {
  MultiPoint = 'MultiPoint'
}

/** Describes a collection of points geometry */
export interface IMultiPoint {
  type: MultiPointType;
  coordinates: number[][];
}

export enum LineStringType {
  LineString = 'LineString'
}

/** Describes a LineString geometry */
export interface ILineString {
  type: LineStringType;
  coordinates: number[][];
}

export enum MultiLineStringType {
  MultiLineString = 'MultiLineString'
}

/** Describes a MultiLineString geometry */
export interface IMultiLineString {
  type: MultiLineStringType;
  coordinates: number[][][];
}

export enum PolygonType {
  Polygon = 'Polygon'
}

/** Describes a Polygon geometry */
export interface IPolygon {
  type: PolygonType;
  coordinates: number[][][];
}

export enum MultiPolygonType {
  MultiPolygon = 'MultiPolygon'
}

/** Describes a MultiPolygon geometry */
export interface IMultiPolygon {
  type: MultiPolygonType;
  coordinates: number[][][][];
}

/** A GeoJSON Feature object */
export interface IFeature {
  type: FeatureType;
  bbox?: null | undefined | number[];
  geometry: IPoint | IMultiPoint | ILineString | IMultiLineString | IPolygon | IMultiPolygon;
  /**
   * Any type, without infinite nesting, should be replaced during actual usage with
   * a record with named properties.
   */
  properties: { [key: string]: null | undefined | boolean | string | number | Array<null | undefined | boolean | string | number> | { [key: string]: null | undefined | boolean | string | number } };
}

/**
 * A GeoJSON FeatureCollection object. As the properties are generic, it should be
 * replaced by a record with named properties.
 */
export interface IFeatureCollection {
  type: FeatureCollectionType;
  bbox?: null | undefined | number[];
  features?: null | undefined | IFeature[];
}
