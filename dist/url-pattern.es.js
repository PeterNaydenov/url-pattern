/**
 * @fileoverview URL pattern matching library
 * @module url-pattern
 */

/**
 * @typedef {Object} UrlPatternOptions
 * @property {string} [escapeChar='\\'] - Character used for escaping special characters
 * @property {string} [segmentNameStartChar=':'] - Character that starts a named segment
 * @property {string} [segmentNameCharset='a-zA-Z0-9'] - Characters allowed in segment names
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
const DEFAULT_OPTIONS = {
  escapeChar: '\\',
  segmentNameStartChar: ':',
  segmentNameCharset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  segmentValueCharset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_~ %',
  optionalSegmentStartChar: '(',
  optionalSegmentEndChar: ')',
  wildcardChar: '*'
};

/**
 * Escapes special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Merges default options with user provided options
 * @param {UrlPatternOptions} [userOptions={}] - User provided options
 * @returns {UrlPatternOptions} Merged options
 */
const mergeOptions = (userOptions = {}) => ({
  ...DEFAULT_OPTIONS,
  ...userOptions
});

/**
 * Finds the position of the next special character in the pattern
 * @param {string} pattern - Pattern string
 * @param {number} start - Starting position
 * @param {UrlPatternOptions} options - Parsing options
 * @returns {number} Position of next special character
 */
const findNextSpecialChar = (pattern, start, options) => {
  const chars = [
    options.escapeChar, 
    options.optionalSegmentStartChar, 
    options.optionalSegmentEndChar, 
    options.wildcardChar, 
    options.segmentNameStartChar
  ];
  
  let minPos = pattern.length;
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    if (!char) continue;
    const pos = pattern.indexOf(char, start);
    if (pos !== -1 && pos < minPos) {
      minPos = pos;
    }
  }
  
  return minPos;
};

/**
 * Parses a pattern string into segments
 * @param {string} pattern - Pattern string to parse
 * @param {UrlPatternOptions} options - Parsing options
 * @returns {Array<ParsedSegment>} Parsed segments
 */
const parsePattern = (pattern, options) => {
  const segments = [];
  let i = 0;
  let inOptional = false;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === options.escapeChar && i + 1 < pattern.length) {
      segments.push({
        type: 'literal',
        name: pattern[i + 1],
        regex: escapeRegex(pattern[i + 1]),
        optional: inOptional
      });
      i += 2;
      continue;
    }

    if (char === options.optionalSegmentStartChar) {
      inOptional = true;
      i++;
      continue;
    }

    if (char === options.optionalSegmentEndChar) {
      inOptional = false;
      i++;
      continue;
    }

    if (char === options.wildcardChar) {
      segments.push({
        type: 'wildcard',
        name: '_',
        regex: '.*',
        optional: inOptional
      });
      i++;
      continue;
    }

    if (char === options.segmentNameStartChar && i + 1 < pattern.length) {
      const remaining = pattern.slice(i + 1);
      let nameEnd = 0;
      const charset = options.segmentNameCharset || '';
      
      for (let j = 0; j < remaining.length; j++) {
        if (!charset.includes(remaining[j])) {
          break;
        }
        nameEnd = j + 1;
      }
      
      const name = remaining.slice(0, nameEnd);
      
      if (name.length > 0) {
        let valueCharset = options.segmentValueCharset || '';
        if (valueCharset.includes('-') && valueCharset.indexOf('-') > 0 && valueCharset.indexOf('-') < valueCharset.length - 1) {
          valueCharset = valueCharset.replace(/-/g, '');
          valueCharset += '-';
        }
        const escapedValueCharset = valueCharset.replace(/\]/g, '\\]');
        const valueRegex = `([${escapedValueCharset}]+)`;
        
        segments.push({
          type: 'named',
          name,
          regex: valueRegex,
          optional: inOptional
        });
        i += 1 + nameEnd;
        continue;
      }
    }

    const literalEnd = findNextSpecialChar(pattern, i, options);
    
    if (literalEnd > i) {
      const literal = pattern.slice(i, literalEnd);
      segments.push({
        type: 'literal',
        name: literal,
        regex: escapeRegex(literal),
        optional: inOptional
      });
      i = literalEnd;
      continue;
    }

    i++;
  }

  return segments;
};

