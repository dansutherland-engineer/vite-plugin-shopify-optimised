/**
 * Returns the MIME type for a filename.
 *
 * @param fileName - Filename.
 * @returns The mime type.
 */
export declare function lookupMimeType(fileName: string): string;
/**
 * Adds MIME type(s) to the dictionary.
 *
 * @param newTypes - Object of key-values where key is extension and value is mime type.
 */
export declare function setMimeTypes(newTypes: {
    [key: string]: string;
}): void;
