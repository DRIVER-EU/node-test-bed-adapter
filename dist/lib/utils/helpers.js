"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
exports.clone = (model) => { return JSON.parse(JSON.stringify(model)); };
/**
 * Find all files recursively in specific folder with specific extension
 *
 * @param directoryName Path relative to this file or other file which requires this files
 * @param ext Extension name, e.g: '.html'
 * @return Result files with path string in an array
 */
exports.findFilesInDir = (directoryName, ext) => {
    ext = (ext[0] === '.' ? ext : `.${ext}`).toLowerCase();
    let results = [];
    if (!fs.existsSync(directoryName)) {
        console.error(`Error - Directory ${directoryName} does not exist`);
        return [];
    }
    fs.readdirSync(directoryName).forEach(f => {
        const filename = path.join(directoryName, f);
        const stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            results = results.concat(exports.findFilesInDir(filename, ext)); // recurse
        }
        else if (path.extname(filename).toLowerCase() === ext) {
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
exports.findMissingKeyFiles = (files) => {
    return files
        .filter(f => path.basename(f).indexOf('-value.avsc') >= 0)
        .reduce((p, c) => {
        const keyFile = c.replace('-value.avsc', '-key.avsc');
        if (files.filter(f => f.indexOf(keyFile) >= 0).length > 0) {
            return p;
        }
        p.push(keyFile);
        return p;
    }, []);
};
/**
 * Create a RFC4122 version 4 GUID
 *
 * @see https://stackoverflow.com/a/2117523/319711
 *
 * @returns RFC4122 version 4 compliant GUID
 */
exports.uuid4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        // tslint:disable-next-line:no-bitwise
        const r = Math.random() * 16 | 0;
        // tslint:disable-next-line:no-bitwise
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
//# sourceMappingURL=helpers.js.map