## Release History


### 1.0.4 (2026-07-10)
- [x] Added `wildcardName` option (default `'_'`) so the wildcard result key can be renamed and no longer silently collides with a named segment that also uses `_`;
- [x] `pattern.compiled` and `pattern.compiled.options` are now frozen — accidental mutation of either the top-level state or the nested options throws in strict mode instead of silently desynchronising the cached regex;
- [x] `g` and `y` flags are now stripped from user-provided regexes when constructing a pattern — they were incompatible with the anchored, single-match contract and made subsequent `match()` calls return `null` because `exec` advanced `lastIndex`. Other flags (`i`, `m`, `s`, `d`, `u`) are preserved and the original regex object is left untouched;
- [x] `pattern.match()` now throws a `TypeError` on non-string input (number, `null`, `undefined`, object, array) instead of silently coercing with `String()`;
- [x] Fixed the escape handler's LITERAL branch — it was missing a `continue` and could fall through with stale state, throwing "no segment name" on valid input such as `/:a\:b`;
- [x] `isAbsentValue` now treats `NaN` as missing, so a stray numeric `NaN` value is omitted from optional groups instead of being stringified to the literal `"NaN"` in a generated URL;
- [x] `PATTERNS.md` escape section rewritten to match actual behaviour (`\` only escapes regex metacharacters — `:` cannot be escaped, use `\*`, `\(`, `\)`, `\.` for literal matches);
- [x] README "TypeScript definitions" link fixed (pointed to the non-existent `types/index.d.ts` — now points to `types/main.d.ts`);
- [x] README "Notes" section added documenting the wildcard-key collision, how `wildcardName` resolves it, and how `g`/`y` regex flags are handled;
- [x] `types/main.d.ts` tightened: `ParsedSegment.type` and `SegmentName.type` are now literal unions (`'named' | 'wildcard' | 'literal'`) instead of `string`;


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