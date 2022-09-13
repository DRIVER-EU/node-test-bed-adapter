import * as dns from 'dns';
import * as os from 'os';

export interface IComputerInfo {
  hostname: string;
  localIP?: string;
  externalIP?: string;
}

export const computerInfo = async (
  externalIP: string | undefined,
  cb: (data: IComputerInfo, err?: NodeJS.ErrnoException) => void
) => {
  const info = { hostname: os.hostname() } as IComputerInfo;
  dns.lookup(os.hostname(), async (err, address: string, __) => {
    if (err) {
      cb(info, err);
    }
    info.localIP = address;
    info.externalIP = externalIP;
    cb(info);
  });
};
