import commonjs from 'rollup-plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import postcss from 'rollup-plugin-postcss';
import resolve from 'rollup-plugin-node-resolve';
import svelte from 'rollup-plugin-svelte';
import { terser } from 'rollup-plugin-terser';
import replace from 'rollup-plugin-replace';
import { string } from 'rollup-plugin-string';
import json from 'rollup-plugin-json';
import getPreprocessor from 'svelte-preprocess';
import includePaths from 'rollup-plugin-includepaths';
// import path from "path";

const production = !process.env.ROLLUP_WATCH;
const mode = production ? 'production' : (process.env.NODE_ENV || 'development');
const dev = mode === 'development';

console.log('mode', mode);

const postcssPlugins = require("./postcss.config.js");
const preprocess = getPreprocessor({
  transformers: {
    postcss: {
      plugins: postcssPlugins(),
    },
  },
});

export default {
  input: 'src/main.js',
  output: {
    format: 'esm',
    sourcemap: true,
    name: 'app',
    dir: 'public/dist',
  },
  plugins: [
    replace({
      'process.browser': true,
      'process.env.NODE_ENV': JSON.stringify(mode),
    }),
    string({
      include: ['**/*.txt', '../smelte/examples/*.txt'],
    }),
    json({
      includes: '**./*.json',
    }),
    svelte({
      dev: dev,
      preprocess,
      //  preprocess: {
      //     // style: svelte_preprocess_postcss(),
      //  },
      css: css => {
        css.write('public/dist/components.css');
      },
    }),
    resolve({ mainFields: ['svelte', 'module', 'main'] }),
    commonjs(),
    includePaths({ paths: ['./node_modules/smelte/src', './'] }),
    postcss({
      extract: true,
      plugins: postcssPlugins(!dev),
    }),
    // postcss({
    //   plugins: require("./postcss.config.js")(!dev),
    //   extract: path.resolve(__dirname, "./public/dist/global.css")
    // }),
    dev && livereload('public'),
    !dev && terser(),
  ],
  watch: {
    clearScreen: false,
  },
};
