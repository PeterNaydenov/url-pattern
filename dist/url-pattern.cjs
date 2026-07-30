'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/**
 * @fileoverview URL pattern matching library
 * @module url-pattern
 */

/**
 * @typedef {Object} UrlPatternOptions
 * @property {string} [escapeChar='\\'] - Character used for escaping. Only escapes regex metacharacters (`^$.*+?()[]{}|\`); for any other character the backslash is treated as a literal.
 * @property {string} [segmentNameStartChar=':'] - Character that starts a named segment
 * @property {string} [segmentNameEndChar] - Character that ends a named segment. When set, the segment name stops at the first occurrence of this character (instead of stopping at the first character outside `segmentNameCharset`).
 * @property {string} [segmentNameCharset='a-zA-Z0-9_'] - Characters allowed in segment names
 * @property {string} [segmentValueCharset='a-zA-Z0-9-_~ %'] - Characters allowed in segment values
 * @property {string} [optionalSegmentStartChar='('] - Character that starts an optional segment
 * @property {string} [optionalSegmentEndChar=')'] - Character that ends an optional segment
 * @property {string} [wildcardChar='*'] - Character that denotes a wildcard in the pattern
 * @property {string} [wildcardName='_'] - Key under which the wildcard value is stored in the match result
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
const DEFAULT_OPTIONS = {
  escapeChar: '\\',
  segmentNameStartChar: ':',
  segmentNameEndChar: undefined,
  segmentNameCharset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_',
  segmentValueCharset: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_~ %',
  optionalSegmentStartChar: '(',
  optionalSegmentEndChar: ')',
  wildcardChar: '*',
  wildcardName: '_'
};

/**
 * Escapes special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Builds a safe regex character class body from a charset string.
 *
 * The charset is treated as a list of explicit characters — range notation
 * (`a-z`) is NOT interpreted as a range. To match the same set of chars
 * with range syntax, expand it (e.g. `a-z` → `abcdefghijklmnopqrstuvwxyz`).
 *
 * The following chars are escaped because they are special inside `[...]`:
 * `\`, `]`, `^`, and `-`.
 * @param {string} charset - Character class body
 * @returns {string} Safe char class body
 */
