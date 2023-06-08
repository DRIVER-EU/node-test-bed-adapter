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

const config = {
  languages: ['en'],
  updated: 1680434259254,
  translations: [
    {
      from: 'en',
      to: 'nl',
    },
  ],
  sources: [
    {
      name: 'manual',
      url: '',
      id: 'manualSource',
      feeds: [
        {
          name: 'manual feed',
          id: 'manualFeed',
          language: '',
          refresh: '',
          sourceId: 'manualSource',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
    {
      name: 'EMM',
      url: '',
      id: 'source-d00f8a9a-7e45-bda7-07da-3017464f4413',
      feeds: [
        {
          name: 'Top stories NL',
          id: 'feed-3cd97794-e210-6ab9-bd68-63e1e423080b',
          language: '',
          refresh: '*/10 * * * *',
          sourceId: 'source-d00f8a9a-7e45-bda7-07da-3017464f4413',
          type: 'RSS',
          url: ' qhttps://emm.newsbrief.eu/rss/rss?type=category&language=en&duplicates=false&id=Netherlands',
          options: {},
        },
        {
          name: 'EMM Russia',
          id: 'feed-55880785-707a-ecb8-e6dc-23fac74118b1',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-d00f8a9a-7e45-bda7-07da-3017464f4413',
          type: 'RSS',
          url: 'https://emm.newsbrief.eu/rss/rss?type=category&language=en&duplicates=false&id=Russia',
          options: {},
        },
        {
          name: 'EMM Netherlands',
          id: 'feed-a967d972',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-d00f8a9a-7e45-bda7-07da-3017464f4413',
          type: 'RSS',
          url: 'https://emm.newsbrief.eu/rss/rss?type=category&language=en&duplicates=false&id=Netherlands',
          options: {},
        },
        {
          name: 'EMM 24',
          id: 'feed-3d6080ed-db77-5a8b-b83c-ff25de79e94c',
          language: '',
          refresh: '*/10 * * * *',
          sourceId: 'source-d00f8a9a-7e45-bda7-07da-3017464f4413',
          type: 'RSS',
          url: 'https://emm.newsbrief.eu/rss/rss?type=24hrs&language=en&duplicates=false',
          options: {},
        },
        {
          name: 'EMM Stories',
          id: 'feed-a48164f2-e513-f71e-ccf7-97e645a66d1a',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-d00f8a9a-7e45-bda7-07da-3017464f4413',
          type: 'RSS',
          url: 'http://emm.newsbrief.eu/rss/rss?type=story&id=dailymail-13e63c288d60cc497a6e7d0a3ce1fa6e.20220617.en&duplicates=false',
          options: {},
        },
      ],
    },
    {
      name: 'TASS',
      url: '',
      id: 'source-f57dd056-2116-ae10-2599-75c8e2742fcb',
      feeds: [
        {
          name: 'TASS Feed',
          id: 'feed-ed11d275-8e76-a517-ff32-f7b44e36881a',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-f57dd056-2116-ae10-2599-75c8e2742fcb',
          type: 'RSS',
          url: 'http://tass.com/rss/v2.xml',
          options: {},
        },
        {
          name: 'Russia',
          id: 'country-73eee79e-8641-d5e6-8d04-2da4ce47322a',
          language: '',
          refresh: '',
          sourceId: 'source-f57dd056-2116-ae10-2599-75c8e2742fcb',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
    {
      name: 'Lithuania',
      url: '',
      id: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
      feeds: [
        {
          name: 'Delfi',
          id: 'feed-66d86241-1554-b2d2-3a47-b9612c5da1ad',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: 'https://www.delfi.lt/rss/feeds/daily.xml',
          options: {},
        },
        {
          name: 'Lrytas',
          id: 'feed-e418feb5-82e9-d5e5-2623-ebe443560dbc',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: 'https://www.lrytas.lt/rss',
          options: {},
        },
        {
          name: 'Sarmatas',
          id: 'feed-be68e9e9-723c-75f7-005c-3899eb2dcd98',
          language: '',
          refresh: '*/10 * * * *',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: 'https://www.sarmatas.lt/rss',
          options: {},
        },
        {
          name: 'voruta.lt',
          id: 'feed-a38aef52',
          language: '',
          refresh: '',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'lt.rubaltic.ru',
          id: 'feed-7c156c2c',
          language: '',
          refresh: '',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'laisvaslaikrastis.lt',
          id: 'feed-f574c719',
          language: '',
          refresh: '',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'tiesos.lt',
          id: 'feed-b33890b0',
          language: '',
          refresh: '',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'alkas.lt',
          id: 'feed-9cda6111',
          language: '',
          refresh: '',
          sourceId: 'source-1d9e7e56-cd9e-675f-456b-23af3fc0efeb',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
    {
      name: 'New York Times',
      url: '',
      id: 'source-4d0c1c9a-4101-9801-e269-ae87fe399e45',
      feeds: [
        {
          name: 'New York Times Europe',
          id: 'feed-c1d0b5e4-af87-8895-6892-6e0c6be3f41a',
          language: '',
          refresh: '*/10 * * * *',
          sourceId: 'source-4d0c1c9a-4101-9801-e269-ae87fe399e45',
          type: 'RSS',
          url: 'https://rss.nytimes.com/services/xml/rss/nyt/Europe.xml',
          options: {},
        },
        {
          name: 'New York Times World',
          id: 'feed-24b6e892',
          language: '',
          refresh: '*/10 * * * *',
          sourceId: 'source-4d0c1c9a-4101-9801-e269-ae87fe399e45',
          type: 'RSS',
          url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
          options: {},
        },
        {
          name: 'United States of America',
          id: 'Q30',
          language: '',
          refresh: '',
          sourceId: 'source-4d0c1c9a-4101-9801-e269-ae87fe399e45',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
    {
      name: 'Google Search',
      url: '',
      id: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
      feeds: [
        {
          name: 'Google Search Finland',
          id: 'feed-239ed5e9-6c65-50cb-8409-3a268dd46c94',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/search?q=finland&hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google Search Food Shortages',
          id: 'feed-7f6babc6',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/search?q=hunger&hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google Search Belarus',
          id: 'feed-51a0c031-d93d-3b12-f350-bc92d6dd1f4e',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/search?q=belarus&hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google Search Lithuania',
          id: 'feed-fb624698',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/search?q=lithuania&hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google Search Russia',
          id: 'feed-be0e1bca',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/search?q=russia&hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google News - European Union',
          id: 'feed-1c8ffd40',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/topics/CAAqBwgKMNzD8wow49fTAg?hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google News - NATO',
          id: 'feed-0da84e11',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFU1Wkc0U0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google News - Military Tactics',
          id: 'feed-136d89b5',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR2RyTm00U0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google News World',
          id: 'feed-585974c6',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google News Ukraine',
          id: 'feed-89cb2033',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/search?q=ukraine&hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
        {
          name: 'Google Search Energy Prices',
          id: 'feed-3c532d74',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-758da275-80ad-349b-7b66-9367dbe7b2f2',
          type: 'RSS',
          url: 'https://news.google.com/rss/search?q=energy%20prices&hl=en-US&gl=US&ceid=US%3Aen',
          options: {},
        },
      ],
    },
    {
      name: 'Volkskrant',
      url: '',
      id: 'source-cd710bf9-485d-fca5-7086-a3aee6a9f767',
      feeds: [
        {
          name: 'Volkskrant - economie',
          id: 'feed-dff3716a-64eb-0b2a-5c60-adfd5ecfab5c',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-cd710bf9-485d-fca5-7086-a3aee6a9f767',
          type: 'RSS',
          url: 'https://www.volkskrant.nl/economie/rss.xml',
          options: {},
        },
        {
          name: 'Netherlands',
          id: 'Q55',
          language: '',
          refresh: '',
          sourceId: 'source-cd710bf9-485d-fca5-7086-a3aee6a9f767',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
    {
      name: 'NU.nl',
      url: '',
      id: 'source-d815656f-c31d-c365-f86e-ee8e88b74e07',
      feeds: [
        {
          name: 'NU.nl Algemeen',
          id: 'feed-e58b6b81-6b32-79cf-a31a-1990673bced1',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-d815656f-c31d-c365-f86e-ee8e88b74e07',
          type: 'RSS',
          url: 'https://www.nu.nl/rss/Algemeen',
          options: {},
        },
        {
          name: 'NU.nl Economie',
          id: 'feed-af681c50',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-d815656f-c31d-c365-f86e-ee8e88b74e07',
          type: 'RSS',
          url: 'https://www.nu.nl/rss/Economie',
          options: {},
        },
        {
          name: 'Netherlands',
          id: 'Q55',
          language: '',
          refresh: '',
          sourceId: 'source-d815656f-c31d-c365-f86e-ee8e88b74e07',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
    {
      name: 'BBC',
      url: '',
      id: 'source-3943f198-d6e5-4cce-8be3-06ee0d2e86b6',
      feeds: [
        {
          name: 'BBC News',
          id: 'feed-d500dd8d-91ed-4e74-5968-91e47026c6ec',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-3943f198-d6e5-4cce-8be3-06ee0d2e86b6',
          type: 'RSS',
          url: 'http://feeds.bbci.co.uk/news/world/rss.xml#',
          options: {},
        },
        {
          name: 'United Kingdom',
          id: 'Q145',
          language: '',
          refresh: '',
          sourceId: 'source-3943f198-d6e5-4cce-8be3-06ee0d2e86b6',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
    {
      name: 'GDELT',
      url: '',
      id: 'source-d38ceaa8',
      feeds: [],
    },
    {
      name: 'Telegram Groups',
      url: '',
      id: 'source-e6a7973f',
      feeds: [
        {
          name: 'Intel Slava Z',
          id: 'feed-259c4032',
          language: '',
          refresh: '*/10 * * * *',
          sourceId: 'source-e6a7973f',
          type: 'Telegram',
          url: 'https://t.me/intelslava',
          options: {},
        },
        {
          name: 'ekspertai.eu',
          id: 'feed-ddbab8dc',
          language: '',
          refresh: '*/15 * * * *',
          sourceId: 'source-e6a7973f',
          type: 'Telegram',
          url: 'https://t.me/ekspertaiTelegram',
          options: {},
        },
      ],
    },
    {
      name: 'Russian',
      url: '',
      id: 'source-d78f41dd',
      feeds: [
        {
          name: 'kurier.lt',
          id: 'feed-16374317',
          language: '',
          refresh: '',
          sourceId: 'source-d78f41dd',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'lenta.ru',
          id: 'feed-81c2fdea',
          language: '',
          refresh: '',
          sourceId: 'source-d78f41dd',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'nedelia.lt',
          id: 'feed-848bbad6',
          language: '',
          refresh: '',
          sourceId: 'source-d78f41dd',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'ria.ru',
          id: 'feed-50f5d8e7',
          language: '',
          refresh: '',
          sourceId: 'source-d78f41dd',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'baltnews.ru',
          id: 'feed-77214465',
          language: '',
          refresh: '',
          sourceId: 'source-d78f41dd',
          type: 'RSS',
          url: '',
          options: {},
        },
        {
          name: 'Russia',
          id: 'country-73eee79e-8641-d5e6-8d04-2da4ce47322a',
          language: '',
          refresh: '',
          sourceId: 'source-d78f41dd',
          type: 'RSS',
          url: '',
          options: {},
        },
      ],
    },
  ],
};

const urlMsg = {
  id: '8cf59fa7-c174-402b-93d8-76d33c545dcb',
  feedId: 'feed-a967d972',
  sourceId: 'source-d00f8a9a-7e45-bda7-07da-3017464f4413',
  title: 'Football Daily | A tip of the hat to Harry Kane and longevity',
  type: 'RSS',
  url: 'https://www.theguardian.com/football/2023/mar/24/football-daily-harry-kane-england',
  text: '',
  summary: null,
  language: 'xx',
  original: null,
  originalLanguage: null,
  images: null,
  metadata: [
    {
      origin: 'rss_crawler',
      data: [
        {
          type: 'tag',
          value: 'Netherlands',
          id: null,
          start: null,
          end: null,
          label: null,
          wkt: null,
          options: null,
        },
      ],
    },
  ],
  credMan: false,
  cred: null,
  affiliation: null,
  target: null,
  storyId: null,
  storyCount: null,
  languageFlags: null,
  anger: null,
  disgust: null,
  fear: null,
  joy: null,
  neutral: null,
  readability: null,
  sadness: null,
  surprise: null,
  polarisation: null,
  sarcasm: null,
  accuracy: 'UNKNOWN',
  disinfoType: 'UNKNOWN',
  commentsCount: null,
  likesCount: null,
  dislikesCount: null,
  viewsCount: null,
  sharesCount: null,
  version: 1,
  pub_date: 1679676240,
  created: 1679676529,
  updated: 1679676529,
};

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
        'article_url_xx',
        // 'config',
        // 'standard_cap',
        // 'standard_geojson',
        // RequestChangeOfTrialStage,
        // TimeTopic,
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
      this.sendUrlMsg();
      // this.sendStageChangeRequest();
      // this.sendCap();
      // // this.sendGeoJSON();
      // this.sendTime();
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

  /** Will only work if you are authorized to send CAP messages. */
  private sendUrlMsg() {
    const payloads: AdapterProducerRecord = {
      topic: 'article_url_xx',
      messages: [{ value: urlMsg, key: 'EV' }],
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
