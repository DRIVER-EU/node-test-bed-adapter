import * as path from 'path';
import { FeatureCollection } from 'geojson';
import {
  TestBedAdapter,
  Logger,
  LogLevel,
  ProduceRequest,
  largeFileUploadCallback,
} from '../lib';
import { geojsonToAvro, TimeTopic } from '../lib/avro';
import { DataType, TimeState, ITimeManagement } from 'test-bed-schemas';
import * as amberAlert from '../data/cap/examples/example_amber_alert.json';
import * as earthquakeAlert from '../data/cap/examples/example_earthquake.json';
import * as thunderstormAlert from '../data/cap/examples/example_thunderstorm.json';
import * as homelandSecurityAlert from '../data/cap/examples/example_homeland_security.json';
import * as crowdTaskerMsg from '../data/geojson/crowdtasker.json';

const log = Logger.instance;

class Producer {
  private id = '3di';
  private adapter: TestBedAdapter;

  constructor() {
    this.adapter = new TestBedAdapter({
      kafkaHost: process.env.KAFKA_HOST || 'tb6.driver-testbed.eu:3561',
      schemaRegistry:
        process.env.SCHEMA_REGISTRY || 'tb6.driver-testbed.eu:3562',
      // kafkaHost: 'localhost:3501',
      // schemaRegistry: 'localhost:3502',
      // largeFileService: 'localhost:9090',
      // sslOptions: {
      //   pfx: fs.readFileSync('certs/other-tool-1-client.p12'),
      //   passphrase: 'changeit',
      //   ca: fs.readFileSync('certs/test-ca.pem'),
      //   rejectUnauthorized: true,
      // },
      // kafkaHost: 'driver-testbed.eu:3501',
      // schemaRegistry: 'driver-testbed.eu:3502',
      clientId: this.id,
      fetchAllSchemas: false,
      fetchAllVersions: false,
      // autoRegisterSchemas: true,
      autoRegisterSchemas: false,
      wrapUnions: 'auto',
      schemaFolder: `${__dirname}/../../src/data/schemas`,
      produce: ['photo_geojson', 'standard_cap', 'standard_geojson', TimeTopic],
      logging: {
        logToConsole: LogLevel.Info,
        logToKafka: LogLevel.Warn,
      },
    });
    this.adapter.on('error', e => console.error(e));
    this.adapter.on('ready', () => {
      log.info(`Current simulation time: ${this.adapter.trialTime}`);
      log.info('Producer is connected');
      this.sendPhotoGeoJSON();
      // this.sendGeoJSON();
      // this.sendTime();
      // this.uploadFile();
      // this.sendCap();
    });
    this.adapter.connect();
  }

  private sendPhotoGeoJSON() {
    const geojson = geojsonToAvro((photoEx as unknown) as FeatureCollection);
    const payloads: ProduceRequest[] = [
      {
        topic: 'photo_geojson',
        messages: geojson,
        attributes: 1, // Gzip
      },
    ];
    this.adapter.send(payloads, (error, data) => {
      if (error) {
        log.error(error.message + '\n' + error.stack);
      }
      if (data) {
        log.info(data);
      }
    });
  }

  private sendGeoJSON() {
    const geojson = geojsonToAvro(
      (crowdTaskerMsg as unknown) as FeatureCollection
    );
    const payloads: ProduceRequest[] = [
      {
        topic: 'standard_geojson',
        messages: geojson,
        attributes: 1, // Gzip
      },
    ];
    this.adapter.send(payloads, (error, data) => {
      if (error) {
        log.error(error);
      }
      if (data) {
        log.info(data);
      }
    });
  }

  private uploadFile() {
    const file = path.resolve(
      process.cwd(),
      './dist/data/cap/examples/example_amber_alert.json'
    );
    const cb = largeFileUploadCallback(
      this.adapter,
      'Amber alert message',
      'This is a test message',
      DataType.json
    );
    this.adapter.uploadFile(file, false, cb);
  }

