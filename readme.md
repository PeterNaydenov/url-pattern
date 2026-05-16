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
// Output: { '*': 'images/photo.jpg' }
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

- **escapeChar** `{string}` - Character used for escaping special characters (default: `'\\'`)
- **segmentNameStartChar** `{string}` - Character that starts a named segment (default: `':'`)
- **segmentNameEndChar** `{string}` - Character that ends a named segment (default: `undefined`)
- **segmentNameCharset** `{string}` - Characters allowed in segment names (default: `'a-zA-Z0-9'`)
- **segmentValueCharset** `{string}` - Characters allowed in segment values (default: `'a-zA-Z0-9-_~ %'`)
- **optionalSegmentStartChar** `{string}` - Character that starts an optional segment (default: `'('`)
- **optionalSegmentEndChar** `{string}` - Character that ends an optional segment (default: `')'`)
- **wildcardChar** `{string}` - Character that denotes a wildcard (default: `'*'`)

### Pattern Methods

#### `pattern.match(string)`

Matches a string against the pattern and returns an object with captured values, or `null` if no match.

#### `pattern.stringify(data)`

Generates a URL string from provided data object.

#### `pattern.compile()`

Returns an object with `regex` (compiled RegExp), `segments` (parsed segments array), and `segmentNames` (segment name mappings).



## Links
- [Supported URL patterns with examples](./PATTERNS.md).
- [History of changes](CHANGELOG.md)
- [TypeScript definitions](types/index.d.ts)



## Credits

'@peter.naydenov/url-pattern' was created and supported by [Peter Naydenov](https://github.com/PeterNaydenov).



## License

'@peter.naydenov/url-pattern' is released under the [MIT License](https://github.com/PeterNaydenov/git-url-pattern/blob/main/LICENSE).