import * as dns from 'dns';
import * as os from 'os';
import publicIp from 'public-ip';

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
    info.externalIP = await publicIp.v4({ onlyHttps: true });
    cb(info);
  });
};