  private sendTime() {
    const d = new Date().valueOf();
    const time = {
      updatedAt: d,
      timeElapsed: 0,
      trialTimeSpeed: 1,
      trialTime: d,
      state: TimeState.Initialization,
    } as ITimeManagement;
    const pr = {
      messages: time,
      topic: TimeTopic,
      attributes: 1,
    } as ProduceRequest;
    this.adapter.send(pr, (err, data) => {
      if (err) {
        console.error(err);
      } else {
        console.info(data);
      }
    });
  }

  /** Will currently only work if you are authorized to send CAP messages. */
  private sendCap() {
    const payloads: ProduceRequest[] = [
      {
        topic: 'standard_cap',
        messages: amberAlert,
        attributes: 1, // Gzip
      },
      {
        topic: 'standard_cap',
        messages: earthquakeAlert,
        attributes: 1, // Gzip
      },
      {
        topic: 'standard_cap',
        messages: thunderstormAlert,
        attributes: 1, // Gzip
      },
      {
        topic: 'standard_cap',
        messages: homelandSecurityAlert,
        attributes: 1, // Gzip
      },
    ];
    this.adapter.send(payloads, (error, data) => {
      if (error) {
        log.error(error);
      }
      if (data) {
        log.info(data);
      }
    });
  }
}

new Producer();

const photoEx = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        id: 26631,
        priority: 0,
        viewed: true,
        signature: 'deab139ab5e85288c2be3e16fc2d4669',
        instant: '2019-04-23 16:44:30.565',
        created: '2019-04-23 16:44:36.222',
        updated: '2019-04-24 06:43:30.581693',
        caption: 'FOV',
        interpretation: null,
        meta: {
          Source: {
            filename: 'android.jpg',
            camera_make: 'HUAWEI',
            width: 2736,
            size: 3200408,
            height: 2736,
            direction: 334,
            camera_model: 'CLT-L29',
            field_of_view: 67.4,
          },
        },
        version: null,
        application_id: null,
        seen: '2019-04-23 16:45:53',
        started: null,
        stopped: null,
        location_latitude: 60.251270435954,
        location_longitude: 11.201747810335,
        location_time: '2019-04-23 16:44:30.565',
        location_accuracy: 4,
        location_altitude: 143,
        location_provider: 'gps',
        location_speed: null,
        location_meta: null,
        mission_id: 180,
        mission_name: 'Fornebuuuu',
        thumbnail_hash: '13e91c9e539c726762941d1f5335b33e',
        preview_hash: '79b2e2ca33854be76f08441ff7b90ff1',
        category_id: null,
        category_name: null,
        application_device_type: null,
        application_last_login: null,
        application_phone: null,
        application_last_rate: null,
        application_updated: null,
        application_created: null,
        application_application_type: null,
        application_connection_type: null,
        application_connection_state: null,
        user_name: 'Magnus Android',
        user_id: 47,
        user_username: 'magnusandroid',
        user_color: 'EB0606',
        user_connection_type: 0,
        user_last_login: '2019-04-24 06:49:38.251',
        user_last_rate: 376440,
        observation_url: 'https://thor.ansur.no/signs/processing/26631',
        observation_type: 'photo',
        preview_url:
          'https://thor.ansur.no/display/file/79b2e2ca33854be76f08441ff7b90ff1/magnusandroid/deab139ab5e85288c2be3e16fc2d4669/preview41466.jpg',
        preview_with_overlay_url:
          'https://thor.ansur.no/display/displayWithOverlays/79b2e2ca33854be76f08441ff7b90ff1/magnusandroid/deab139ab5e85288c2be3e16fc2d4669/preview41466.jpg',
        thumbnail_url:
          'https://thor.ansur.no/display/file/13e91c9e539c726762941d1f5335b33e/magnusandroid/deab139ab5e85288c2be3e16fc2d4669/thumb.jpg',
      },
      geometry: {
        type: 'Point',
        coordinates: [11.201747810335, 60.251270435954],
      },
    },
  ],
};
