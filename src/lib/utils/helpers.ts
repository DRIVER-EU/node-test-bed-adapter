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
      console.log('-- found: ', filename);
      results.push(filename);
    }
  });
  return results;
};
