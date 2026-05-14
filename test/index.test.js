import { urlPattern, UrlPattern, makePattern, match, stringify } from '../src/index.js';

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
      expect(pattern.match('/v1.2/')).toEqual({ major: '1', minor: '2' });
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
      expect(pattern.match('/api/users')).toEqual({ resource: 'users', id: null });
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
});