const escapeCharClass = (charset) => {
  let escaped = charset.replace(/\\/g, '\\\\');
  escaped = escaped.replace(/\]/g, '\\]');
  escaped = escaped.replace(/\^/g, '\\^');
  escaped = escaped.replace(/-/g, '\\-');
  return escaped;
};

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
  let optionalGroupId = 0;
  let parenDepth = 0;

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === options.escapeChar) {
      // Throw when the escape char is at the end of the pattern — nothing follows
      // it to escape, and the resulting regex would be broken.
      if (i + 1 >= pattern.length) {
        throw new Error(`Invalid pattern: '${options.escapeChar}' at position ${i} has nothing to escape`);
      }
      const nextChar = pattern[i + 1];
      // Only treat the escape char as an escape when followed by a regex
      // metacharacter. For any other character the escape char is kept as a
      // literal (e.g. '\:' in a URL is just a backslash followed by ':').
      // This means `:` cannot be escaped — it has no special meaning in
      // regex, so the escape adds nothing. Same applies when a custom
      // escapeChar is used (e.g. '%:' with escapeChar: '%').
      const regexMetachars = '^$.*+?()[]{}|\\';
      if (!regexMetachars.includes(nextChar)) {
        // Not a regex metachar: treat the escape char as a literal character
        // and advance past it so the next character is processed normally.
        // Use `options.escapeChar` (not a hardcoded `\`) so this works when
        // the user has customized the escape char.
        segments.push({
          type: 'literal',
          name: options.escapeChar,
          regex: escapeRegex(options.escapeChar),
          optional: inOptional,
          optionalGroupId: inOptional ? optionalGroupId : undefined
        });
        i += 1;
        continue;
      } else {
        segments.push({
          type: 'literal',
          name: nextChar,
          regex: escapeRegex(nextChar),
          optional: inOptional,
          optionalGroupId: inOptional ? optionalGroupId : undefined
        });
        i += 2;
        continue;
      }
    }

    if (char === options.optionalSegmentStartChar) {
      inOptional = true;
      optionalGroupId++;
      parenDepth++;
      i++;
      continue;
    }

    if (char === options.optionalSegmentEndChar) {
      if (parenDepth === 0) {
        throw new Error(`Invalid pattern: unmatched '${char}' at position ${i}`);
      }
      inOptional = false;
      parenDepth--;
      i++;
      continue;
    }

    if (char === options.wildcardChar) {
      segments.push({
        type: 'wildcard',
        name: options.wildcardName,
        regex: '.*',
        optional: inOptional,
        optionalGroupId: inOptional ? optionalGroupId : undefined
      });
      i++;
      continue;
    }

    if (char === options.segmentNameStartChar && i + 1 < pattern.length) {
      const remaining = pattern.slice(i + 1);
      let nameEnd = 0;
      const charset = options.segmentNameCharset || '';
      const endChar = options.segmentNameEndChar;

      for (let j = 0; j < remaining.length; j++) {
        if (endChar && remaining[j] === endChar) {
          break;
        }
        if (!charset.includes(remaining[j])) {
          break;
        }
        nameEnd = j + 1;
      }
      
      const name = remaining.slice(0, nameEnd);
      const consumeEndChar = !!(endChar && remaining[nameEnd] === endChar);

      if (name.length > 0) {
        const valueCharset = options.segmentValueCharset || '';
        const escapedValueCharset = escapeCharClass(valueCharset);
        const valueRegex = `([${escapedValueCharset}]+)`;

        segments.push({
          type: 'named',
          name,
          regex: valueRegex,
          optional: inOptional,
          optionalGroupId: inOptional ? optionalGroupId : undefined
        });
        i += 1 + nameEnd + (consumeEndChar ? 1 : 0);
        continue;
      }

      // segmentNameStartChar at end of pattern, or followed by a non-charset
      // character that is also a special char (e.g. ':)').
      throw new Error(`Invalid pattern: '${char}' at position ${i} has no segment name`);
    }

    const literalEnd = findNextSpecialChar(pattern, i, options);

    if (literalEnd > i) {
      const literal = pattern.slice(i, literalEnd);
      segments.push({
        type: 'literal',
        name: literal,
        regex: escapeRegex(literal),
        optional: inOptional,
        optionalGroupId: inOptional ? optionalGroupId : undefined
      });
      i = literalEnd;
      continue;
    }

    // literalEnd === i: current char itself is a special char with no
    // name/value following. Throw for clarity.
    throw new Error(`Invalid pattern: '${char}' at position ${i} has no segment name`);
  }

  if (parenDepth !== 0) {
    throw new Error(`Invalid pattern: unclosed '${options.optionalSegmentStartChar}'`);
  }

  return segments;
};

/**
 * Returns true when a value should be treated as "absent" for an optional segment.
 * @param {*} val - Value to inspect
 * @returns {boolean}
 */
const isAbsentValue = (val) => {
  if (val === undefined || val === null || val === '') return true;
  // Number.isNaN catches numeric NaN values that would otherwise stringify to
  // the literal string "NaN" in a generated URL.
  if (typeof val === 'number' && Number.isNaN(val)) return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
};

/**
 * Returns the value to use for the (occurrenceIndex)-th segment with the
 * given name, plus a flag indicating whether the caller should `join('/')`
 * the value before emitting it.
 *
 * Behaviour depends on `totalOccurrences` and the type of `values[name]`:
 *
 * - Non-array: returned as-is with `joinWithSlash: false`. Used for every
 *   occurrence, preserving the pre-fix behaviour.
 * - Array + `totalOccurrences === 1`: the array is returned with
 *   `joinWithSlash: true`. The caller joins with `/` before emitting. This
 *   is the documented "single segment with an array value" path — it
 *   applies to BOTH optional and required segments, even though the joined
 *   result may not round-trip through `match` (the default value charset
 *   does not include `/`). The asymmetry is intentional: arrays are a
 *   convenient way to build a multi-segment path segment-by-segment, and
 *   the caller knows what they are doing. Repeated values for a single
 *   segment are joined just like optional-segment arrays.
 * - Array + `totalOccurrences > 1`: the same name appears in multiple
 *   segments, so element `occurrenceIndex` is returned with
 *   `joinWithSlash: false`. If the index is past the end of the array, the
 *   last element is used as a fallback. This lets `/api/:ids/posts/:ids`
 *   correctly distribute `{ids: ['1', '2']}` across the two `:ids`
 *   captures (Bug 4 fix) instead of repeating the joined string for both
 *   positions.
 * @param {Object} values - User-provided values map
 * @param {string} name - Segment name to look up
 * @param {number} occurrenceIndex - Zero-based index of this segment among
 *   segments with the same name
 * @param {number} totalOccurrences - Total number of segments with this name
 * @returns {{ value: *, joinWithSlash: boolean }} The value and a flag
 */
