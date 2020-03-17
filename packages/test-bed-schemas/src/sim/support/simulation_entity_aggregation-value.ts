/**
 * A location is defined as a WGS84-based standard representation of a location on
 * earth
 */
export interface ILocation {
  /** In decimal degrees, ranging from [-90, 90] where 0 is the equator */
  latitude: number;
  /**
   * In decimal degrees, ranging from (-180, 180] where 0 is the Prime Meridian
   * (line going through the geographic north, Greenwich, and the geographic south)
   */
  longitude: number;
  /**
   * Optional in meters, where 0 is the surface of the WGS84-based ellipsoid, or
   * another agreed upon common ground level (specified inside the configuration
   * guidelines). A positive number indicates a location outside the ellipsoid (or
   * above the ground level), while a negative number indicates a location inside
   * the ellipsoid (or below the ground level). If an altitude is not provided, it
   * is presumed that the location is at the ground level of the provided latitude
   * and longitude coordinates
   */
  altitude?: null | undefined | number;
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

/**
 * A velocity is defined in the aviation axes conventions representation of a
 * velocity vector. It is a left-handed item-centric reference system, with in
 * default initial state its heading/yaw-axis pointing away from the centre of
 * the WGS84-based ellipsoid, its pitch-axis pointing to the right, and its
 * roll/bank-axis pointing forward
 */
export interface IVelocity {
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
   * In meter per seconds, ranging from [0, infinity) where 0 is standing still
   * relative to the earth’s rotation
   */
  magnitude: number;
}

export interface IAggregatedItem {
  /** Optional location of the item */
  location?: null | undefined | ILocation;
  /** Optional orientation of the item */
  orientation?: null | undefined | IOrientation;
  /** Optional velocity of the item */
  velocity?: null | undefined | IVelocity;
  /** Optional name of the item */
  name?: null | undefined | string;
  /** Optional description of the item */
  description?: null | undefined | string;
  /** Optional type of the item */
  type?: null | undefined | string;
  /**
   * Optional unique case-insensitive identifier of the connected application owning
   * the item
   */
  owner?: null | undefined | string;
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was
   * performed
   */
  timestamp?: null | undefined | number;
  /**
   * Optional map containing item specific information: key – unique name of the
   * specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
  /** Optional list of item identifiers that belong to this item */
  children?: null | undefined | string[];
}

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

export interface IAggregatedFeature {
  type: FeatureType;
  /**
   * The geometry (as defined by the GeoJSON standard): Point – a point; MultiPoint
   * – a collection of points; LineString – a collection of points forming a line;
   * MultiLineString – a collection of lines; Polygon – a collection of points
   * forming an area; MultiPolygon – a collection of areas; GeometryCollection – a
   * collection of any of the types above
   */
  geometry?: null | undefined | IPoint | IMultiPoint | ILineString | IMultiLineString | IPolygon | IMultiPolygon;
  /**
   * Optional feature specific properties (as defined by the GeoJSON standard)
   */
  properties?: null | undefined | IProperties;
  /** Optional orientation of the feature */
  orientation?: null | undefined | IOrientation;
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

export interface IAggregatedFeatureCollection {
  type: FeatureCollectionType;
  features?: null | undefined | IAggregatedFeature[];
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

export interface IAggregatedHeader {
  /** Sender of the post */
  from?: null | undefined | string;
  /**
   * UNIX Epoch time in milliseconds marking the time the post was published/updated
   */
  date?: null | undefined | number;
  /** Optional list of recipients of the post */
  to?: null | undefined | string[];
  /** Optional list of recipients in carbon copy of the post */
  cc?: null | undefined | string[];
  /** Optional list of recipients in blind carbon copy of the post */
  bcc?: null | undefined | string[];
  /** Optional subject of the post */
  subject?: null | undefined | string;
  /** Optional introductory text of the post */
  intro?: null | undefined | string;
  /**
   * Optional map of (references to) attachments inside the post: key – unique
   * reference to the attachment (e.g. URI) or complete string-encoded attachment;
   * value – media type of the attachment (e.g. .pdf, .png, .zip)
   */
  attachments?: null | undefined | { [key: string]: string };
  /** Optional location of the sender of the post */
  location?: null | undefined | ILocation;
}

export interface IAggregatedPost {
  /** Body text of the post */
  body?: null | undefined | string;
  /** Optional header information of the post */
  header?: null | undefined | IAggregatedHeader;
  /** Optional name of the post */
  name?: null | undefined | string;
  /** Optional type of the post */
  type?: null | undefined | string;
  /**
   * Optional unique case-insensitive identifier of the connected application owning
   * the post
   */
  owner?: null | undefined | string;
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the update was
   * performed
   */
  timestamp?: null | undefined | number;
  /**
   * Optional map containing post specific information: key – unique name of the
   * specific property; value – value of that property
   */
  tags?: null | undefined | { [key: string]: string };
}

/**
 * The entity aggregation message is a wrapper message containing a map with all
 * entities that require an aggregated update. The values of this map would be
 * the defined entity messages, with all described properties to be optional
 * allowing the message to only contain the relevant changed properties.
 * *Copyright (C) 2019-2020 XVR Simulation B.V., Delft, The Netherlands, Martijn
 * Hendriks <hendriks @ xvrsim.com>. This file is licensed under the MIT license
 * : https://github.com/DRIVER-EU/avro-schemas/blob/master/LICENSE*
 */
export interface IEntityAggregation {
  /** Unique case-insensitive identifier of the aggregation update */
  id: string;
  /**
   * Map containing key-value pairs, all with unique keys: key – unique
   * case-insensitive identifier of the entity; value – entity message where all
   * properties are optional
   */
  map: { [key: string]: IAggregatedItem | IAggregatedFeatureCollection | IAggregatedPost };
  /**
   * Optional UNIX Epoch time in milliseconds marking the time the aggregated update
   * was performed
   */
  timestamp?: null | undefined | number;
}
