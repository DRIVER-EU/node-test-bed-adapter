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
//# sourceMappingURL=helpers.js.map