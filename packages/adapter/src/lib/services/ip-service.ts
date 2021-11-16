import * as dns from 'dns';
import * as os from 'os';
import * as http from 'http';
import * as publicIp from 'public-ip';

export interface IComputerInfo {
  hostname: string;
  localIP?: string;
  externalIP?: string;
}

export const computerInfo = async (
  cb: (data: IComputerInfo, err?: NodeJS.ErrnoException) => void
) => {
  const info = { hostname: os.hostname() } as IComputerInfo;
  dns.lookup(os.hostname(), async (err, address: string, __) => {
    if (err) {
      cb(info, err);
    }
    info.localIP = address;
    const externalIp = await publicIp.v4({ onlyHttps: true });
    info.externalIP = externalIp;
    cb(info);

    // publicIp
    //   .v4({ onlyHttps: true })
    //   .then((externalIp) => {
    //     info.externalIP = externalIp;
    //   })
    //   .catch((e) => {
    //     console.error(e);
    //   })
    //   .finally(() => {
    //     console.log(JSON.stringify(info));
    //     cb(info);
    //   });
  });
};
