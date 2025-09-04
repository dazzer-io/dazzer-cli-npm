#!/usr/bin/env node
/**
 * Dazzer CLI NPM Package Test
 * Verifies the binary was downloaded and is executable
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BINARY_NAME = process.platform === 'win32' ? 'dazzer.exe' : 'dazzer';
const BINARY_PATH = path.join(__dirname, 'bin', BINARY_NAME);

console.log('Testing Dazzer CLI installation...\n');

// Test 1: Binary exists
console.log('1. Checking binary exists...');
if (!fs.existsSync(BINARY_PATH)) {
  console.error('   ❌ Binary not found at:', BINARY_PATH);
  process.exit(1);
}
console.log('   ✅ Binary found');

// Test 2: Binary is executable
console.log('2. Checking binary is executable...');
try {
  const stats = fs.statSync(BINARY_PATH);
  if (process.platform !== 'win32' && !(stats.mode & 0o111)) {
    console.error('   ❌ Binary is not executable');
    process.exit(1);
  }
  console.log('   ✅ Binary is executable');
} catch (err) {
  console.error('   ❌ Cannot check binary:', err.message);
  process.exit(1);
}

// Test 3: Binary runs
console.log('3. Checking binary runs...');
try {
  const output = execSync(`node "${path.join(__dirname, 'run.js')}" --help`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('   ✅ Binary runs successfully');
  console.log('   Help output preview:', output.split('\n')[0]);
} catch (err) {
  console.error('   ❌ Binary failed to run:', err.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! Dazzer CLI is ready to use.');