/**
 * Compiles segments into a regex pattern
 * @param {Array<ParsedSegment>} segments - Parsed segments
 * @param {UrlPatternOptions} options - Options
 * @returns {{regex: string, segmentNames: Array<SegmentName>}} Compiled regex and segment names
 */
const compileRegex = (segments, _options) => {
  let regex = '^';
  let groupIndex = 0;
  /** @type {Array<SegmentName>} */
  const segmentNames = [];
  let i = 0;

  while (i < segments.length) {
    const segment = segments[i];
    
    if (segment.optional) {
      let optionalPart = '';
      let j = i;
      
      while (j < segments.length && segments[j].optional) {
        const seg = segments[j];
        
        if (seg.type === 'wildcard') {
          optionalPart += '(.*)';
          segmentNames.push({ name: '_', index: groupIndex, type: 'wildcard' });
          groupIndex++;
        } else if (seg.type === 'named') {
          optionalPart += seg.regex;
          segmentNames.push({ name: seg.name, index: groupIndex, type: 'named' });
          groupIndex++;
        } else {
          optionalPart += seg.regex;
        }
        
        j++;
      }
      
      regex += `(?:${optionalPart})?`;
      i = j;
      continue;
    }

    if (segment.type === 'wildcard') {
      regex += '(.*)';
      segmentNames.push({ name: '_', index: groupIndex, type: 'wildcard' });
      groupIndex++;
    } else if (segment.type === 'named') {
      regex += segment.regex;
      segmentNames.push({ name: segment.name, index: groupIndex, type: 'named' });
      groupIndex++;
    } else {
      regex += segment.regex;
    }
    
    i++;
  }

  regex += '$';
  
  return { regex, segmentNames };
};

/**
 * Creates a compiled pattern from a string
 * @param {string} pattern - Pattern string
 * @param {UrlPatternOptions} [options={}] - Options
 * @returns {CompiledPattern} Compiled pattern
 */
const makePattern = (pattern, options = {}) => {
  const mergedOptions = mergeOptions(options);
  const segments = parsePattern(pattern, mergedOptions);
  const { regex, segmentNames } = compileRegex(segments);

  return {
    regex,
    regexObj: new RegExp(regex),
    segments,
    segmentNames,
    options: mergedOptions,
    isRegex: false,
    pattern
  };
};

/**
 * Creates a compiled pattern from a regex
 * @param {RegExp} regex - Regex pattern
 * @param {Array<string>} [keys=[]] - Array of key names for captured groups
 * @returns {CompiledPattern} Compiled pattern
 */
const makePatternFromRegex = (regex, keys = []) => {
  return {
    regex: regex.source,
    regexObj: regex,
    segments: [],
    segmentNames: keys.map((name, index) => ({ name, index, type: 'named' })),
    options: DEFAULT_OPTIONS,
    isRegex: true,
    keys
  };
};

/**
 * Matches a string against a compiled pattern
 * @param {CompiledPattern} compiled - Compiled pattern
 * @param {string} str - String to match
 * @returns {Object|null} Extracted values or null if no match
 */
const match = (compiled, str) => {
  const matchResult = compiled.regexObj.exec(str);
  
  if (!matchResult) {
    return null;
  }

  if (compiled.isRegex) {
    if (compiled.keys && compiled.keys.length > 0) {
      const result = {};
      compiled.keys.forEach((key, index) => {
        const val = matchResult[index + 1];
        result[key] = val !== undefined ? val : null;
      });
      return result;
    }
    return matchResult.slice(1);
  }

  const result = {};
  const usedNames = new Set();

  for (let i = 0; i < compiled.segmentNames.length; i++) {
    const segInfo = compiled.segmentNames[i];
    const value = matchResult[segInfo.index + 1] || '';
    
    if (usedNames.has(segInfo.name)) {
      if (!Array.isArray(result[segInfo.name])) {
        result[segInfo.name] = [result[segInfo.name]];
      }
      result[segInfo.name].push(value);
    } else {
      usedNames.add(segInfo.name);
      result[segInfo.name] = value;
    }
  }

  for (const key in result) {
    if (result[key] === '') {
      delete result[key];
    }
  }

  return result;
};

