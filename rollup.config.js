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
      file: 'dist/url-pattern.cjs.js',
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