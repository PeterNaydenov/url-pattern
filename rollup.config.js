import terser from '@rollup/plugin-terser';

export default {
  input: 'src/main.js',
  output: [
    {
      file: 'dist/url-pattern.es.js',
      format: 'es',
      name: 'urlPattern'
    },
    {
      // Use the `.cjs` extension (not `.cjs.js`) because the package has
      // `"type": "module"` in its package.json. Without this, Node would
      // treat any `.js` file as ESM and the CJS file would fail to load
      // when consumers do `require('@peter.naydenov/url-pattern')`.
      file: 'dist/url-pattern.cjs',
      format: 'cjs',
      name: 'urlPattern',
      exports: 'named',
      // Make `require('@peter.naydenov/url-pattern')` return the factory
      // function directly so the README's `const urlPattern = require(...)`
      // example works. The named exports remain accessible as properties of
      // that function.
      outro: 'module.exports = Object.assign(module.exports.default, module.exports);'
    },
    {
      file: 'dist/url-pattern.umd.js',
      format: 'umd',
      name: 'urlPattern',
      plugins: [terser()]
    }
  ]
};