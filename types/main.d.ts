/**
 * @fileoverview URL pattern matching library
 * @module url-pattern
 */
export type UrlPatternOptions = {
    /**
     * - Character used for escaping special characters
     */
    escapeChar?: string;
    /**
     * - Character that starts a named segment
     */
    segmentNameStartChar?: string;
    /**
     * - Character that ends a named segment. When set, the segment name stops at the first occurrence of this character (instead of stopping at the first character outside `segmentNameCharset`).
     */
    segmentNameEndChar?: string;
    /**
     * - Characters allowed in segment names
     */
    segmentNameCharset?: string;
    /**
     * - Characters allowed in segment values
     */
    segmentValueCharset?: string;
    /**
     * - Character that starts an optional segment
     */
    optionalSegmentStartChar?: string;
    /**
     * - Character that ends an optional segment
     */
    optionalSegmentEndChar?: string;
    /**
     * - Character that denotes a wildcard
     */
    wildcardChar?: string;
};
export type ParsedSegment = {
    /**
     * - Segment name
     */
    name: string;
    /**
     * - Segment type ('named' | 'wildcard' | 'literal')
     */
    type: string;
    /**
     * - Whether the segment is optional
     */
    optional?: boolean;
    /**
     * - Identifier of the optional group this segment belongs to; absent for required segments
     */
    optionalGroupId?: number;
    /**
     * - Compiled regex string
     */
    regex: string;
};
export type SegmentName = {
    /**
     * - Segment name
     */
    name: string;
    /**
     * - Capture group index
     */
    index: number;
    /**
     * - Segment type ('named' | 'wildcard')
     */
    type: string;
};
export type CompiledPattern = {
    /**
     * - Compiled regex string
     */
    regex: string;
    /**
     * - Compiled regex object
     */
    regexObj: RegExp;
    /**
     * - Parsed segments
     */
    segments: Array<ParsedSegment>;
    /**
     * - Segment name mappings
     */
    segmentNames: Array<SegmentName>;
    /**
     * - Options used
     */
    options: UrlPatternOptions;
    /**
     * - Whether pattern was created from regex
     */
    isRegex: boolean;
    /**
     * - Original pattern string
     */
    pattern?: string;
    /**
     * - Keys for regex patterns
     */
    keys?: Array<string>;
};
/**
 * @typedef {Object} UrlPatternOptions
 * @property {string} [escapeChar='\\'] - Character used for escaping special characters
 * @property {string} [segmentNameStartChar=':'] - Character that starts a named segment
 * @property {string} [segmentNameEndChar] - Character that ends a named segment. When set, the segment name stops at the first occurrence of this character (instead of stopping at the first character outside `segmentNameCharset`).
 * @property {string} [segmentNameCharset='a-zA-Z0-9_'] - Characters allowed in segment names
 * @property {string} [segmentValueCharset='a-zA-Z0-9-_~ %'] - Characters allowed in segment values
 * @property {string} [optionalSegmentStartChar='('] - Character that starts an optional segment
 * @property {string} [optionalSegmentEndChar=')'] - Character that ends an optional segment
 * @property {string} [wildcardChar='*'] - Character that denotes a wildcard
 */
/**
 * @typedef {Object} ParsedSegment
 * @property {string} name - Segment name
 * @property {string} type - Segment type ('named' | 'wildcard' | 'literal')
 * @property {boolean} [optional=false] - Whether the segment is optional
 * @property {number} [optionalGroupId] - Identifier of the optional group this segment belongs to; absent for required segments
 * @property {string} regex - Compiled regex string
 */
/**
 * @typedef {Object} SegmentName
 * @property {string} name - Segment name
 * @property {number} index - Capture group index
 * @property {string} type - Segment type ('named' | 'wildcard')
 */
/**
 * @typedef {Object} CompiledPattern
 * @property {string} regex - Compiled regex string
 * @property {RegExp} regexObj - Compiled regex object
 * @property {Array<ParsedSegment>} segments - Parsed segments
 * @property {Array<SegmentName>} segmentNames - Segment name mappings
 * @property {UrlPatternOptions} options - Options used
 * @property {boolean} isRegex - Whether pattern was created from regex
 * @property {string} [pattern] - Original pattern string
 * @property {Array<string>} [keys] - Keys for regex patterns
 */
/**
 * Default options for URL pattern matching
 * @type {UrlPatternOptions}
 */
declare const DEFAULT_OPTIONS: UrlPatternOptions;
/**
 * Creates a compiled pattern from a string
 * @param {string} pattern - Pattern string
 * @param {UrlPatternOptions} [options={}] - Options
 * @returns {CompiledPattern} Compiled pattern
 */
declare const makePattern: (pattern: string, options?: UrlPatternOptions) => CompiledPattern;
/**
 * Creates a compiled pattern from a regex
 * @param {RegExp} regex - Regex pattern
 * @param {Array<string>} [keys=[]] - Array of key names for captured groups
 * @returns {CompiledPattern} Compiled pattern
 */
declare const makePatternFromRegex: (regex: RegExp, keys?: Array<string>) => CompiledPattern;
/**
 * Matches a string against a compiled pattern
 * @param {CompiledPattern} compiled - Compiled pattern
 * @param {string} str - String to match
 * @returns {Object|null} Extracted values or null if no match
 */
declare const match: (compiled: CompiledPattern, str: string) => any | null;
/**
 * Stringifies a pattern with given values
 * @param {CompiledPattern} compiled - Compiled pattern
 * @param {Object} [values={}] - Values to stringify
 * @returns {string} Generated string
 * @throws {Error} If required values are missing
 */
declare const stringify: (compiled: CompiledPattern, values?: any) => string;
/**
 * UrlPattern class for matching and generating URLs
 */
declare class UrlPattern {
    /** @type {CompiledPattern} */
    compiled: CompiledPattern;
    /**
     * @param {string|RegExp} pattern - Pattern string or regex
     * @param {UrlPatternOptions|Array<string>} [options={}] - Options or keys (for regex)
     */
    constructor(pattern: string | RegExp, options?: UrlPatternOptions | Array<string>);
    /**
     * Match a string against the pattern
     * @param {string} str - String to match
     * @returns {Object|null} Extracted values or null if no match
     */
    match(str: string): any | null;
    /**
     * Generate a string from the pattern
     * @param {Object} [values={}] - Values to stringify
     * @returns {string} Generated string
     */
    stringify(values?: any): string;
}
/**
 * Creates a new UrlPattern instance (functional API)
 * @param {string|RegExp} pattern - Pattern string or regex
 * @param {UrlPatternOptions|Array<string>} [options={}] - Options or keys
 * @returns {UrlPattern} UrlPattern instance
 */
declare const urlPattern: (pattern: string | RegExp, options?: UrlPatternOptions | Array<string>) => UrlPattern;
export { UrlPattern, urlPattern, makePattern, makePatternFromRegex, match, stringify, DEFAULT_OPTIONS };
export default urlPattern;
