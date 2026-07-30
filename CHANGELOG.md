## Release History



### <next-version> (unreleased)
- [x] **🔴 `stringify` round-trip: arrays of empty/null/undefined elements are treated as absent on optional segments**. `stringify({ids: ['']})`, `{ids: [null]}`, and `{ids: [undefined]})` for the pattern `/api(/:ids)` all previously produced `/api/` (a URL the match side rejected because the `+` quantifier requires at least one char). The empty joined array was treated as "present" and the literal `/` from the group had already been appended. The group is now wiped when the joined value is empty, so the same input produces `/api` which round-trips through `match` to `{}`;
- [x] **Literal-only optional groups are wiped when no values are provided**. `stringify({})` for `/api(/v)` previously produced `/api/v` because the literal was always appended — there was no value the user could pass to "opt out". New rule: when no values are provided at all, the minimal URL is generated, so the group is wiped. Trade-off: when the user *is* providing values for other segments, a literal-only group is still included, because there is no value the user can pass to "opt in" to such a group;
- [x] **Optional groups are now atomic**. `stringify({_: 'a/b'})` for `/api(/:id/*)` previously produced `/api/a/b` — the inner loop broke at the missing `:id` value, but the outer loop then kept walking the rest of the same group and emitted the trailing `/` and `*` capture anyway. The group end is now computed up front, so the whole group is skipped whenever any value inside it is missing. The same fix applies to `/api(/*/:id)` with `{id: 'x'}`;
- [x] **Arrays distribute across repeated segment names**. `stringify({ids: ['1', '2']})` for `/api/:ids/posts/:ids` previously produced `/api/1/2/posts/1/2` (the same joined string for both positions). Element `i` is now used for occurrence `i`, so the output is `/api/1/posts/2`. Non-array values are still reused for every occurrence (backward-compatible), and an array shorter than the number of occurrences falls back to the last element. Round-trip with `match` is now possible — the match result for a repeated name is an array, and feeding that array straight back into `stringify` reproduces the same URL;
- [x] **`pattern.compiled` is now deeply frozen**. The 1.0.4 release froze `compiled` and `compiled.options` to enforce the "frozen" contract from the docs, but `Object.freeze` is shallow — `compiled.segments`, `compiled.segmentNames`, and the segment / segmentName objects inside them were left mutable, so in strict mode `pattern.compiled.segments[0].name = 'mutated'` silently desynced the cached regex. A new `deepFreeze` helper walks every nested object/array and freezes it. `compiled.regexObj` (a `RegExp`) is intentionally skipped — freezing a `RegExp` would make its `lastIndex` non-writable and break `match`. Behaviour change is strict-mode-only; sloppy mode continues to fail silently, exactly as before;
- [x] **Custom `escapeChar` followed by a non-regex-metachar now uses the configured character, not a hardcoded backslash**. With `escapeChar: '%'`, the pattern `/foo%:bar` previously compiled to a literal backslash followed by `:bar` (regex `^\/foo\\([…]+)$`) because the LITERAL branch in the escape handler hardcoded `name: '\\'` and `regex: '\\\\'`. The compiled segment now correctly uses `options.escapeChar`, so the same pattern produces `^\/foo%([…]+)$`. The trailing-escape error message was hardcoded the same way and is also fixed to show the configured character (e.g. `Invalid pattern: '%' at position 4 has nothing to escape` instead of `Invalid pattern: '\' at position 4 …`);
- [x] 37 regression tests added to lock in the new behaviour: 17 across four new describe blocks for the round-trip fixes (the `['']`/`[null]`/`[undefined]` cases, the literal-only-optional wipe on empty values, atomic-group behaviour when a middle value is missing, and array distribution across two and three occurrences including the `match`-to-`stringify` round-trip and the short-array fallback), 6 in one new describe block pinning down the existing required-single-with-array join behaviour (so a future refactor cannot silently change it), 1 for `stringify(null)` robustness, 9 in one new describe block for deep-freeze (each frozen object, three strict-mode mutation throws, and the `regexObj`-is-NOT-frozen escape hatch), and 4 in the existing `escapeChar option` block covering the non-metachar case, the trailing-escape error message, the metachar regression, and a `stringify` round-trip check.



### 1.0.6 (2026-07-14)
- [x] **🔴 `CHANGELOG.md` is now actually published**. The `.npmignore` had a `!Changelog.md` exception, but the actual file is `CHANGELOG.md`. On case-sensitive filesystems (Linux, the npm registry) the exception didn't match, so the changelog was silently excluded from the published tarball. Renamed the exception to `!CHANGELOG.md` and added `CHANGELOG.md` to the `files` allowlist so it ships regardless of the ignore rules;
- [x] **Regex patterns no longer poison the global `DEFAULT_OPTIONS`**. `makePatternFromRegex` was returning `options: DEFAULT_OPTIONS` (the shared global), so the constructor's `Object.freeze(compiled.options)` silently froze the global for every other pattern. Now regex patterns get a fresh copy (`{ ...DEFAULT_OPTIONS }`) and the global stays mutable for consumers that import it;
- [x] `vitest.config.js` no longer excludes `src/main.js` from coverage — that was excluding the entire source from the coverage report (`src/main.js` is the only file in `src/`);
- [x] `tsconfig.json` updated to `module: "ESNext"` (was `"commonjs"`) so type checking matches the actual ESM source;
- [x] Removed the now-redundant `src/` entry from `.npmignore` — `src` is in the `files` allowlist and the user wants it published as the primary entry;
- [x] **README**: License link fixed (was pointing to a non-existent `git-url-pattern` repo, now points to the real `url-pattern` one); the "Match a URL with optional segments" example now uses a named optional segment (`/:version`) instead of a literal one, so the section title actually matches the example; the `pattern.compiled` docs now mention the `keys` field present on regex-based patterns; the `pattern.stringify` docs now warn that it throws on missing required values; the redundant "## URL Patterns" stub section was removed (the link to PATTERNS.md is still in the "Links" section); minor wording fixes (tagline, "ES6" → "ES modules", "this line" → "this code").


### 1.0.5 (2026-07-10)
- [x] **🔴 CJS dist file rename: `url-pattern.cjs.js` → `url-pattern.cjs`**. The previous filename ended in `.js`, so Node tried to load it as an ES module (because the package's `package.json` has `"type": "module"`), but the file used CommonJS syntax (`exports`, `module.exports`). The result was a silent failure: `require('@peter.naydenov/url-pattern')` returned an empty object and `new UrlPattern(path)` threw `TypeError: UrlPattern is not a constructor`. The new `.cjs` extension forces Node to treat it as CJS regardless of the package's `type` field;
- [x] **Source is now the primary entry point**. `package.json` `main`, `module`, `exports[import]`, and `exports[default]` all point to `./src/main.js` — ESM consumers and bundlers (Vite, webpack, Rollup, esbuild) get the source directly, no transpilation in between. CJS consumers still get the pre-built `dist/url-pattern.cjs`. The `dist/` directory is preserved for the UMD browser bundle and the CJS Node bundle;



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