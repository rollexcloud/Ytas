#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('Building client...');
execSync('vite build', { stdio: 'inherit' });

console.log('Building production server...');
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

execSync('esbuild server/production-entry.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/server.js', { stdio: 'inherit' });

console.log('Production build complete!');