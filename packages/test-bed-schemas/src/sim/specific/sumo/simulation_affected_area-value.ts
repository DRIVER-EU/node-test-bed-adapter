export interface IareaPoly {
  type: string;
  coordinates: number[][][][];
}

/** Non-drivable area (sent to SUMO) */
export interface IAffectedArea {
  /** Area ID */
  id: string;
  /** Polygon area of the non-drivable area as GeoJSON MultiPolygon */
  area: IareaPoly;
  /** Begin time of the duration in milliseconds */
  begin: number;
  /** End time of the duration in milliseconds */
  end: number;
  /** whether the traffic lights in the area are out of order */
  trafficLightsBroken: boolean;
  /**
   * Types of the vehicles, which are not allowed in this area (SUMO vehicle types)
   * with the special string 'all' as default
   */
  restriction: string;
}