/**
 * Stringifies a pattern with given values
 * @param {CompiledPattern} compiled - Compiled pattern
 * @param {Object} [values={}] - Values to stringify
 * @returns {string} Generated string
 * @throws {Error} If required values are missing
 */
const stringify = (compiled, values = {}) => {
  if (compiled.isRegex) {
    throw new Error('Cannot stringify a pattern created from regex');
  }

  let result = '';
  let i = 0;
  
  while (i < compiled.segments.length) {
    const segment = compiled.segments[i];
    
    if (segment.optional) {
      let optionalPart = '';
      let j = i;
      
      while (j < compiled.segments.length && compiled.segments[j].optional) {
        const seg = compiled.segments[j];
        
        if (seg.type === 'literal') {
          optionalPart += seg.name;
        } else if (seg.type === 'named') {
          const val = values[seg.name];
          if (val !== undefined && val !== null && val !== '') {
            optionalPart += Array.isArray(val) ? val.join('/') : val;
          } else {
            optionalPart = '';
            break;
          }
        } else if (seg.type === 'wildcard') {
          const val = values._;
          if (val !== undefined && val !== null && val !== '') {
            optionalPart += Array.isArray(val) ? val.join('/') : val;
          } else {
            optionalPart = '';
            break;
          }
        }
        
        j++;
      }
      
      if (optionalPart !== '') {
        result += optionalPart;
      }
      
      if (i === j) {
        i++;
      } else {
        i = j;
      }
      continue;
    }

    if (segment.type === 'literal') {
      result += segment.name;
    } else if (segment.type === 'named') {
      const value = values[segment.name];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Missing required value for segment: ${segment.name}`);
      }
      result += Array.isArray(value) ? value.join('/') : value;
    } else if (segment.type === 'wildcard') {
      const value = values._;
      if (value === undefined || value === null || value === '') {
        throw new Error('Missing required wildcard value');
      }
      result += Array.isArray(value) ? value.join('/') : value;
    }
    
    i++;
  }

  return result;
};

/**
 * UrlPattern class for matching and generating URLs
 */
class UrlPattern {
  /**
   * @param {string|RegExp} pattern - Pattern string or regex
   * @param {UrlPatternOptions|Array<string>} [options={}] - Options or keys (for regex)
   */
  constructor(pattern, options = {}) {
    if (pattern instanceof RegExp) {
      const keys = Array.isArray(options) ? options : [];
      /** @type {CompiledPattern} */
      this.compiled = makePatternFromRegex(pattern, keys);
    } else {
      /** @type {CompiledPattern} */
      this.compiled = makePattern(pattern, /** @type {UrlPatternOptions} */ (options));
    }
  }

  /**
   * Match a string against the pattern
   * @param {string} str - String to match
   * @returns {Object|null} Extracted values or null if no match
   */
  match(str) {
    return match(this.compiled, str);
  }

  /**
   * Generate a string from the pattern
   * @param {Object} [values={}] - Values to stringify
   * @returns {string} Generated string
   */
  stringify(values) {
    return stringify(this.compiled, values);
  }
}

/**
 * Creates a new UrlPattern instance (functional API)
 * @param {string|RegExp} pattern - Pattern string or regex
 * @param {UrlPatternOptions|Array<string>} [options={}] - Options or keys
 * @returns {UrlPattern} UrlPattern instance
 */
const urlPattern = (pattern, options = {}) => {
  return new UrlPattern(pattern, options);
};

export { DEFAULT_OPTIONS, UrlPattern, UrlPattern as default, makePattern, makePatternFromRegex, match, stringify, urlPattern };
