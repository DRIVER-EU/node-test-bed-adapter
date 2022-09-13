/**
 * Type of the feature collection (as defined by the GeoJSON standard):
 * FeatureCollection – a collection of multiple GeoJSON features; Feature– a
 * single GeoJSON feature (not used within this CWA); Geometry – a single
 * geometric GeoJSON object (not used within this CWA). In this CWA only the
 * FeatureCollection option is used for easier processing
 */
export enum FeatureCollectionType {
  FeatureCollection = 'FeatureCollection'
}

/**
 * Type of the feature (as defined by the GeoJSON standard): Feature – a single
 * GeoJSON feature
 */
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

/** Describes a collection of points forming a line geometry */
export interface ILineString {
  type: LineStringType;
  coordinates: number[][];
}

export enum MultiLineStringType {
  MultiLineString = 'MultiLineString'
}

/** Describes a collection of lines geometry */
export interface IMultiLineString {
  type: MultiLineStringType;
  coordinates: number[][][];
}

export enum PolygonType {
  Polygon = 'Polygon'
}

/** Describes a collection of points forming an area geometry */
export interface IPolygon {
  type: PolygonType;
  coordinates: number[][];
}

export enum MultiPolygonType {
  MultiPolygon = 'MultiPolygon'
}

/** Describes a collection of areas geometry */
export interface IMultiPolygon {
  type: MultiPolygonType;
  coordinates: number[][][];
}

/**
 * An orientation is defined in the aviation axes conventions representation. It
 * is a left-handed item-centric reference system, with in default initial state
 * its heading/yaw-axis pointing away from the centre of the WGS84-based
 * ellipsoid, its pitch-axis pointing to the right, and its roll/bank-axis
 * pointing forward
 */
export interface IOrientation {
  /**
   * In decimal degrees, ranging from [0, 360) where 0 is pointing towards the
   * geographic north. The yaw value is applied in a clockwise rotation over the
   * item’s heading/yaw-axis. A yaw value of 90 makes the item face east, while a
   * yaw of 270 makes it face west
   */
  yaw: number;
  /**
   * In decimal degrees, ranging from [-90, 90] where 0 is perpendicular to the line
   * crossing the item’s location and the centre of the WGS84-based ellipsoid. The
   * pitch value is applied in a counter-clockwise rotation over the item’s
   * pitch-axis. A pitch value of 45 makes the item face 45 degrees upwards, while
   * a pitch of -20 makes it face 20 degrees downwards
   */
  pitch: number;
  /**
   * In decimal degrees, ranging from (-180, 180] where 0 is perpendicular to the
   * line crossing the item’s location and the centre of the WGS84-based ellipsoid.
   * The roll value is applied in a clockwise rotation over the item’s
   * roll/bank-axis. A roll value of 45 makes the item roll 45 degrees to the
   * right, while a roll of -50 makes it roll 50 degrees to the left
   */
  roll: number;
}

