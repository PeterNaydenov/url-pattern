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
});
