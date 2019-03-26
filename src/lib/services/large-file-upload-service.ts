import { ITestBedOptions } from '..';
import * as fs from 'fs';
import * as path from 'path';
import * as FormData from 'form-data';
import { default as axios } from 'axios';
import { bufferToStream } from '../utils/helpers';

/**
 * Service to help the user upload large files to the Test-bed.
 * Files can be upload to the public folder, or obscure (semi-private).
 * If requested, a message can be sent to the Test-bed to inform others.
 */
export class LargeFileUploadService {
  private restUri?: string;

  constructor(options: ITestBedOptions) {
    if (!options.largeFileService) {
      return;
    }

    const addHttp = (s: string) => (s.startsWith('http') ? s : `http://${s}`);
    const removeTrailingSlash = (s: string) => (s.endsWith('/') ? s.substr(0, s.length - 1) : s);
    this.restUri = removeTrailingSlash(addHttp(options.largeFileService));
    console.log('URL: ' + this.restUri);
  }

  /** Is the service enabled */
  public get enabled() {
    return this.restUri ? true : false;
  }

  /**
   * Upload the file to the LargeFileService.
   *
   * @param file File path or an object containing a buffer and name to upload
   * @param isPrivate When true, the file will not show up in the public listing
   * @param cb Callback functions, invoked when the upload is done (or errors).
   */
  public upload(
    file: string | { buffer: Buffer; name: string },
    isPrivate = false,
    cb?: (err?: Error, uploadUrl?: string) => void
  ) {
    if (!this.enabled) {
      return;
    }
    if (typeof file !== 'string') {
      this.uploadBuffer(file, isPrivate, cb);
    } else {
      fs.exists(file, exists => {
        if (exists) {
          this.uploadFile(file, isPrivate, cb);
        } else {
          const filePath = path.resolve(process.cwd(), file);
          fs.exists(filePath, exists => {
            if (exists) {
              this.uploadFile(file, isPrivate, cb);
            } else if (cb) {
              cb(new Error(`Error: file ${filePath} does not exist`));
            }
          });
        }
      });
    }
  }

  /** Actually upload the file to the large-file-service */
  private uploadFile(file: string, isPrivate: boolean, cb?: (err?: Error, uploadUrl?: string) => void) {
    if (!this.restUri) {
      return;
    }
    const form = new FormData();
    form.append('uploadFile', fs.createReadStream(file), path.basename(file));
    form.append('private', isPrivate.toString());
    this.uploadForm(form, cb);
  }

  /**
   * Upload the buffer to the LargeFileService.
   *
   * @param file File to upload or an object containing a Buffer and name
   * @param isPrivate When true, the file will not show up in the public listing
   * @param cb Callback functions, invoked when the upload is done
   */
  private uploadBuffer(
    namedBuffer: { buffer: Buffer; name: string },
    isPrivate = false,
    cb?: (err?: Error, uploadUrl?: string) => void
  ) {
    if (!this.restUri) {
      return;
    }
    const { buffer, name } = namedBuffer;
    const stream = bufferToStream(buffer);
    const form = new FormData();
    form.append('uploadFile', stream, name);
    form.append('private', isPrivate.toString());
    this.uploadForm(form, cb);
  }

  /** Upload the form to the service */
  private uploadForm(form: FormData, cb?: (err?: Error, uploadUrl?: string) => void) {
    axios
      .post(`${this.restUri}/upload`, form, {
        headers: form.getHeaders(),
      })
      .then(res => {
        cb && cb(undefined, res.data);
      })
      .catch(err => {
        console.error(err);
        cb && cb(err);
      });
  }
}
