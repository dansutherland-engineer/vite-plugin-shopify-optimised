import * as toml from '@iarna/toml';
/**
 * Given a TOML string, it returns a JSON object.
 *
 * @param input - TOML string.
 * @returns JSON object.
 */
export function decodeToml(input) {
    const normalizedInput = input.replace(/\r\n$/g, '\n');
    return toml.parse(normalizedInput);
}
/**
 * Given a JSON object, it returns a TOML string.
 *
 * @param content - JSON object.
 * @returns TOML string.
 */
export function encodeToml(content) {
    // our JsonMap type is fine with nulls/undefined, but the typing for TOML library isn't.
    const tomlSafeContent = content;
    return toml.stringify(tomlSafeContent);
}
//# sourceMappingURL=toml.js.map