const valueForOccurrence = (values, name, occurrenceIndex, totalOccurrences) => {
  const val = values[name];
  if (!Array.isArray(val)) return { value: val, joinWithSlash: false };
  if (totalOccurrences === 1) return { value: val, joinWithSlash: true };
  const element = occurrenceIndex < val.length
    ? val[occurrenceIndex]
    : val[val.length - 1];
  return { value: element, joinWithSlash: false };
};

/**
 * Compiles segments into a regex pattern
 * @param {Array<ParsedSegment>} segments - Parsed segments
 * @param {UrlPatternOptions} options - Options
 * @returns {{regex: string, segmentNames: Array<SegmentName>}} Compiled regex and segment names
 */
const compileRegex = (segments, options) => {
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
      const currentGroupId = segment.optionalGroupId;

      while (j < segments.length && segments[j].optional && segments[j].optionalGroupId === currentGroupId) {
        const seg = segments[j];
        
        if (seg.type === 'wildcard') {
          optionalPart += '(.*)';
          segmentNames.push({ name: options.wildcardName, index: groupIndex, type: 'wildcard' });
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
      segmentNames.push({ name: options.wildcardName, index: groupIndex, type: 'wildcard' });
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
  const { regex, segmentNames } = compileRegex(segments, mergedOptions);

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
  // Strip the `g` and `y` flags. The `g` flag makes `RegExp.prototype.exec`
  // advance `lastIndex` between calls, which would cause subsequent matches
  // to start from the wrong position. The `y` (sticky) flag requires a match
  // starting exactly at `lastIndex`, which is incompatible with our
  // anchored, single-match contract. Other flags (`i`, `m`, `s`, `d`, `u`)
  // are preserved.
  const safeFlags = regex.flags.replace(/[gy]/g, '');
  const regexObj = safeFlags === regex.flags
    ? regex
    : new RegExp(regex.source, safeFlags);

  return {
    regex: regex.source,
    regexObj,
    segments: [],
    segmentNames: keys.map((name, index) => ({ name, index, type: 'named' })),
    // Use a fresh copy of DEFAULT_OPTIONS rather than the shared reference.
    // The UrlPattern constructor freezes `compiled.options` for read-only
    // semantics; if we returned the shared global, freezing one pattern's
    // `compiled.options` would silently freeze the global for every other
    // pattern created afterwards.
    options: { ...DEFAULT_OPTIONS },
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
  // Guard against non-string input. `RegExp.prototype.exec` coerces with
  // String(), so `match(123)` would silently try to match "123" — almost
  // certainly not what the caller meant. Throw a TypeError so the misuse
  // surfaces immediately.
  if (typeof str !== 'string') {
    throw new TypeError(`pattern.match() requires a string, got ${typeof str}`);
  }

  const matchResult = compiled.regexObj.exec(str);
  
  if (!matchResult) {
    return null;
  }

  if (compiled.isRegex) {
    if (compiled.keys && compiled.keys.length > 0) {
      const result = {};
      compiled.keys.forEach((key, index) => {
        const val = matchResult[index + 1];
        // Undefined means the optional group didn't participate — omit the key
        // so this is consistent with string-pattern behaviour.
        if (val !== undefined) {
          result[key] = val;
        }
      });
      return result;
    }
    // No keys, no groups → return the captured values as an array. If the
    // regex had no capture groups, this is an empty array; we keep the
    // existing behaviour (documented in the README's regex example) rather
    // than coercing to `{}` and breaking callers that rely on the array.
    return matchResult.slice(1);
  }

  const result = {};
  const usedNames = new Set();

  // Track which segment names are wildcards so their empty-string captures survive
  // the cleanup loop. An empty wildcard result (e.g. '/files/*' on '/files/')
  // is a valid match result.
  const wildcardNames = new Set();
  for (const seg of compiled.segmentNames) {
    if (seg.type === 'wildcard') wildcardNames.add(seg.name);
  }

  for (let i = 0; i < compiled.segmentNames.length; i++) {
    const segInfo = compiled.segmentNames[i];
    const hasCapture = segInfo.index + 1 in matchResult;
    // When an optional group didn't participate, the regex returns undefined.
    // Normalize to '' so both non-isRegex and isRegex paths behave the same.
    const rawValue = hasCapture ? matchResult[segInfo.index + 1] : '';
    const value = rawValue === undefined ? '' : rawValue;

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

  // Delete empty-string entries, but preserve wildcards — an empty capture is
  // a valid match result for wildcards. Also clean null/undefined from arrays.
  for (const key in result) {
    const val = result[key];
    if (Array.isArray(val)) {
      // Filter out empty-string entries from arrays (but preserve wildcards).
      const filtered = val.filter(v => v !== '' || wildcardNames.has(key));
      if (filtered.length === 0) {
        delete result[key];
      } else {
        result[key] = filtered;
      }
    } else if (val === '' && !wildcardNames.has(key)) {
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

  // `Object.keys(values)` would throw on null; coerce to {} so the function
  // is robust against `stringify(null)` calls.
  const safeValues = values && typeof values === 'object' ? values : {};

  let result = '';
  let i = 0;

  const wildcardName = compiled.options.wildcardName;

  // Pre-count how many segments share each name. We need this to decide
  // how to interpret an array value: a single segment with the name joins
  // the array with `/` (documented optional-segment behaviour, see
  // "bug fix 10" / "bug fix 11" in the test suite); a name that appears
  // in multiple segments distributes element-by-element (Bug 4 fix).
  const nameTotalCounts = Object.create(null);
  for (const seg of compiled.segments) {
    if (seg.type === 'named') {
      nameTotalCounts[seg.name] = (nameTotalCounts[seg.name] || 0) + 1;
    } else if (seg.type === 'wildcard') {
      nameTotalCounts[wildcardName] = (nameTotalCounts[wildcardName] || 0) + 1;
    }
  }

  // Track how many times we've seen each segment name while walking the
  // segments. Combined with `nameTotalCounts`, this is what lets a pattern
  // like '/api/:ids/posts/:ids' distribute `{ids: ['1', '2']}` across the
  // two `:ids` captures.
  const nameOccurrence = Object.create(null);

  // Whether the user provided any values at all. Drives the "wipe literal-
  // only optional groups" decision (Bug 2): there is no value the user
  // can pass to "opt in" to a literal-only group, so when no values are
  // provided the minimal URL is generated.
  const hasAnyValue = Object.keys(safeValues).length > 0;

  while (i < compiled.segments.length) {
    const segment = compiled.segments[i];

    if (segment.optional) {
      let optionalPart = '';
      let groupWiped = false;
      const currentGroupId = segment.optionalGroupId;

      // Find the end of this optional group up front, so we can always
      // skip the whole group atomically — even when the inner loop breaks
      // early because a value in the middle of the group is missing.
      // Without this, a missing middle value would leave the trailing
      // segments of the same group to be emitted separately, producing
      // a URL that does not round-trip with `match` (Bug 3 fix).
      let groupEnd = i;
      while (groupEnd < compiled.segments.length
             && compiled.segments[groupEnd].optional
             && compiled.segments[groupEnd].optionalGroupId === currentGroupId) {
        groupEnd++;
      }

      let j = i;
      while (j < groupEnd) {
        const seg = compiled.segments[j];

        if (seg.type === 'literal') {
          // A literal-only optional group has no named/wildcard to drive
          // the inclusion decision. Wipe the group when no values were
          // provided at all (so the minimal URL is generated) and include
          // the literal otherwise.
          if (!hasAnyValue) {
            groupWiped = true;
            break;
          }
          optionalPart += seg.name;
        } else if (seg.type === 'named') {
          const nameCount = nameOccurrence[seg.name] || 0;
          const { value, joinWithSlash } = valueForOccurrence(
            safeValues, seg.name, nameCount, nameTotalCounts[seg.name] || 0
          );
          nameOccurrence[seg.name] = nameCount + 1;
          // For the single-segment case, valueForOccurrence returns the
          // raw array; join it with `/` to honour the documented
          // "non-empty array on optional segment is still joined with `/`"
          // behaviour. The joined result is then checked for emptiness so
          // a value like [''] or [null] wipes the group instead of
          // leaving a dangling separator (Bug 1 fix).
          const emitted = joinWithSlash ? value.join('/') : value;
          if (isAbsentValue(emitted)) {
            groupWiped = true;
            break;
          }
          optionalPart += emitted;
        } else if (seg.type === 'wildcard') {
          const nameCount = nameOccurrence[wildcardName] || 0;
          const { value, joinWithSlash } = valueForOccurrence(
            safeValues, wildcardName, nameCount, nameTotalCounts[wildcardName] || 0
          );
          nameOccurrence[wildcardName] = nameCount + 1;
          // Same rule as for named: single wildcard joins with `/`,
          // repeated wildcards distribute element-by-element.
          const emitted = joinWithSlash ? value.join('/') : value;
          if (isAbsentValue(emitted)) {
            groupWiped = true;
            break;
          }
          optionalPart += emitted;
        }

        j++;
      }

      if (!groupWiped && optionalPart !== '') {
        result += optionalPart;
      }

      // Always advance past the entire group, whether it was included or
      // wiped. This is the fix for the partial-wipe asymmetry (Bug 3).
      i = groupEnd;
      continue;
    }

    if (segment.type === 'literal') {
      result += segment.name;
    } else if (segment.type === 'named') {
      const nameCount = nameOccurrence[segment.name] || 0;
      const { value, joinWithSlash } = valueForOccurrence(
        safeValues, segment.name, nameCount, nameTotalCounts[segment.name] || 0
      );
      nameOccurrence[segment.name] = nameCount + 1;
      if (isAbsentValue(value)) {
        throw new Error(`Missing required value for segment: ${segment.name}`);
      }
      // Same handling as optional segments: a single required segment
      // with an array value joins the array with `/`. This matches the
      // documented optional-segment behaviour and keeps a consistent
      // interpretation of arrays across required and optional positions.
      // The resulting URL may not round-trip through `match` (the default
      // value charset does not include `/`) — that is the same
      // documented asymmetry that exists for optional segments.
      result += joinWithSlash ? value.join('/') : value;
    } else if (segment.type === 'wildcard') {
      const nameCount = nameOccurrence[wildcardName] || 0;
      const { value, joinWithSlash } = valueForOccurrence(
        safeValues, wildcardName, nameCount, nameTotalCounts[wildcardName] || 0
      );
      nameOccurrence[wildcardName] = nameCount + 1;
      // Empty string is a valid wildcard match result (e.g. '/files/*' on
      // '/files/') and should be allowed without throwing.
      if (value === undefined || value === null) {
        throw new Error('Missing required wildcard value');
      }
      // Same handling as optional wildcards: a single required wildcard
      // with an array value joins the array with `/`. See the named
      // comment above for the rationale.
      result += joinWithSlash ? value.join('/') : value;
    }

    i++;
  }

  return result;
};

/**
 * Recursively freezes an object and all of its non-RegExp children.
 *
 * `Object.freeze` is shallow — freezing `pattern.compiled` does not freeze
 * `pattern.compiled.segments` or any of the segment objects inside it, so
 * mutating them does not throw in strict mode and silently desyncs the
 * cached regex. This helper walks the structure and freezes every nested
 * object/array so the contract documented on `pattern.compiled` ("any
 * attempt to mutate it will throw in strict mode") actually holds.
 *
 * RegExp instances are skipped: freezing a RegExp makes its `lastIndex`
 * non-writable, which would break the match function.
 * @param {*} obj - Value to freeze in place
 * @param {WeakSet} [seen] - Already-visited objects (cycle protection)
 */
const deepFreeze = (obj, seen = new WeakSet()) => {
  if (obj === null || typeof obj !== 'object' || seen.has(obj)) return;
  if (Object.isFrozen(obj)) return;
  if (obj instanceof RegExp) return;
  seen.add(obj);
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key], seen);
  }
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
    // The compiled state is exposed as a read-only introspection field. Freeze
    // it deeply so accidental mutation throws in strict mode instead of
    // silently desynchronising the cached regex. `Object.freeze` is shallow, so
    // `deepFreeze` walks `segments`, `segmentNames`, `options`, and any other
    // nested objects/arrays. `regexObj` is a RegExp and is intentionally
    // skipped — freezing it would make `lastIndex` non-writable and break
    // `match`.
    deepFreeze(this.compiled);
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

exports.DEFAULT_OPTIONS = DEFAULT_OPTIONS;
exports.UrlPattern = UrlPattern;
exports.default = urlPattern;
exports.makePattern = makePattern;
exports.makePatternFromRegex = makePatternFromRegex;
exports.match = match;
exports.stringify = stringify;
exports.urlPattern = urlPattern;

module.exports = Object.assign(module.exports.default, module.exports);
