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
      exports: 'named'
    },
    {
      file: 'dist/url-pattern.umd.js',
      format: 'umd',
      name: 'urlPattern',
      plugins: [terser()]
    }
  ]
};