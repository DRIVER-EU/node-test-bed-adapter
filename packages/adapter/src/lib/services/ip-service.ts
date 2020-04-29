import * as dns from 'dns';
import * as os from 'os';
import * as http from 'http';

export interface IComputerInfo {
  hostname: string;
  localIP?: string;
  externalIP?: string;
}

export const computerInfo = (
  cb: (data: IComputerInfo, err?: NodeJS.ErrnoException) => void
) => {
  const info = { hostname: os.hostname() } as IComputerInfo;
  dns.lookup(os.hostname(), (err, address: string, __) => {
    if (err) {
      cb(info, err);
    }
    info.localIP = address;
    whatsMyIpAddress((addr, err) => {
      if (err) {
        cb(info, err);
      }
      info.externalIP = addr;
      cb(info);
    });
  });
};

export const whatsMyIpAddress = (
  callback: (data?: string, err?: NodeJS.ErrnoException) => void
) => {
  const options = {
    host: 'ipv4bot.whatismyipaddress.com',
    port: 80,
    path: '/',
  };
  http
    .get(options, res => {
      res.setEncoding('utf8');
      res.on('data', chunk => callback(chunk, undefined));
    })
    .on('error', err => callback(undefined, err));
};
