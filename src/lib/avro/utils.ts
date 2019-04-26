import { FeatureCollection } from 'geojson';

/**
 * Deep copy function for TypeScript.
 * @param T Generic type of target/copied value.
 * @param target Target value to be copied.
 * @see Source project, ts-deepcopy https://github.com/ykdr2017/ts-deepcopy
 * @see Code pen https://codepen.io/erikvullings/pen/ejyBYg
 */
export const deepCopy = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  if (target instanceof Array) {
    const cp = [] as any[];
    (target as any[]).forEach(v => {
      cp.push(v);
    });
    return cp.map((n: any) => deepCopy<any>(n)) as any;
  }
  if (typeof target === 'object' && target !== {}) {
    const cp = { ...(target as { [key: string]: any }) } as {
      [key: string]: any;
    };
    Object.keys(cp).forEach(k => {
      cp[k] = deepCopy<any>(cp[k]);
    });
    return cp as T;
  }
  return target;
};

/** Returns true if the input is an integer */
export const isInt = (n: number | string | boolean) => Number(n) === n && n % 1 === 0;

/** Returns true if the input is a float */
export const isFloat = (n: number | string | boolean) => Number(n) === n && n % 1 !== 0;

/** Convert a GeoJSON to an AVRO representation */
export const geojsonToAvro = (geojson?: FeatureCollection) => {
  if (!geojson) {
    return;
  }
  const avro = { type: 'FeatureCollection' } as { [key: string]: any };
  if (geojson.bbox) {
    avro.bbox = geojson.bbox.map(b => b);
  }
  if (geojson.features) {
    avro.features = geojson.features.map(f => {
      const avroFeature = {} as { [key: string]: any };
      if (f && f.geometry && Object.keys(f.geometry).length > 1) {
        avroFeature.geometry = {
          [`eu.driver.model.geojson.${f.geometry.type}`]: deepCopy(f.geometry),
        } as { [key: string]: any };
      }
      avroFeature.properties = mapToAvro(f.properties);
      return avroFeature;
    });
  }
  return avro;
};

/** Convert a flat object to an AVRO representation, where all numbers will either be int or double. */
export const mapToAvro = (props: { [key: string]: any } | null) =>
  props && Object.keys(props).length > 0
    ? Object.keys(props).reduce(
        (acc, key) => {
          const val = props[key];
          acc[key] = {} as { [key: string]: any };
          if (typeof val === 'object') {
            acc[key].string = JSON.stringify(val);
          } else if (typeof val === 'number') {
            acc[key][isInt(val) ? 'int' : 'double'] = val;
          } else {
            acc[key][typeof val] = val;
          }
          return acc;
        },
        {} as { [key: string]: any }
      )
    : props;
