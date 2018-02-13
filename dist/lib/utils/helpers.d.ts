export declare const clone: <T>(model: T) => T;
/**
 * Find all files recursively in specific folder with specific extension
 *
 * @param directoryName Path relative to this file or other file which requires this files
 * @param ext Extension name, e.g: '.html'
 * @return Result files with path string in an array
 */
export declare const findFilesInDir: (directoryName: string, ext: string) => string[];
/**
 * Look for schema files that represent a value, but without a corresponding key file, i.e.
 * a schema file names <topic>-value.avsc should also have a <topic>-key.avsc.
 *
 * @param files Found schema files
 * @return missing key schema files
 */
export declare const findMissingKeyFiles: (files: string[]) => string[];
/**
 * Create a RFC4122 version 4 GUID
 *
 * @see https://stackoverflow.com/a/2117523/319711
 *
 * @returns RFC4122 version 4 compliant GUID
 */
export declare const uuid4: () => string;
