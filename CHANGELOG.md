## Release History


### 1.0.3 (2026-07-10)
- [x] Default export is now the factory `urlPattern` function, so `import urlPattern from '@peter.naydenov/url-pattern'` and `require('@peter.naydenov/url-pattern')` work without `new`;
- [x] Implemented `segmentNameEndChar` option so the README example with `{name}` segment syntax parses correctly;
- [x] Fixed character-class escaping in `segmentValueCharset` — `-`, `]`, `\`, `^` are now always treated as literals, preventing silent regex breakage for custom charsets;
- [x] Fixed separate optional groups — patterns like `/api(/:a)(/:b)` now produce two independent optional blocks instead of being merged into one;
- [x] Parser now throws on malformed patterns (trailing `:` without a name, unclosed `(`, unmatched `)`);
- [x] Default `segmentNameCharset` now includes `_` so `:user_id` parses as a single name;
- [x] `stringify` now treats an empty array as a missing value for optional segments;
- [x] Documented `pattern.compiled` introspection field (the old `compile()` method never existed);
- [x] README and `types/main.d.ts` updated to match the source: `segmentNameCharset` / `segmentValueCharset` defaults use the expanded form, `segmentNameEndChar` is declared, and the wildcard example now shows `_` as the result key;
- [x] Wildcard (`*`) no longer drops its capture key when the matched suffix is empty — `/v1.2/*` matching `/v1.2/` now correctly returns `{ _: '' }` instead of `{}`;
- [x] Escape handler no longer consumes the optional-group close delimiter — `\ )` is now treated as a literal `)` (backslash escapes only regex metacharacters, not arbitrary characters), so patterns like `/api(/:foo\))` parse and match correctly;
- [x] `makePatternFromRegex` now omits keys from unmatched optional groups — `{id: null}` is no longer returned; the key is omitted entirely, consistent with string-pattern behaviour;
- [x] Duplicate optional groups with the same segment name no longer return `null` in the result array when one group is unmatched — `{a: ['x', null]}` is now `{a: ['x']}`;



### 1.0.2 (2026-06-04)
- [x] Moving from eslint to oxidize;



### 1.0.1 (2026-05-14)
- [x] Fixed type definitions output path;
- [x] Cleaned up stale build artifacts;
- [x] Updated rollup config to output minified UMD bundle;



### 1.0.0 (2026-05-14)
- [x] Initial release of URL Pattern library;
- [x] Pattern matching with named segments (`:name`);
- [x] Optional segment support (`(segment)`);
- [x] Wildcard support (`*`);
- [x] Stringify method to generate URLs from data;
- [x] Customizable options for segment characters and charsets;
- [x] TypeScript support;