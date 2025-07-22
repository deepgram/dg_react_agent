import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import cleaner from 'rollup-plugin-cleaner';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

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
    cleaner({
      targets: ['./dist'],
    }),
    
    peerDepsExternal(),
    
    resolve({
      browser: true,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    }),
    
    commonjs(),
    
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: 'dist',
      sourceMap: true,
      exclude: ['**/*.test.ts', '**/*.test.tsx'],
    }),
    
    terser(),
  ],
  external: ['react', 'react-dom'],
}; 
