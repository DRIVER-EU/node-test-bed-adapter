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
//# sourceMappingURL=helpers.js.map