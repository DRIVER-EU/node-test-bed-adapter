export declare const clone: <T>(model: T) => T;
/**
 * Find all files recursively in specific folder with specific extension
 *
 * @param directoryName Path relative to this file or other file which requires this files
 * @param ext Extension name, e.g: '.html'
 * @return Result files with path string in an array
 */
export declare const findFilesInDir: (directoryName: string, ext: string) => string[];
