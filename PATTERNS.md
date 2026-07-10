# URL Patterns

Look at URL pattern types supported by `@peter.naydenov/url-pattern`, including the syntax for each pattern type and example matches.



### Literal Segments

Static path parts that match exactly as written. No special characters, no variables.

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/about` | `/about` | `{}` |
| `/api/health` | `/api/health` | `{}` |
| `/api/health` | `/api/users` | `null` |



### Named Segments

Capture dynamic path segments using the `:name` syntax. Values must match the character set `a-zA-Z0-9-_~ %` (use the expanded form in your config if you customize the charset).

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/api/users/:id` | `/api/users/10` | `{ id: '10' }` |
| `/user/:username/post/:postId` | `/user/john/post/123` | `{ username: 'john', postId: '123' }` |
| `/api/:resource/:id` | `/api/users/abc123` | `{ resource: 'users', id: 'abc123' }` |



### Optional Segments

Wrap segments in `(...)` to make them optional. The entire optional block is omitted when no values are provided.

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/api/users(/:id)` | `/api/users/10` | `{ id: '10' }` |
| `/api/users(/:id)` | `/api/users` | `{}` |
| `/api(/:resource/:id)` | `/api/users/10` | `{ resource: 'users', id: '10' }` |
| `/api(/:resource/:id)` | `/api` | `{}` |



### Optional Segment with Named Capture

Combine `(...)` with `:name` inside. Note: `:name` stops at `/`, so it only captures up to the next slash.

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/files(/:path)` | `/files/images/photo.jpg` | `{ path: 'images' }` |
| `/files(/:path)` | `/files` | `{}` |



### Optional Segment with Wildcard Capture

Combine `(...)` and `*` inside for optional wildcard capture (captures everything including `/`).

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/files(/*)` | `/files/images/photo.jpg` | `{ '_': 'images/photo.jpg' }` |
| `/files(/*)` | `/files` | `{}` |



### Wildcards

Use `*` to match any remaining characters in the path. Captured under the `_` key.

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/files/*` | `/files/images/photo.jpg` | `{ '_': 'images/photo.jpg' }` |
| `/api/*/details` | `/api/users/details` | `{ '_': 'users' }` |
| `*` | `anything/goes/here` | `{ '_': 'anything/goes/here' }` |



### Named Segment with Optional Segment + Wildcard

Mix `:name`, `(...)`, and `*` together. Useful for versioned APIs.

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/v:major(.:minor)/*` | `/v1.2/` | `{ major: '1', minor: '2' }` |
| `/v:major(.:minor)/*` | `/v2/users` | `{ major: '2', _: 'users' }` |
| `/v:major(.:minor)/*` | `/v/` | `null` |



### Escaped Characters

The escape character (`\`) only escapes **regex metacharacters** — `^`, `$`, `.`, `*`, `+`, `?`, `(`, `)`, `[`, `]`, `{`, `}`, `|`, and `\` itself. For any other character (including `:`), the backslash is kept as a literal character and the following character is processed normally.

This means `:` cannot be escaped (it has no special meaning in regex), and you can use `\*`, `\(`, `\)`, `\.`, etc. to match those characters literally. The same applies to `*` — escape it to match a literal asterisk instead of a wildcard.

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/\*literal` | `/*literal` | `{}` |
| `/\(group\)` | `/(group)` | `{}` |
| `/\.json` | `/.json` | `{}` |



### Repeated Segment Names

Using the same segment name multiple times collects all matched values into an array.

| Pattern | Example URL | Result |
|---------|-------------|--------|
| `/api/users/:ids/posts/:ids` | `/api/users/10/posts/5` | `{ ids: ['10', '5'] }` |



### Stringifying (Generating URLs from Data)

Use `pattern.stringify(data)` to reverse the process — generate a URL from an object.

| Pattern | Data | Result |
|---------|------|--------|
| `/user/:username/post/:postId` | `{ username: 'john', postId: '123' }` | `/user/john/post/123` |
| `/api/users(/:id)` | `{ id: 10 }` | `/api/users/10` |
| `/api/users(/:id)` | `{}` | `/api/users` |
| `/api/*` | `{ _: 'users/10' }` | `/api/users/10` |
| `/v:major(.:minor)/*` | `{ major: '1', minor: '2', _: 'test' }` | `/v1.2/test` |
| `/v:major(.:minor)/*` | `{ major: '2', _: 'users' }` | `/v2/users` |