export interface IAddress {
  /** Optional street name */
  street?: null | undefined | string;
  /** Optional house number */
  houseNumber?: null | undefined | number;
  /** Optional house letter */
  houseLetter?: null | undefined | string;
  /** Optional postal code */
  postalCode?: null | undefined | string;
  /** Optional name of the city */
  city?: null | undefined | string;
  /** Optional name of the state or province */
  state?: null | undefined | string;
  /** Optional name of the country */
  country?: null | undefined | string;
  /**
   * Optional map containing address specific information: key – unique name of the
   * specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
}

/**
 * small – small marker size; medium – medium marker size; large – large marker
 * size
 */
export enum MarkerSize {
  small = 'small',
  medium = 'medium',
  large = 'large'
}

export interface IProperties {
  /** Unique case-insensitive identifier of the feature */
  id: string;
  /** Optional name of the feature */
  name?: null | undefined | string;
  /** Optional description of the feature */
  description?: null | undefined | string;
  /** Optional type of the feature */
  type?: null | undefined | string;
  /**
   * Optional map containing feature specific information: key – unique name of the
   * specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
  /** Optional orientation of the feature */
  orientation?: null | undefined | IOrientation;
  /** Optional list of entity identifiers that are at this feature */
  entities?: null | undefined | string[];
  /** Optional address information of the feature */
  address?: null | undefined | IAddress;
  /**
   * Optional title of the feature (as defined by the simplestyle specification)
   */
  title?: null | undefined | string;
  /**
   * Optional size of the style marker (as defined by the simplestyle specification)
   */
  markerSize?: null | undefined | MarkerSize;
  /**
   * Optional symbol to display in the center of the style marker (as defined by the
   * simplestyle specification). Allowed values include an Icon ID, an integer 0
   * through 9, a lowercase character a through z
   */
  markerSymbol?: null | undefined | string;
  /**
   * Optional color of the style marker (as defined by the simplestyle
   * specification). This value should be a string-encoded hexadecimal value for
   * the red, green and blue intensity of the desired color (in that order)
   */
  markerColor?: null | undefined | string;
  /**
   * Optional color of a line as part of a GeoJSON geometry (as defined by the
   * simplestyle specification). This value should be a string-encoded hexadecimal
   * value for the red, green and blue intensity of the desired color (in that
   * order)
   */
  stroke?: null | undefined | string;
  /**
   * Optional opacity of the line as part of a GeoJSON geometry (as defined by the
   * simplestyle specification), ranging from [0, 1]
   */
  strokeOpacity?: null | undefined | number;
  /**
   * The width of the line as part of a GeoJSON geometry (as defined by the
   * simplestyle specification), ranging from [0, infinity)
   */
  strokeWidth?: null | undefined | number;
  /**
   * Optional color of the GeoJSON geometry (as defined by the simplestyle
   * specification). This value should be a string-encoded hexadecimal value for
   * the red, green and blue intensity of the desired color (in that order)
   */
  fill?: null | undefined | string;
  /**
   * Optional opacity of the GeoJSON geometry (as defined by the simplestyle
   * specification), ranging from [0, 1]
   */
  fillOpacity?: null | undefined | number;
}

/** A GeoJSON Feature object */
export interface IFeature {
  type: FeatureType;
  /**
   * The geometry (as defined by the GeoJSON standard): Point – a point; MultiPoint
   * – a collection of points; LineString – a collection of points forming a line;
   * MultiLineString – a collection of lines; Polygon – a collection of points
   * forming an area; MultiPolygon – a collection of areas; GeometryCollection – a
   * collection of any of the types above
   */
  geometry: IPoint | IMultiPoint | ILineString | IMultiLineString | IPolygon | IMultiPolygon;
  /**
   * Optional feature specific properties (as defined by the GeoJSON standard)
   */
  properties?: null | undefined | IProperties;
  /**
   * Optional bounding box around the feature in the following order [west, south,
   * east, north]. Length(bbox)=2xn, where n is the number of dimensions
   * represented in the contained geometry, with all axes of the most
   * south-westerly point followed by all axes of the more north-easterly point.
   * The axes order of a bbox follows the axes order of the geometry. The bbox
   * values define shapes with edges that follow lines of constant longitude,
   * latitude, and elevation
   */
  bbox?: null | undefined | number[];
}

/**
 * A feature collection represents one or more points, lines, or areas of interest
 * to the common simulation space. For example, specific places or buildings,
 * routes, borders, flooded areas or disaster zones. A well-known standard for
 * sharing a collection of geographic features is GeoJSON, created by the
 * Internet Engineering Task Force (IETF), RFC 7946. Each feature can be a point,
 * multi-point, line, multi-line, polyline, polygon, or multi-polygon (with or
 * without holes). In addition, every feature has a map of arbitrary properties
 * for other standards or specifications to include relevant information per
 * feature. Similar to the simplestyle specification, this CWA defines a list of
 * common feature properties for structuring additional information about its
 * context on top of the GeoJSON standard, making it easier to share simulation
 * relevant data. *Copyright (C) 2019-2020 XVR Simulation B.V., Delft, The
 * Netherlands, Martijn Hendriks <hendriks @ xvrsim.com>. This file is licensed
 * under the MIT license :
 * https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IFeatureCollection {
  /** Unique case-insensitive identifier of the feature collection */
  id: string;
  type: FeatureCollectionType;
  features?: null | undefined | IFeature[];
  /** Optional name of the feature collection */
  name?: null | undefined | string;
  /** Optional description of the feature collection */
  description?: null | undefined | string;
  /**
   * Optional unique case-insensitive identifier of the connected application owning
   * the feature collection
   */
  owner?: null | undefined | string;
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was
   * performed
   */
  timestamp?: null | undefined | number;
  /**
   * Optional map containing feature collection specific information: key – unique
   * name of the specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
  /**
   * Optional bounding box around the feature collection in the following order
   * [west, south, east, north]. Length(bbox)=2xn, where n is the number of
   * dimensions represented in the contained geometries, with all axes of the most
   * south-westerly point followed by all axes of the more north-easterly point.
   * The axes order of a bbox follows the axes order of the geometries. The bbox
   * values define shapes with edges that follow lines of constant longitude,
   * latitude, and elevation
   */
  bbox?: null | undefined | number[];
}
