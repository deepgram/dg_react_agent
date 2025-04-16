import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import cleaner from 'rollup-plugin-cleaner';
import url from '@rollup/plugin-url';
import packageJson from './package.json';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    // Clean the dist directory before each build
    cleaner({
      targets: ['./dist'],
    }),
    
    // Exclude peer dependencies from the bundle
    peerDepsExternal(),
    
    // Inline the AudioWorkletProcessor.js file as a data URI
    url({
      include: ['**/*.js'],
      limit: Infinity,
      fileName: '[dirname][name][extname]',
      publicPath: '/',
      filter: (id) => id.endsWith('AudioWorkletProcessor.js')
    }),
    
    // Resolve third-party modules
    resolve({
      browser: true,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    
    // Convert CommonJS modules to ES6
    commonjs(),
    
    // Compile TypeScript files
    typescript({
      tsconfig: './tsconfig.json',
      // Generate declarations
      declaration: true,
      declarationDir: 'dist',
      compilerOptions: {
        rootDir: 'src',
      },
    }),
    
    // Minify the output
    terser(),
  ],
  // Preserve modules for tree shaking
  preserveModules: false,
}; 