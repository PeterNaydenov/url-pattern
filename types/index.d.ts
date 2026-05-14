/**
 * Options for customizing the pattern syntax
 */
export interface UrlPatternOptions {
  /** Character used for escaping special characters (default: '\\') */
  escapeChar?: string;
  /** Character that starts a named segment (default: ':') */
  segmentNameStartChar?: string;
  /** Characters allowed in segment names (default: 'a-zA-Z0-9') */
  segmentNameCharset?: string;
  /** Characters allowed in segment values (default: 'a-zA-Z0-9-_~ %') */
  segmentValueCharset?: string;
  /** Character that starts an optional segment (default: '(') */
  optionalSegmentStartChar?: string;
  /** Character that ends an optional segment (default: ')') */
  optionalSegmentEndChar?: string;
  /** Character that denotes a wildcard (default: '*') */
  wildcardChar?: string;
}

/**
 * Result of matching a pattern against a string
 */
export interface MatchResult {
  [key: string]: string | string[] | null;
}

/**
 * Compiled pattern object
 */
export interface CompiledPattern {
  regex: string;
  regexObj: RegExp;
  segments: ParsedSegment[];
  segmentNames: SegmentName[];
  options: UrlPatternOptions;
  isRegex: boolean;
  pattern?: string;
  keys?: string[];
}

/**
 * Parsed segment
 */
export interface ParsedSegment {
  name: string;
  type: 'named' | 'wildcard' | 'literal';
  optional?: boolean;
  regex: string;
}

/**
 * Segment name mapping
 */
export interface SegmentName {
  name: string;
  index: number;
  type: 'named' | 'wildcard';
}

/**
 * UrlPattern class for matching and generating URLs
 */
export class UrlPattern {
  /**
   * @param pattern - Pattern string or RegExp
   * @param options - Options object or keys array (for regex patterns)
   */
  constructor(pattern: string | RegExp, options?: UrlPatternOptions | string[]);

  /**
   * Match a string against the pattern
   * @param str - String to match
   * @returns Extracted values or null if no match
   */
  match(str: string): MatchResult | null;

  /**
   * Generate a string from the pattern
   * @param values - Values to stringify
   * @returns Generated string
   */
  stringify(values?: Record<string, any>): string;
}

/**
 * Creates a new UrlPattern instance (functional API)
 * @param pattern - Pattern string or RegExp
 * @param options - Options object or keys array (for regex patterns)
 * @returns UrlPattern instance
 */
export function urlPattern(pattern: string | RegExp, options?: UrlPatternOptions | string[]): UrlPattern;

/**
 * Creates a compiled pattern from a string
 * @param pattern - Pattern string
 * @param options - Options
 * @returns Compiled pattern
 */
export function makePattern(pattern: string, options?: UrlPatternOptions): CompiledPattern;

/**
 * Creates a compiled pattern from a regex
 * @param regex - Regex pattern
 * @param keys - Array of key names for captured groups
 * @returns Compiled pattern
 */
export function makePatternFromRegex(regex: RegExp, keys?: string[]): CompiledPattern;

/**
 * Matches a string against a compiled pattern
 * @param compiled - Compiled pattern
 * @param str - String to match
 * @returns Extracted values or null
 */
export function match(compiled: CompiledPattern, str: string): MatchResult | null;

/**
 * Stringifies a pattern with given values
 * @param compiled - Compiled pattern
 * @param values - Values to stringify
 * @returns Generated string
 */
export function stringify(compiled: CompiledPattern, values?: Record<string, any>): string;

/**
 * Default options
 */
export const DEFAULT_OPTIONS: UrlPatternOptions;

export default UrlPattern;
