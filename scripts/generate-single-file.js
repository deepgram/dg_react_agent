#!/usr/bin/env node

/**
 * This script generates a single-file version of the DeepgramVoiceInteraction component
 * that can be easily copied and pasted into a project.
 */

const fs = require('fs');
const path = require('path');
const rollup = require('rollup');
const typescript = require('@rollup/plugin-typescript');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');

// Ensure directories exist
const outputDir = path.resolve(__dirname, '../dist-single-file');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function build() {
  console.log('Building single-file component...');

  try {
    // Bundle the component
    const bundle = await rollup.rollup({
      input: path.resolve(__dirname, '../src/components/DeepgramVoiceInteraction/DeepgramVoiceInteraction.tsx'),
      plugins: [
        nodeResolve({ extensions: ['.js', '.ts', '.tsx'] }),
        commonjs(),
        typescript({
          tsconfig: path.resolve(__dirname, '../tsconfig.json'),
          compilerOptions: {
            declaration: false,
            jsx: 'react',
          },
        }),
      ],
      external: ['react'],
    });

    // Write the bundle
    await bundle.write({
      file: path.resolve(outputDir, 'DeepgramVoiceInteraction.jsx'),
      format: 'esm',
      globals: {
        react: 'React',
      },
      banner: `/**
 * Deepgram Voice Interaction React Component
 * Version: ${require('../package.json').version}
 * 
 * A standalone version of the DeepgramVoiceInteraction component
 * that can be copied directly into a React project.
 * 
 * Dependencies: React 16.8+ (for hooks)
 * 
 * License: MIT
 */`,
    });

    // Also copy the AudioWorkletProcessor.js file
    const processorSrc = path.resolve(__dirname, '../src/utils/audio/AudioWorkletProcessor.js');
    const processorDest = path.resolve(outputDir, 'AudioWorkletProcessor.js');
    fs.copyFileSync(processorSrc, processorDest);

    console.log('Build complete!');
    console.log(`Output: ${path.resolve(outputDir, 'DeepgramVoiceInteraction.jsx')}`);
    console.log(`Audio processor: ${processorDest}`);
    console.log('\nTo use:');
    console.log('1. Copy both files into your project');
    console.log('2. Import the component: import { DeepgramVoiceInteraction } from "./DeepgramVoiceInteraction.jsx"');
    console.log('3. Make sure audio processor is accessible from your web server');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build(); 