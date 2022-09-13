export enum DataType {
  msword = 'msword',
  ogg = 'ogg',
  pdf = 'pdf',
  excel = 'excel',
  powerpoint = 'powerpoint',
  zip = 'zip',
  audio_mpeg = 'audio_mpeg',
  audio_vorbis = 'audio_vorbis',
  image_bmp = 'image_bmp',
  image_gif = 'image_gif',
  image_geotiff = 'image_geotiff',
  image_jpeg = 'image_jpeg',
  image_png = 'image_png',
  json = 'json',
  geojson = 'geojson',
  text_plain = 'text_plain',
  video_mpeg = 'video_mpeg',
  video_msvideo = 'video_msvideo',
  video_avi = 'video_avi',
  netcdf = 'netcdf',
  wms = 'wms',
  wfs = 'wfs',
  other = 'other'
}

/**
 * Message for indicating large data files updated and uploaded to a central server
 */
export interface ILargeDataUpdate {
  /** Link of where to download the data file from */
  url: string;
  /** Optional title of the data file, e.g. to serve it via WMS or otherwise */
  title?: null | undefined | string;
  /** Optional description of the file */
  description?: null | undefined | string;
  /** The type of data that is sent */
  dataType: DataType;
}
