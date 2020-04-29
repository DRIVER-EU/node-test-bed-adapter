import { IFeatureCollection } from '../..';

/**
 * An envelope containing a GeoJSON FeatureCollection object, with a unique id and
 * a title.
 */
export interface IGeoJSONEnvelope {
  /** Metadata for the FeatureCollection in the geojson field. */
  properties?:
    | null
    | undefined
    | { [key: string]: null | undefined | boolean | string | number };
  geojson: IFeatureCollection;
}
