import * as fs from 'fs';
import * as path from 'path';

export const clone = <T>(model: T) => { return JSON.parse(JSON.stringify(model)) as T; };

/**
 * Find all files recursively in specific folder with specific extension
 *
 * @param directoryName Path relative to this file or other file which requires this files
 * @param ext Extension name, e.g: '.html'
 * @return Result files with path string in an array
 */
export const findFilesInDir = (directoryName: string, ext: string) => {
  ext = (ext[0] === '.' ? ext : `.${ext}`).toLowerCase();
  let results: string[] = [];

  if (!fs.existsSync(directoryName)) {
    console.error(`Error - Directory ${directoryName} does not exist`);
    return [];
  }

  fs.readdirSync(directoryName).forEach(f => {
    const filename = path.join(directoryName, f);
    const stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      results = results.concat(findFilesInDir(filename, ext)); // recurse
    } else if (path.extname(filename).toLowerCase() === ext) {
      results.push(filename);
    }
  });
  return results;
};

/**
 * Look for schema files that represent a value, but without a corresponding key file, i.e.
 * a schema file names <topic>-value.avsc should also have a <topic>-key.avsc.
 *
 * @param files Found schema files
 * @return missing key schema files
 */
export const findMissingKeyFiles = (files: string[]) => {
  return files
    .filter(f => path.basename(f).indexOf('-value.avsc') >= 0)
    .reduce((p, c) => {
    const keyFile = c.replace('-value.avsc', '-key.avsc');
    if (files.filter(f => f.indexOf(keyFile) >= 0).length > 0) { return p; }
    p.push(keyFile);
    return p;
  }, [] as string[]);
};
