import * as path from 'path';
import {
  TestBedAdapter,
  AdapterLogger,
  LogLevel,
  ILargeDataUpdate,
  TimeState,
  ITimeManagement,
  DataType,
  TimeTopic,
  LargeDataUpdateTopic,
  RequestChangeOfTrialStage,
  AdapterProducerRecord,
  RecordMetadata,
} from 'node-test-bed-adapter';
import amberAlert from './data/example_amber_alert.json' assert { type: 'json' };
import earthquakeAlert from './data/example_earthquake.json' assert { type: 'json' };
import thunderstormAlert from './data/example_thunderstorm.json' assert { type: 'json' };
import homelandSecurityAlert from './data/example_homeland_security.json' assert { type: 'json' };
// import * as crowdTaskerMsg from '../data/geojson/crowdtasker.json';

const log = AdapterLogger.instance;

class Producer {
  private id = 'tno-producer';
  private adapter: TestBedAdapter;

  constructor() {
    const hasLargeFileService = false;
    this.adapter = new TestBedAdapter({
      kafkaHost: process.env.KAFKA_HOST || 'localhost:9092',
      schemaRegistry: process.env.SCHEMA_REGISTRY || 'localhost:3502',
      // kafkaHost: process.env.KAFKA_HOST || 'strategy.satways.net:3501',
      // schemaRegistry:
      //   process.env.SCHEMA_REGISTRY || 'strategy.satways.net:3502',
      largeFileService: hasLargeFileService
        ? 'strategy.satways.net:9090'
        : undefined,
      // sslOptions: {
      //   pfx: fs.readFileSync('../certs/other-tool-1-client.p12'),
      //   passphrase: 'changeit',
      //   ca: fs.readFileSync('../certs/test-ca.pem'),
      //   rejectUnauthorized: true,
      // },
      groupId: this.id,
      fetchAllSchemas: false,
      fetchAllVersions: false,
      autoRegisterSchemas: false,
      wrapUnions: 'auto',
      stringBasedKey: true,
      schemaFolder: process.env.SCHEMA_FOLDER || `${process.cwd()}/src/schemas`,
      produce: [
        'standard_cap',
        'standard_geojson',
        RequestChangeOfTrialStage,
        TimeTopic,
      ],
      logging: {
        logToConsole: LogLevel.Info,
        logToKafka: LogLevel.Warn,
      },
    });
    this.adapter.on('error', (e) => console.error(e));
    this.adapter.on('ready', () => {
      log.info(`Current simulation time: ${this.adapter.simulationTime}`);
      log.info('Producer is connected');
      this.sendStageChangeRequest();
      this.sendCap();
      // this.sendGeoJSON();
      this.sendTime();
      // if (hasLargeFileService) {
      //   this.uploadFile();
      // }
    });
    this.adapter.connect();
  }

  private sendStageChangeRequest() {
    const payloads: AdapterProducerRecord = {
      topic: 'system_request_change_of_trial_stage',
      messages: [
        {
          value: {
            // ostTrialId: 1,
            ostTrialSessionId: 1,
            ostTrialStageId: 1,
          },
        },
      ],
    };
    this.adapter.send(payloads, (error, data) => {
      if (error) {
        log.error(error);
      }
      if (data) {
        log.info(data);
      }
    });
  }

  // private sendGeoJSON() {
  //   const geojson = geojsonToAvro(
  //     (crowdTaskerMsg as unknown) as IFeatureCollection
  //   );
  //   const payloads: AdapterProducerRecord[] = [
  //     {
  //       topic: 'standard_geojson',
  //       messages: geojson,
  //       attributes: 1, // Gzip
  //     },
  //   ];
  //   this.adapter.send(payloads, (error, data) => {
  //     if (error) {
  //       log.error(error);
  //     }
  //     if (data) {
  //       log.info(data);
  //     }
  //   });
  // }

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
      messages: [{ value: time }],
      topic: TimeTopic,
    } as AdapterProducerRecord;
    this.adapter.send(pr, (err, data) => {
      if (err) {
        console.error(err);
      } else {
        console.info(data);
      }
    });
  }

  /** Will only work if you are authorized to send CAP messages. */
  private sendCap() {
    const payloads: AdapterProducerRecord = {
      topic: 'standard_cap',
      messages: [
        { value: amberAlert, key: 'EV' },
        { value: earthquakeAlert, key: 'EV' },
        { value: thunderstormAlert, key: 'EV' },
        { value: homelandSecurityAlert, key: 'EV' },
      ],
    };
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

/**
 * Helper function to create a callback that automatically sends a large file upload message
 * to the Test-bed's LargeDataUpdateTopic (system_large_data_update). This callback can be
 * passed to the uploadFile function of the adapter.
 *
 * @param adapter test bed adapter, needed to send the message
 * @param title title of the large file upload message
 * @param description description of the large file upload message
 * @param dataType data type of the message
 * @param callback to return the result of the large file upload (default logs errors)
 */
export const largeFileUploadCallback = (
  adapter: TestBedAdapter,
  title?: string,
  description?: string,
  dataType = DataType.other,
  cb: (err: any, data?: RecordMetadata[]) => void = (err) =>
    err ? AdapterLogger.instance.error(err) : undefined
) => {
  return (err?: Error, url?: string) => {
    if (err) {
      return cb(err);
    }
    const msg = {
      url,
      title,
      description,
      dataType,
    } as ILargeDataUpdate;
    const payload: AdapterProducerRecord = {
      topic: LargeDataUpdateTopic,
      messages: [{ value: msg, key: 'EV' }],
    };
    adapter.send(payload, cb);
  };
};

new Producer();
