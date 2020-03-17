import { IOrientation } from './simulation_entity_item-value';

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
  large = 'large',
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
