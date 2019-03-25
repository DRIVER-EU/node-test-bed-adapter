export enum UpdateType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

export enum LayerType {
  WMS = 'WMS',
  WMTS = 'WMTS',
  WCS = 'WCS',
  WFS = 'WFS',
  OTHER = 'OTHER'
}

/** Message for indicating a new or updated map layer */
export interface IMapLayerUpdate {
  /** Link to the layer */
  url: string;
  /** Optional title of the data file, e.g. to serve it via WMS or otherwise */
  title?: null | undefined | string;
  /** Optional description of the file */
  description?: null | undefined | string;
  /** Optional username when security is enabled */
  username?: null | undefined | string;
  /** Optional password when security is enabled */
  password?: null | undefined | string;
  /** Create, update, delete */
  updateType: UpdateType;
  /** The type of layer that is offered */
  layerType: LayerType;
}
