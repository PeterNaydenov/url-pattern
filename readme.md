# URL Pattern (@peter.naydenov/url-pattern)

[![version](https://img.shields.io/npm/v/@peter.naydenov/url-pattern.svg)](https://www.npmjs.com/package/@peter.naydenov/url-pattern)
[![license](https://img.shields.io/github/license/PeterNaydenov/url-pattern.svg)](https://github.com/PeterNaydenov/url-pattern/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues-raw/PeterNaydenov/url-pattern.svg)](https://github.com/PeterNaydenov/url-pattern/issues)
[![GitHub top language](https://img.shields.io/github/languages/top/PeterNaydenov/url-pattern.svg)](https://github.com/PeterNaydenov/url-pattern)
[![npm bundle size](https://img.shields.io/bundlejs/size/@peter.naydenov/url-pattern.svg)](https://www.npmjs.com/package/@peter.naydenov/url-pattern)

Easier than regex string matching patterns for urls and other strings. Turn strings into data or data into strings.

## Install

```
npm install @peter.naydenov/url-pattern
```

Once it has been installed, it can be used by writing this line of JavaScript:

```js
// if you are using ES6:
import urlPattern from '@peter.naydenov/url-pattern'

// if you are using commonJS:
const urlPattern = require ( '@peter.naydenov/url-pattern' )
```

## How to use it

### Parse a pattern and match a string

```js
import urlPattern from '@peter.naydenov/url-pattern'

const pattern = urlPattern ( '/user/:username/post/:postId' )
const result = pattern.match ( '/user/john/post/123' )

console.log ( result )
// Output: { username: 'john', postId: '123' }
```

### Match a URL with optional segments

```js
import urlPattern from '@peter.naydenov/url-pattern'

const pattern = urlPattern ( '/api/(v1)/users/:id' )
const result = pattern.match ( '/api/v1/users/456' )

console.log ( result )
// Output: { id: '456' }
```

### Use wildcard

```js
import urlPattern from '@peter.naydenov/url-pattern'

const pattern = urlPattern ( '/files/*' )
const result = pattern.match ( '/files/images/photo.jpg' )

console.log ( result )
// Output: { _: 'images/photo.jpg' }
```

### Generate URL from data

```js
import urlPattern from '@peter.naydenov/url-pattern'

const pattern = urlPattern ( '/user/:username/post/:postId' )
const url = pattern.stringify ( { username: 'john', postId: '123' } )

console.log ( url )
// Output: '/user/john/post/123'
```

### Configure pattern options

```js
import urlPattern from '@peter.naydenov/url-pattern'

const pattern = urlPattern ( '/user/{username}/post/{postId}', {
    segmentNameStartChar: '{',
    segmentNameEndChar: '}'
})

const result = pattern.match ( '/user/john/post/123' )

console.log ( result )
// Output: { username: 'john', postId: '123' }
```
## URL Patterns

See [supported URL pattern types with examples](./PATTERNS.md).



## API Reference

### `urlPattern(pattern, [options])`

Creates a new pattern instance.

- **pattern** `{string}` - URL pattern string with named segments (`:name`), optional segments (`(segment)`), or wildcards (`*`)
- **options** `{object}` - Optional configuration object

#### Options

- **escapeChar** `{string}` - Character used for escaping (default: `'\\'`). Only escapes regex metacharacters (`^$.*+?()[]{}|\`); the backslash is kept literal for any other following character.
- **segmentNameStartChar** `{string}` - Character that starts a named segment (default: `':'`)
- **segmentNameEndChar** `{string}` - Character that ends a named segment (default: `undefined`). When set, the segment name stops at the first occurrence of this character instead of at the first character outside `segmentNameCharset`.
- **segmentNameCharset** `{string}` - Characters allowed in segment names (default: `'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'`). Treated as a list of explicit characters; range notation is not interpreted.
- **segmentValueCharset** `{string}` - Characters allowed in segment values (default: `'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_~ %'`). Treated as a list of explicit characters; range notation is not interpreted.
- **optionalSegmentStartChar** `{string}` - Character that starts an optional segment (default: `'('`)
- **optionalSegmentEndChar** `{string}` - Character that ends an optional segment (default: `')'`)
- **wildcardChar** `{string}` - Character that denotes a wildcard in the pattern (default: `'*'`)
- **wildcardName** `{string}` - Key under which the wildcard value is stored in the match result (default: `'_'`). Change this to avoid colliding with a named segment that also uses `_`, or to give wildcards a more descriptive key.

### Pattern Methods

#### `pattern.match(string)`

Matches a string against the pattern and returns an object with captured values, or `null` if no match. Throws a `TypeError` if the argument is not a string.

#### `pattern.stringify(data)`

Generates a URL string from provided data object.

#### `pattern.compiled`

Read-only object exposing the internal compiled state: `regex` (regex source), `regexObj` (compiled `RegExp`), `segments` (parsed segments array), `segmentNames` (segment name → capture-group mappings), `options` (merged options), `isRegex` (whether the pattern was created from a regex), and `pattern` (the original pattern string). The object is frozen — any attempt to mutate it will throw in strict mode (or fail silently elsewhere). Useful for introspection; do not mutate.

## Notes

### Wildcard result key

Wildcards are stored under the key `_` by default. If a pattern has both a wildcard and a named segment that resolves to `_` (e.g. `/api/:_/files/*`), both values end up under the same key — the second one is appended, producing an array. To avoid this, configure the wildcard key with the `wildcardName` option:

```js
const pattern = urlPattern('/api/:id/files/*', { wildcardName: 'rest' })
pattern.match('/api/42/files/a/b')   // → { id: '42', rest: 'a/b' }
```

### Regex patterns

When you pass a `RegExp` to `urlPattern`, the `g` and `y` flags are stripped. They are incompatible with this library's anchored, single-match contract: `g` would make `exec` advance `lastIndex` between calls (so the second `match()` would return `null`); `y` (sticky) requires a match starting exactly at `lastIndex`. Other flags (`i`, `m`, `s`, `d`, `u`) are preserved. The original regex object you passed in is not mutated — the library creates a fresh `RegExp` internally.



## Links
- [Supported URL patterns with examples](./PATTERNS.md).
- [History of changes](CHANGELOG.md)
- [TypeScript definitions](types/main.d.ts)



## Credits

'@peter.naydenov/url-pattern' was created and supported by [Peter Naydenov](https://github.com/PeterNaydenov).



## License

'@peter.naydenov/url-pattern' is released under the [MIT License](https://github.com/PeterNaydenov/git-url-pattern/blob/main/LICENSE).