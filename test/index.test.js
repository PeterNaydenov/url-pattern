import urlPatternDefault, { urlPattern, UrlPattern, makePattern, match, stringify } from '../src/main.js';

describe('url-pattern', () => {
  describe('basic named segments', () => {
    test('matches simple named segment', () => {
      const pattern = urlPattern('/api/users/:id');
      expect(pattern.match('/api/users/10')).toEqual({ id: '10' });
    });

    test('returns null on no match', () => {
      const pattern = urlPattern('/api/users/:id');
      expect(pattern.match('/api/products/5')).toBeNull();
    });

    test('matches multiple named segments', () => {
      const pattern = urlPattern('/api/users/:userId/posts/:postId');
      expect(pattern.match('/api/users/10/posts/5')).toEqual({ userId: '10', postId: '5' });
    });

    test('matches segment with numbers and letters', () => {
      const pattern = urlPattern('/api/:resource/:id');
      expect(pattern.match('/api/users/abc123')).toEqual({ resource: 'users', id: 'abc123' });
    });
  });

  describe('optional segments', () => {
    test('matches optional segment when present', () => {
      const pattern = urlPattern('/api/users(/:id)');
      expect(pattern.match('/api/users/10')).toEqual({ id: '10' });
    });

    test('matches optional segment when absent', () => {
      const pattern = urlPattern('/api/users(/:id)');
      expect(pattern.match('/api/users')).toEqual({});
    });

    test('matches optional segment with multiple params', () => {
      const pattern = urlPattern('/api(/:resource/:id)');
      expect(pattern.match('/api/users/10')).toEqual({ resource: 'users', id: '10' });
      expect(pattern.match('/api')).toEqual({});
    });
  });

  describe('wildcards', () => {
    test('matches wildcard', () => {
      const pattern = urlPattern('/api/*');
      const result = pattern.match('/api/users/10');
      expect(result._).toBe('users/10');
    });

    test('matches wildcard at end', () => {
      const pattern = urlPattern('/api/*/details');
      expect(pattern.match('/api/users/details')).toEqual({ _: 'users' });
    });

    test('matches only wildcard', () => {
      const pattern = urlPattern('*');
      expect(pattern.match('anything/goes/here')).toEqual({ _: 'anything/goes/here' });
    });
  });

  describe('mixed patterns', () => {
    test('combines named segments and wildcards', () => {
      const pattern = urlPattern('/v:major(.:minor)/*');
      expect(pattern.match('/v1.2/')).toEqual({ major: '1', minor: '2', _: '' });
      expect(pattern.match('/v2/users')).toEqual({ major: '2', _: 'users' });
      expect(pattern.match('/v/')).toBeNull();
    });

    test('complex URL pattern', () => {
      const pattern = urlPattern('/api/users/:id/posts/:postId');
      expect(pattern.match('/api/users/10/posts/5')).toEqual({ id: '10', postId: '5' });
    });
  });

  describe('stringify', () => {
    test('stringifies simple pattern', () => {
      const pattern = urlPattern('/api/users/:id');
      expect(pattern.stringify({ id: 10 })).toBe('/api/users/10');
    });

    test('stringifies optional segment without value', () => {
      const pattern = urlPattern('/api/users(/:id)');
      expect(pattern.stringify()).toBe('/api/users');
    });

    test('stringifies optional segment with value', () => {
      const pattern = urlPattern('/api/users(/:id)');
      expect(pattern.stringify({ id: 10 })).toBe('/api/users/10');
    });

    test('stringifies wildcard', () => {
      const pattern = urlPattern('/api/*');
      expect(pattern.stringify({ _: 'users/10' })).toBe('/api/users/10');
    });

    test('stringifies pattern with all parts', () => {
      const pattern = urlPattern('/v:major(.:minor)/*');
      expect(pattern.stringify({ major: '1', minor: '2', _: 'test' })).toBe('/v1.2/test');
      expect(pattern.stringify({ major: '2', _: 'users' })).toBe('/v2/users');
    });

    test('throws error for missing required value', () => {
      const pattern = urlPattern('/api/users/:id');
      expect(() => pattern.stringify()).toThrow('Missing required value for segment: id');
    });

    test('throws error for missing wildcard', () => {
      const pattern = urlPattern('/api/*');
      expect(() => pattern.stringify({})).toThrow('Missing required wildcard value');
    });
  });

  describe('regex patterns', () => {
    test('creates pattern from regex', () => {
      const pattern = urlPattern(/^\/api\/(.*)$/);
      expect(pattern.match('/api/users')).toEqual(['users']);
    });

    test('regex pattern with keys', () => {
      const pattern = urlPattern(/^\/api\/([^\/]+)(?:\/(\d+))?$/, ['resource', 'id']);
      // Unmatched optional groups are omitted — consistent with string-pattern behaviour.
      expect(pattern.match('/api/users')).toEqual({ resource: 'users' });
      expect(pattern.match('/api/users/5')).toEqual({ resource: 'users', id: '5' });
      expect(pattern.match('/api/users/foo')).toBeNull();
    });

    test('regex stringify throws error', () => {
      const pattern = urlPattern(/^\/api\/.*$/);
      expect(() => pattern.stringify()).toThrow('Cannot stringify a pattern created from regex');
    });
  });

  describe('customization options', () => {
    test('custom segment name start char', () => {
      const options = { segmentNameStartChar: '$' };
      const pattern = urlPattern('/api/$userId', options);
      expect(pattern.match('/api/123')).toEqual({ userId: '123' });
    });

    test('custom optional segment chars', () => {
      const options = {
        optionalSegmentStartChar: '[',
        optionalSegmentEndChar: ']'
      };
      const pattern = urlPattern('/api/users[/:id]', options);
      expect(pattern.match('/api/users/10')).toEqual({ id: '10' });
      expect(pattern.match('/api/users')).toEqual({});
    });

    test('custom wildcard char', () => {
      const options = { wildcardChar: '?' };
      const pattern = urlPattern('/api/?', options);
      expect(pattern.match('/api/anything')).toEqual({ _: 'anything' });
    });
  });

  describe('multiple segments with same name', () => {
    test('returns array for repeated segment names', () => {
      const pattern = urlPattern('/api/users/:ids/posts/:ids');
      expect(pattern.match('/api/users/10/posts/5')).toEqual({ ids: ['10', '5'] });
    });
  });

  describe('class API', () => {
    test('UrlPattern class works', () => {
      const pattern = new UrlPattern('/api/users/:id');
      expect(pattern.match('/api/users/10')).toEqual({ id: '10' });
    });
  });

  describe('functional exports', () => {
    test('makePattern function', () => {
      const compiled = makePattern('/api/:id');
      const result = match(compiled, '/api/10');
      expect(result).toEqual({ id: '10' });
    });

    test('stringify function', () => {
      const compiled = makePattern('/api/users/:id');
      expect(stringify(compiled, { id: '10' })).toBe('/api/users/10');
    });
  });

  // ----------------------------------------------------------------------
  // Regression tests for the bug-hunt pass.
  // Each describe block corresponds to one finding.
  // ----------------------------------------------------------------------

  describe('bug fix 1: segmentNameEndChar option', () => {
    test('README example parses brace-wrapped segment names', () => {
      const pattern = urlPattern('/user/{username}/post/{postId}', {
        segmentNameStartChar: '{',
        segmentNameEndChar: '}'
      });
      expect(pattern.match('/user/john/post/123')).toEqual({
        username: 'john',
        postId: '123'
      });
    });

    test('segmentNameEndChar stops at the end char, not at charset boundary', () => {
      const pattern = urlPattern('/x{user_id}', {
        segmentNameStartChar: '{',
        segmentNameEndChar: '}'
      });
      expect(pattern.match('/xjane')).toEqual({ user_id: 'jane' });
    });

    test('without segmentNameEndChar, parser falls back to charset-based termination', () => {
      // Override the optional end char so '}' is treated as a literal in this test.
      const pattern = urlPattern('/x{user-id}', {
        segmentNameStartChar: '{',
        optionalSegmentEndChar: '|'
      });
      // '-' is not in the default segmentNameCharset, so name stops before '-'
      // and '-id}' falls through as a literal suffix.
      expect(pattern.match('/xjane-id}')).toEqual({ user: 'jane' });
    });
  });

  describe('bug fix 2: default export is callable without `new`', () => {
    test('default export is the factory function', () => {
      // README documents `import urlPattern from '@peter.naydenov/url-pattern'`.
      // The default export must therefore be callable as a function.
      const pattern = urlPatternDefault('/api/users/:id');
      expect(pattern.match('/api/users/10')).toEqual({ id: '10' });
    });

    test('default export still produces a UrlPattern instance', () => {
      const pattern = urlPatternDefault('/api/users/:id');
      expect(pattern).toBeInstanceOf(UrlPattern);
    });
  });

  describe('bug fix 3: segmentValueCharset escaping', () => {
    test('custom charset is a list of explicit characters; range notation is not interpreted', () => {
      // 'a-zA-Z0-9-' is treated as the explicit chars a, z, A, Z, 0, 9 and '-'.
      // It is NOT a-z/A-Z/0-9 ranges.
      const pattern = urlPattern('/api/:id', {
        segmentValueCharset: 'a-zA-Z0-9-'
      });
      // 'foo-bar' contains 'f', 'o' which are not in the explicit list.
      expect(pattern.match('/api/foo-bar')).toBeNull();
      // Only the literal chars match.
      expect(pattern.match('/api/Az09-0')).toEqual({ id: 'Az09-0' });
    });

    test('regex-special ] inside the charset is escaped, not closing the class', () => {
      const pattern = urlPattern('/api/:id', {
        segmentValueCharset: 'a]'
      });
      expect(pattern.match('/api/foo]bar')).toBeNull();
      expect(pattern.match('/api/a]')).toEqual({ id: 'a]' });
    });

    test('regex-special ^ inside the charset is escaped, not negating the class', () => {
      const pattern = urlPattern('/api/:id', {
        segmentValueCharset: 'a^'
      });
      // Without escaping, ^ at the start of the class would negate it
      // (matching every char except 'a' and '^').
      expect(pattern.match('/api/a^')).toEqual({ id: 'a^' });
      // 'foo' has no chars in the explicit list, so no match.
      expect(pattern.match('/api/foo')).toBeNull();
    });

    test('backslash inside the charset is matched literally', () => {
      const pattern = urlPattern('/api/:id', {
        segmentValueCharset: 'a\\'
      });
      expect(pattern.match('/api/a\\')).toEqual({ id: 'a\\' });
    });

    test('default charset matches the documented characters including dash and underscore', () => {
      const pattern = urlPattern('/api/:id');
      expect(pattern.match('/api/foo-bar_baz')).toEqual({ id: 'foo-bar_baz' });
      expect(pattern.match('/api/a~b c%d')).toEqual({ id: 'a~b c%d' });
    });

    test('chars NOT in default charset are rejected', () => {
      const pattern = urlPattern('/api/:id');
      // '@' is not in the default charset; default must reject it.
      expect(pattern.match('/api/foo@bar')).toBeNull();
      // ';' is not in the default charset; default must reject it.
      expect(pattern.match('/api/foo;bar')).toBeNull();
    });
  });

  describe('bug fix 4: separate optional groups stay independent', () => {
    test('two side-by-side optional groups can be matched independently', () => {
      const pattern = urlPattern('/api(/:a)(/:b)');
      expect(pattern.match('/api/x')).toEqual({ a: 'x' });
      expect(pattern.match('/api/x/y')).toEqual({ a: 'x', b: 'y' });
      expect(pattern.match('/api')).toEqual({});
    });

    test('three side-by-side optional groups can be matched independently', () => {
      const pattern = urlPattern('/api(/:a)(/:b)(/:c)');
      expect(pattern.match('/api/x')).toEqual({ a: 'x' });
      expect(pattern.match('/api/x/y')).toEqual({ a: 'x', b: 'y' });
      expect(pattern.match('/api/x/y/z')).toEqual({ a: 'x', b: 'y', c: 'z' });
      expect(pattern.match('/api')).toEqual({});
    });

    test('stringify of separate optional groups with partial values', () => {
      const pattern = urlPattern('/api(/:a)(/:b)');
      expect(pattern.stringify({ a: 'x' })).toBe('/api/x');
      expect(pattern.stringify({ b: 'y' })).toBe('/api/y');
      expect(pattern.stringify({ a: 'x', b: 'y' })).toBe('/api/x/y');
      expect(pattern.stringify({})).toBe('/api');
    });
  });

  describe('bug fix 5: trailing colon throws a clear error', () => {
    test('trailing segmentNameStartChar throws', () => {
      expect(() => urlPattern('/api/:')).toThrow(/segment name/i);
    });

    test('segmentNameStartChar followed only by a non-charset char throws', () => {
      expect(() => urlPattern('/api/:-')).toThrow(/segment name/i);
    });
  });

  describe('bug fix 6: unclosed or mismatched parens throw', () => {
    test('unclosed optionalSegmentStartChar throws', () => {
      expect(() => urlPattern('/api(/:foo')).toThrow(/unclosed/i);
    });

    test('unmatched optionalSegmentEndChar throws', () => {
      expect(() => urlPattern('/api/)foo')).toThrow(/unmatched/i);
    });
  });

  describe('bug fix 7: underscore is allowed in segment names by default', () => {
    test('pattern with underscore in the segment name matches', () => {
      const pattern = urlPattern('/api/:user_id');
      expect(pattern.match('/api/john')).toEqual({ user_id: 'john' });
    });

    test('segmentNameCharset default still rejects dash in the name position', () => {
      // Name parsing stops at '-' (not in default name charset) and the
      // rest of the pattern is treated as a literal, so the name captured
      // here is 'foo', and the input must satisfy the trailing '-bar'
      // literal after the captured value.
      const pattern = urlPattern('/api/:foo-bar');
      // The captured value is 'value'; '-bar' is consumed by the literal suffix.
      expect(pattern.match('/api/value-bar')).toEqual({ foo: 'value' });
      // Without the trailing '-bar', the literal suffix fails and there is no match.
      expect(pattern.match('/api/value')).toBeNull();
    });
  });

  describe('bug fix 8: wildcard result key is `_`, not `*`', () => {
    test('README example produces an object with the documented `_` key', () => {
      const pattern = urlPattern('/files/*');
      expect(pattern.match('/files/images/photo.jpg')).toEqual({
        _: 'images/photo.jpg'
      });
    });
  });

  describe('bug fix 9: documented default charsets match source defaults', () => {
    test('default segmentNameCharset accepts alphanumerics and underscore', () => {
      const pattern = urlPattern('/api/:Foo_Bar9');
      expect(pattern.match('/api/anything')).toEqual({ Foo_Bar9: 'anything' });
    });

    test('default segmentValueCharset accepts dash, underscore, tilde, space, percent', () => {
      const pattern = urlPattern('/api/:id');
      expect(pattern.match('/api/a-b_c~d e%f')).toEqual({ id: 'a-b_c~d e%f' });
    });
  });

  describe('bug fix 10: stringify treats empty array as missing for optional segments', () => {
    test('empty array on optional segment is omitted entirely', () => {
      const pattern = urlPattern('/api/users(/:ids)');
      expect(pattern.stringify({ ids: [] })).toBe('/api/users');
    });

    test('non-empty array on optional segment is still joined with `/`', () => {
      const pattern = urlPattern('/api/users(/:ids)');
      expect(pattern.stringify({ ids: ['x', 'y'] })).toBe('/api/users/x/y');
    });

    test('empty array on required segment still throws', () => {
      const pattern = urlPattern('/api/:ids');
      expect(() => pattern.stringify({ ids: [] })).toThrow(/required value/i);
    });
  });

  describe('bug fix 11: documented match/stringify asymmetry for arrays on a single optional', () => {
    // The match side never produces a `/` inside a single named segment, so
    // an array value joined with `/` during stringify cannot round-trip.
    // This test pins the current behavior so future refactors notice it.
    test('array on a single optional: stringify produces, match rejects', () => {
      const pattern = urlPattern('/api(/:ids)');
      const url = pattern.stringify({ ids: ['x', 'y'] });
      expect(url).toBe('/api/x/y');
      expect(pattern.match(url)).toBeNull();
    });
  });

  describe('bug fix 12: wildcard match returns empty string instead of undefined for empty suffix', () => {
    test('wildcard on trailing slash matches empty suffix', () => {
      const pattern = urlPattern('/files/*');
      expect(pattern.match('/files/')).toEqual({ _: '' });
    });

    test('wildcard with content still works', () => {
      const pattern = urlPattern('/files/*');
      expect(pattern.match('/files/img/photo.jpg')).toEqual({ _: 'img/photo.jpg' });
    });

    test('wildcard alone matches anything including empty', () => {
      const pattern = urlPattern('*');
      expect(pattern.match('')).toEqual({ _: '' });
      expect(pattern.match('anything')).toEqual({ _: 'anything' });
    });
  });

  describe('bug fix 13: escape char behaves correctly at pattern boundaries', () => {
    test('trailing escape throws — nothing follows the backslash to escape', () => {
      expect(() => urlPattern('/:a\\')).toThrow(/has nothing to escape/i);
    });

    test('backslash before a non-regex-metachar is a literal backslash (not an escape)', () => {
      // '\)' — ')' is not a regex metachar, so '\' is treated as a literal character
      // and ')' is processed normally. This allows escaping literal parens
      // inside optional groups without swallowing the group close delimiter.
      const pattern = urlPattern('/:a\\)');
      expect(pattern.match('/x)')).toEqual({ a: 'x' });
    });

    test('backslash before a regex metachar is an escape', () => {
      const pattern = urlPattern('/:id\\.json');
      expect(pattern.match('/foo.json')).toEqual({ id: 'foo' });
    });

    test('backslash before a non-regex-metachar becomes a literal backslash', () => {
      // '\' is a regex metachar, so '\:' tries to escape ':'. ':' is NOT a
      // regex metachar (it has no special meaning in regex), so the escape
      // is dropped and '\' is pushed as a literal character, then ':b'
      // parses normally as a second named segment.
      const pattern = urlPattern('/:a\\:b');
      expect(pattern.match('/x\\y')).toEqual({ a: 'x', b: 'y' });
    });
  });

  describe('bug fix 14: regex optional groups return null instead of omitting unmatched keys', () => {
    test('regex pattern with unmatched optional group omits the key', () => {
      // When a pattern is created from a regex, an unmatched optional group
      // used to return null for that key (e.g. {id: null}). Now it omits
      // the key, consistent with string-pattern behaviour.
      const pattern = urlPattern(/^\/api\/([^\/]+)(?:\/(\d+))?$/, ['resource', 'id']);
      expect(pattern.match('/api/users')).toEqual({ resource: 'users' });
      expect(pattern.match('/api/users/5')).toEqual({ resource: 'users', id: '5' });
    });

    test('string and regex versions of the same optional pattern produce identical results', () => {
      const stringPattern = urlPattern('/api(/:id)');
      const regexPattern = urlPattern(
        stringPattern.compiled.regexObj,
        stringPattern.compiled.segmentNames.map(s => s.name)
      );
      expect(regexPattern.match('/api')).toEqual(stringPattern.match('/api'));
      expect(regexPattern.match('/api/10')).toEqual(stringPattern.match('/api/10'));
    });

    test('partial optional groups: both string and regex versions agree', () => {
      const stringPattern = urlPattern('/:a(.:b)');
      const regexPattern = urlPattern(
        stringPattern.compiled.regexObj,
        stringPattern.compiled.segmentNames.map(s => s.name)
      );
      expect(regexPattern.match('/x')).toEqual(stringPattern.match('/x'));
      expect(regexPattern.match('/x.y')).toEqual(stringPattern.match('/x.y'));
    });

    test('duplicate optional groups with same name: null entries are omitted from arrays', () => {
      // When two optional groups share the same name and only one participates,
      // the result should be an array with just the matched value — not a null.
      const pattern = urlPattern('/api(/:a)(/:a)');
      expect(pattern.match('/api/x')).toEqual({ a: ['x'] });
      expect(pattern.match('/api/x/y')).toEqual({ a: ['x', 'y'] });
      expect(pattern.match('/api')).toEqual({});
    });
  });

  // ----------------------------------------------------------------------
  // Quality-of-life follow-ups.
  // ----------------------------------------------------------------------

  describe('wildcardName option', () => {
    test('match stores wildcard value under the custom key', () => {
      const pattern = urlPattern('/api/:id/files/*', { wildcardName: 'rest' });
      expect(pattern.match('/api/42/files/a/b')).toEqual({ id: '42', rest: 'a/b' });
    });

    test('stringify reads wildcard value from the custom key', () => {
      const pattern = urlPattern('/api/:id/files/*', { wildcardName: 'rest' });
      expect(pattern.stringify({ id: '42', rest: 'a/b' })).toBe('/api/42/files/a/b');
    });

    test('custom wildcard name avoids collision with a named `_` segment', () => {
      const pattern = urlPattern('/api/:_/files/*', { wildcardName: 'rest' });
      // Without the option, both `:_` and `*` would land on key `_` and merge
      // into an array. With the option, they live on separate keys.
      expect(pattern.match('/api/jane/files/a/b')).toEqual({
        _: 'jane',
        rest: 'a/b'
      });
    });

    test('wildcard key change applies to optional groups too', () => {
      const pattern = urlPattern('/files(/*)', { wildcardName: 'rest' });
      expect(pattern.match('/files/images/photo.jpg')).toEqual({ rest: 'images/photo.jpg' });
      // Empty wildcard is a valid match result (mirrors the default-key
      // behaviour tested in `bug fix 12`).
      expect(pattern.match('/files/')).toEqual({ rest: '' });
    });

    test('custom wildcard name used in stringify error message', () => {
      const pattern = urlPattern('/api/*', { wildcardName: 'rest' });
      expect(() => pattern.stringify({})).toThrow('Missing required wildcard value');
    });
  });

  describe('escapeChar option', () => {
    test('custom escape char is honoured', () => {
      const pattern = urlPattern('/files/%*', { escapeChar: '%' });
      // '%*' escapes the wildcard char so a literal `*` is matched.
      expect(pattern.match('/files/*')).toEqual({});
    });

    test('default escape char still works (regression)', () => {
      const pattern = urlPattern('/files/\\*');
      expect(pattern.match('/files/*')).toEqual({});
    });

    test('custom escape char followed by a non-regex-metachar is kept as a literal', () => {
      // '%:' is the custom escape char '%' followed by ':' (not a regex
      // metachar). The escape char must be kept as a literal, and ':'
      // is then processed normally as the start of a named segment.
      // Before the fix, the LITERAL branch hardcoded `\` regardless of
      // the configured escapeChar — so '%' was silently dropped and the
      // next char was treated as a `\`-prefixed literal `:`.
      const pattern = urlPattern('/foo%:bar', { escapeChar: '%' });
      expect(pattern.match('/foo%bar')).toEqual({ bar: 'bar' });
      // The literal in the compiled segment is the actual escape char,
      // not a hardcoded backslash.
      const literalSegment = pattern.compiled.segments.find(
        (s) => s.type === 'literal' && s.name.length === 1
      );
      expect(literalSegment).toBeDefined();
      expect(literalSegment.name).toBe('%');
    });

    test('custom escape char in stringify produces the configured char, not a backslash', () => {
      const pattern = urlPattern('/foo%:bar', { escapeChar: '%' });
      expect(pattern.stringify({ bar: 'baz' })).toBe('/foo%baz');
    });

    test('custom escape char followed by a non-metachar letter is kept as a literal', () => {
      // '%a' is the escape char '%' followed by 'a' (not a metachar).
      // The escape char must remain in the pattern.
      const pattern = urlPattern('/foo%a:bar', { escapeChar: '%' });
      expect(pattern.match('/foo%abar')).toEqual({ bar: 'bar' });
      expect(pattern.stringify({ bar: 'baz' })).toBe('/foo%abaz');
    });

    test('trailing custom escape char error mentions the actual escape char', () => {
      // The error message must reflect the configured escapeChar, not
      // always say `\`. This is a small UX fix.
      expect(() => urlPattern('/foo%', { escapeChar: '%' })).toThrow(/%/);
      // Default escape char still mentions `\` in the error.
      expect(() => urlPattern('/foo\\')).toThrow(/\\/);
    });
  });

  describe('wildcard empty string in stringify', () => {
    test('stringify of required wildcard with empty string is allowed', () => {
      const pattern = urlPattern('/files/*');
      expect(pattern.stringify({ _: '' })).toBe('/files/');
    });

    test('stringify of optional wildcard with empty string is still allowed', () => {
      const pattern = urlPattern('/files(/*)');
      // Empty string is considered "absent" by isAbsentValue, so the
      // optional group is wiped — that's the documented behaviour.
      expect(pattern.stringify({ _: '' })).toBe('/files');
    });
  });

  describe('pattern.compiled shape', () => {
    test('exposes the documented fields for a string pattern', () => {
      const pattern = urlPattern('/api/:id');
      expect(pattern.compiled).toBeDefined();
      expect(typeof pattern.compiled.regex).toBe('string');
      expect(pattern.compiled.regexObj).toBeInstanceOf(RegExp);
      expect(Array.isArray(pattern.compiled.segments)).toBe(true);
      expect(Array.isArray(pattern.compiled.segmentNames)).toBe(true);
      expect(pattern.compiled.options).toBeDefined();
      expect(pattern.compiled.isRegex).toBe(false);
      expect(pattern.compiled.pattern).toBe('/api/:id');
    });

    test('exposes the documented fields for a regex pattern', () => {
      const pattern = new UrlPattern(/^\/api\/(\d+)$/, ['id']);
      expect(pattern.compiled.isRegex).toBe(true);
      expect(Array.isArray(pattern.compiled.keys)).toBe(true);
      expect(pattern.compiled.keys).toEqual(['id']);
    });

    test('compiled object is frozen (mutating throws in strict mode)', () => {
      'use strict';
      const pattern = urlPattern('/api/:id');
      expect(Object.isFrozen(pattern.compiled)).toBe(true);
      expect(() => {
        pattern.compiled.regex = 'mutated';
      }).toThrow();
    });
  });

  describe('class API with regex and keys', () => {
    test('new UrlPattern accepts regex with keys array', () => {
      const pattern = new UrlPattern(/^\/api\/([^\/]+)$/, ['resource']);
      expect(pattern.match('/api/users')).toEqual({ resource: 'users' });
      expect(pattern.match('/api/users/extra')).toBeNull();
    });
  });

  // ----------------------------------------------------------------------
  // Edge-case hardening.
  // ----------------------------------------------------------------------

  describe('regex flag handling', () => {
    test('g flag in user regex does not leak lastIndex between matches', () => {
      // Before the fix, the second call returned null because exec() advanced
      // lastIndex past the input. Now the g flag is stripped on compile.
      const pattern = urlPattern(/foo (\d+)/g, ['num']);
      expect(pattern.match('foo 1')).toEqual({ num: '1' });
      expect(pattern.match('foo 2')).toEqual({ num: '2' });
      expect(pattern.match('foo 3')).toEqual({ num: '3' });
    });

    test('y (sticky) flag in user regex is stripped', () => {
      // y requires a match at lastIndex — incompatible with our anchored use.
      const pattern = urlPattern(/foo (\d+)/y, ['num']);
      expect(pattern.match('foo 1')).toEqual({ num: '1' });
      expect(pattern.match('foo 1')).toEqual({ num: '1' });
    });

    test('i flag is preserved', () => {
      const pattern = urlPattern(/FOO/i);
      expect(pattern.match('foo')).not.toBeNull();
      expect(pattern.match('FOO')).not.toBeNull();
    });

    test('original regex object is left untouched (flags not mutated)', () => {
      const original = /foo/g;
      urlPattern(original, []);
      expect(original.flags).toBe('g');
    });
  });

  describe('match() input validation', () => {
    test('throws TypeError on non-string input', () => {
      const pattern = urlPattern('/api/:id');
      expect(() => pattern.match(123)).toThrow(TypeError);
      expect(() => pattern.match(null)).toThrow(TypeError);
      expect(() => pattern.match(undefined)).toThrow(TypeError);
      expect(() => pattern.match({})).toThrow(TypeError);
      expect(() => pattern.match([])).toThrow(TypeError);
    });

    test('error message mentions the actual type received', () => {
      const pattern = urlPattern('/api/:id');
      expect(() => pattern.match(123)).toThrow(/string/);
    });
  });

  describe('deep-freeze of compiled.options', () => {
    test('compiled.options is frozen', () => {
      const pattern = urlPattern('/api/:id');
      expect(Object.isFrozen(pattern.compiled.options)).toBe(true);
    });

    test('mutating compiled.options throws in strict mode', () => {
      'use strict';
      const pattern = urlPattern('/api/:id');
      expect(() => {
        pattern.compiled.options.escapeChar = '%';
      }).toThrow();
    });
  });

  // ----------------------------------------------------------------------
  // Build / packaging.
  // ----------------------------------------------------------------------

  describe('CJS dist file', () => {
    // The CJS dist file must be loadable via require() even though the
    // package's package.json has "type": "module". Previously the file was
    // named url-pattern.cjs.js which Node treated as ESM (because of the
    // .js extension), causing require() to fail and the named exports to
    // come back as undefined.
    test('require() returns a usable module with named exports', () => {
      const { execSync } = require('node:child_process');
      const result = execSync(
        `node -e "const m = require('@peter.naydenov/url-pattern'); ` +
        `process.stdout.write(JSON.stringify({ ` +
        `  isFn: typeof m === 'function', ` +
        `  hasUrlPattern: typeof m.UrlPattern, ` +
        `  hasFactory: typeof m.urlPattern, ` +
        `  canConstruct: (() => { try { new m.UrlPattern('/api/:id'); return true; } catch { return false; } })() ` +
        `}));"`,
        { cwd: process.cwd(), encoding: 'utf-8' }
      );
      const parsed = JSON.parse(result);
      expect(parsed.isFn).toBe(true);
      expect(parsed.hasUrlPattern).toBe('function');
      expect(parsed.hasFactory).toBe('function');
      expect(parsed.canConstruct).toBe(true);
    });

    test('dist file uses .cjs extension (not .cjs.js) to avoid ESM loading', () => {
      const fs = require('node:fs');
      const path = require('node:path');
      const cjsPath = path.join(process.cwd(), 'dist', 'url-pattern.cjs');
      const badPath = path.join(process.cwd(), 'dist', 'url-pattern.cjs.js');
      expect(fs.existsSync(cjsPath)).toBe(true);
      expect(fs.existsSync(badPath)).toBe(false);
    });
  });

  describe('package entry points', () => {
    // The source is the primary entry. ESM consumers and bundlers should
    // resolve to src/main.js directly, not to a transpiled dist artifact.
    // CJS consumers still get the pre-built dist/url-pattern.cjs.
    test('ESM import resolves to src/main.js', () => {
      const { execSync } = require('node:child_process');
      const result = execSync(
        `node --input-type=module -e "const u = await import.meta.resolve('@peter.naydenov/url-pattern'); ` +
        `process.stdout.write(u);"`,
        { cwd: process.cwd(), encoding: 'utf-8' }
      );
      expect(result).toMatch(/src\/main\.js$/);
    });

    test('CJS require resolves to dist/url-pattern.cjs', () => {
      const result = require.resolve('@peter.naydenov/url-pattern');
      expect(result).toMatch(/dist\/url-pattern\.cjs$/);
    });

    test('package.json main field points to src', () => {
      const fs = require('node:fs');
      const path = require('node:path');
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
      expect(pkg.main).toBe('./src/main.js');
      expect(pkg.module).toBe('./src/main.js');
      expect(pkg.exports['.'].import).toBe('./src/main.js');
      expect(pkg.exports['.'].default).toBe('./src/main.js');
      expect(pkg.exports['.'].require).toBe('./dist/url-pattern.cjs');
    });

    test('CHANGELOG.md is in the published files list (case-sensitive)', () => {
      // On Linux (the npm registry's filesystem), the old npmignore entry
      // `!Changelog.md` did not match the actual file `CHANGELOG.md`, so the
      // changelog was silently excluded from the published tarball. Lock
      // in the fix by checking the files array and the npmignore entry.
      const fs = require('node:fs');
      const path = require('node:path');
      const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
      const npmignore = fs.readFileSync(path.join(process.cwd(), '.npmignore'), 'utf-8');
      expect(pkg.files).toContain('CHANGELOG.md');
      expect(npmignore).toMatch(/!CHANGELOG\.md/);
      expect(npmignore).not.toMatch(/!Changelog\.md/);
    });

    test('npm pack includes the changelog and the source', () => {
      // Use --dry-run to avoid creating an actual tarball.
      const { execSync } = require('node:child_process');
      const result = execSync('npm pack --dry-run 2>&1', { cwd: process.cwd(), encoding: 'utf-8' });
      expect(result).toMatch(/CHANGELOG\.md/);
      expect(result).toMatch(/src\/main\.js/);
    });
  });

  // ----------------------------------------------------------------------
  // Shared-state isolation.
  // ----------------------------------------------------------------------

  describe('per-pattern option isolation', () => {
    // The UrlPattern constructor freezes `compiled.options` for read-only
    // semantics. For a regex pattern, the compiled options were previously
    // a reference to the global DEFAULT_OPTIONS, so freezing one pattern
    // would silently freeze the default for every other pattern created
    // afterwards.
    test('freezing a regex pattern does not freeze the global DEFAULT_OPTIONS', () => {
      'use strict';
      // The shared DEFAULT_OPTIONS object is exported as a named export
      // (for introspection). Before the fix, freezing the first regex
      // pattern's compiled.options would also freeze DEFAULT_OPTIONS,
      // breaking any consumer that imported it.
      const { DEFAULT_OPTIONS } = require('../src/main.js');
      // Create a regex pattern first; its constructor freezes its compiled.options.
      const _r = urlPattern(/foo/, ['name']);
      // The global should still be mutable.
      expect(() => {
        DEFAULT_OPTIONS.segmentNameCharset = 'abc';
      }).not.toThrow();
      // The string pattern's merged options should also be mutable? No —
      // per the design, each pattern's compiled.options is frozen. So we
      // don't assert that. We only assert the shared global is not frozen.
      expect(Object.isFrozen(DEFAULT_OPTIONS)).toBe(false);
    });

    test('regex pattern gets a fresh copy of DEFAULT_OPTIONS, not the shared reference', () => {
      const r1 = urlPattern(/foo/, []);
      const r2 = urlPattern(/bar/, []);
      expect(r1.compiled.options).not.toBe(r2.compiled.options);
    });

    test('string patterns still get independent options (regression check)', () => {
      const s1 = urlPattern('/a');
      const s2 = urlPattern('/b');
      expect(s1.compiled.options).not.toBe(s2.compiled.options);
    });
  });

  // ----------------------------------------------------------------------
  // Stringify round-trip fixes.
  // Each describe block corresponds to one of the round-trip bugs found
  // after the 1.0.6 release: stringify used to produce URLs that did not
  // match the originating pattern. See CHANGELOG for details.
  // ----------------------------------------------------------------------

  describe('stringify bug 1: array with empty elements on optional named segment', () => {
    // An array of only empty/null/undefined strings used to be treated as
    // "present" and joined to '' — but the literal `/` separator in the
    // group had already been appended, so the produced URL ended with a
    // dangling slash and no value, which `match` then rejected.
    test('stringify([\"\"]) on optional wipes the group', () => {
      const pattern = urlPattern('/api(/:ids)');
      expect(pattern.stringify({ ids: [''] })).toBe('/api');
      expect(pattern.match('/api')).toEqual({});
    });

    test('stringify([null]) on optional wipes the group', () => {
      const pattern = urlPattern('/api(/:ids)');
      expect(pattern.stringify({ ids: [null] })).toBe('/api');
    });

    test('stringify([undefined]) on optional wipes the group', () => {
      const pattern = urlPattern('/api(/:ids)');
      expect(pattern.stringify({ ids: [undefined] })).toBe('/api');
    });

    test('non-empty array on optional still joins with `/` (regression)', () => {
      // The single-segment case with an array is documented to join with
      // `/`. The fix only changes behaviour for arrays that join to empty.
      const pattern = urlPattern('/api/users(/:ids)');
      expect(pattern.stringify({ ids: ['x', 'y'] })).toBe('/api/users/x/y');
    });
  });

  describe('stringify bug 2: literal-only optional groups', () => {
    // A group that contains only literal segments has no named/wildcard
    // to drive the inclusion decision. Before the fix, `stringify({})`
    // for `/api(/v)` still produced `/api/v` because the literal was
    // always appended. The new rule: when no values are provided, the
    // minimal URL is generated, so literal-only groups are wiped.
    test('stringify({}) wipes a literal-only optional group', () => {
      const pattern = urlPattern('/api(/v)');
      expect(pattern.stringify({})).toBe('/api');
      expect(pattern.match('/api')).toEqual({});
    });

    test('stringify() with no args also wipes literal-only groups', () => {
      const pattern = urlPattern('/api(/v)');
      expect(pattern.stringify()).toBe('/api');
    });

    test('literal-only group is included when other values are provided', () => {
      // When the user IS providing values (e.g. for a sibling segment),
      // we have no way to know whether the literal-only group should be
      // included or not. The choice is: include it (current behaviour
      // for groups with named). Document the choice here so a future
      // refactor doesn't silently change it.
      const pattern = urlPattern('/api(/v/:id)');
      expect(pattern.stringify({ id: 'x' })).toBe('/api/v/x');
    });
  });

  describe('stringify bug 3: optional groups are atomic', () => {
    // The inner loop used to `break` at the first missing value, but
    // the outer loop then continued processing the remaining segments in
    // the same group. That made a missing value in the middle of a group
    // emit a half-baked URL (e.g. `/api/a/b` for `/api(/:id/*)` when
    // only `_` was provided) that `match` could not reproduce.
    test('missing named in the middle of a group wipes the whole group', () => {
      const pattern = urlPattern('/api(/:id/*)');
      expect(pattern.stringify({ _: 'a/b' })).toBe('/api');
    });

    test('missing wildcard in the middle of a group wipes the whole group', () => {
      const pattern = urlPattern('/api(/*/:id)');
      expect(pattern.stringify({ id: 'x' })).toBe('/api');
    });

    test('group with all values provided round-trips through match', () => {
      const pattern = urlPattern('/api(/:a/*/:b)');
      const url = pattern.stringify({ a: 'x', b: 'y', _: 'z' });
      expect(url).toBe('/api/x/z/y');
      expect(pattern.match(url)).toEqual({ a: 'x', _: 'z', b: 'y' });
    });

    test('missing trailing value still wipes the whole group', () => {
      const pattern = urlPattern('/api(/:a/:b)');
      expect(pattern.stringify({ a: 'x' })).toBe('/api');
    });
  });

  describe('stringify bug 4: array distributes across repeated segment names', () => {
    // `/api/:ids/posts/:ids` with `{ids: '1/2'}` used to produce
    // `/api/1/2/posts/1/2` (same joined string for both positions).
    // Now an array distributes element-by-element, and a non-array value
    // is reused (backward-compatible).
    test('array distributes across two occurrences', () => {
      const pattern = urlPattern('/api/:ids/posts/:ids');
      expect(pattern.stringify({ ids: ['1', '2'] })).toBe('/api/1/posts/2');
    });

    test('array distributes across three occurrences', () => {
      const pattern = urlPattern('/:a/:a/:a');
      expect(pattern.stringify({ a: ['x', 'y', 'z'] })).toBe('/x/y/z');
    });

    test('non-array value is reused across occurrences (backward compat)', () => {
      const pattern = urlPattern('/api/:ids/posts/:ids');
      expect(pattern.stringify({ ids: 'x' })).toBe('/api/x/posts/x');
    });

    test('shorter array falls back to the last element', () => {
      const pattern = urlPattern('/api/:a/:a/:a');
      expect(pattern.stringify({ a: ['x'] })).toBe('/api/x/x/x');
    });

    test('array distributes across repeated wildcards too', () => {
      const pattern = urlPattern('/api/*/posts/*');
      expect(pattern.stringify({ _: ['a', 'b'] })).toBe('/api/a/posts/b');
    });

    test('round-trip: match result fed back into stringify', () => {
      // The match side already returns an array for repeated names, so
      // feeding the match result back into stringify should now reproduce
      // the same URL. Before the fix, the joined string was used for both
      // positions and round-tripping was impossible.
      const pattern = urlPattern('/api/:ids/posts/:ids');
      const matched = pattern.match('/api/1/posts/2');
      expect(matched).toEqual({ ids: ['1', '2'] });
      expect(pattern.stringify(matched)).toBe('/api/1/posts/2');
    });
  });

  describe('stringify bug 5: required single segment joins array with `/` (matches optional behaviour)', () => {
    // `/api/:id` with `{id: ['a', 'b']}` produces `/api/a/b`. This is
    // the same documented asymmetry that exists for optional segments
    // (see the "non-empty array on optional segment is still joined with
    // `/`" test) — the match side rejects `/` because it is not in the
    // default value charset. The behaviour is consistent across required
    // and optional positions; we just document it here for required so
    // a future refactor cannot silently change one without the other.
    test('required named segment joins array with `/`', () => {
      const pattern = urlPattern('/api/:id');
      expect(pattern.stringify({ id: ['a', 'b'] })).toBe('/api/a/b');
    });

    test('required wildcard joins array with `/`', () => {
      const pattern = urlPattern('/api/*');
      expect(pattern.stringify({ _: ['a', 'b'] })).toBe('/api/a/b');
    });

    test('required named still accepts a string (regression)', () => {
      const pattern = urlPattern('/api/:id');
      expect(pattern.stringify({ id: 'a' })).toBe('/api/a');
    });

    test('required named still throws on missing string (regression)', () => {
      const pattern = urlPattern('/api/:id');
      expect(() => pattern.stringify({})).toThrow(/Missing required value/);
    });

    test('required named still throws on empty array (regression)', () => {
      // Empty array is "absent" and the existing throw still applies.
      const pattern = urlPattern('/api/:id');
      expect(() => pattern.stringify({ id: [] })).toThrow(/Missing required value/);
    });

    test('required named still throws on null (regression)', () => {
      const pattern = urlPattern('/api/:id');
      expect(() => pattern.stringify({ id: null })).toThrow(/Missing required value/);
    });
  });

  describe('stringify robustness: null/undefined values argument', () => {
    // `Object.keys(null)` throws. The function coerces non-object inputs
    // to {} so the documented "no values provided" path still works.
    test('stringify(null) does not throw', () => {
      const pattern = urlPattern('/api/:id');
      expect(() => pattern.stringify(null)).toThrow(/Missing required value/);
    });
  });

  // ----------------------------------------------------------------------
  // Deep-freeze of the compiled object.
  // The 1.0.4 release froze `compiled` and `compiled.options` so accidental
  // mutation would throw in strict mode. But `Object.freeze` is shallow,
  // and `compiled.segments` / `compiled.segmentNames` and the objects
  // inside them were left mutable — so mutating them in strict mode did
  // not throw and could silently desync the cached regex.
  // ----------------------------------------------------------------------

  describe('deep-freeze of compiled', () => {
    test('compiled.segments is frozen', () => {
      const pattern = urlPattern('/api/:id');
      expect(Object.isFrozen(pattern.compiled.segments)).toBe(true);
    });

    test('compiled.segmentNames is frozen', () => {
      const pattern = urlPattern('/api/:id');
      expect(Object.isFrozen(pattern.compiled.segmentNames)).toBe(true);
    });

    test('individual segment objects are frozen', () => {
      const pattern = urlPattern('/api/:id');
      expect(Object.isFrozen(pattern.compiled.segments[0])).toBe(true);
      expect(Object.isFrozen(pattern.compiled.segments[1])).toBe(true);
    });

    test('individual segmentName objects are frozen', () => {
      const pattern = urlPattern('/api/:id');
      expect(Object.isFrozen(pattern.compiled.segmentNames[0])).toBe(true);
    });

    test('regex pattern keys array is also frozen', () => {
      const pattern = urlPattern(/^foo\$/, ['name']);
      expect(Object.isFrozen(pattern.compiled.keys)).toBe(true);
    });

    test('mutating compiled.segments.push throws in strict mode', () => {
      'use strict';
      const pattern = urlPattern('/api/:id');
      expect(() => {
        pattern.compiled.segments.push({
          type: 'literal', name: 'X', regex: 'X', optional: false
        });
      }).toThrow();
    });

    test('mutating compiled.segments[i].name throws in strict mode', () => {
      'use strict';
      const pattern = urlPattern('/api/:id');
      expect(() => {
        pattern.compiled.segments[0].name = 'MUTATED';
      }).toThrow();
    });

    test('mutating compiled.segmentNames.push throws in strict mode', () => {
      'use strict';
      const pattern = urlPattern('/api/:id');
      expect(() => {
        pattern.compiled.segmentNames.push({ name: 'X', index: 99, type: 'named' });
      }).toThrow();
    });

    test('regexObj is not frozen (would break lastIndex writes)', () => {
      // RegExp instances are intentionally skipped by the deep-freeze:
      // freezing a RegExp would make its `lastIndex` non-writable and
      // break the match function on subsequent calls.
      const pattern = urlPattern(/^foo\$/, []);
      expect(Object.isFrozen(pattern.compiled.regexObj)).toBe(false);
    });
  });
});
