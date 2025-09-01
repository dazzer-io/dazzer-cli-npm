#!/usr/bin/env node
/**
 * Dazzer CLI Runner
 * Executes the platform-specific binary with user arguments
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Determine binary name based on platform
const BINARY_NAME = process.platform === 'win32' ? 'dazzer.exe' : 'dazzer';
const BINARY_PATH = path.join(__dirname, 'bin', BINARY_NAME);

// Check if binary exists
if (!fs.existsSync(BINARY_PATH)) {
  console.error('❌ Dazzer CLI binary not found.');
  console.error('\nThis usually means installation was incomplete.');
  console.error('\nTry reinstalling:');
  console.error('  npm uninstall -g dazzer-cli');
  console.error('  npm install -g dazzer-cli');
  console.error('\nIf the problem persists, please report:');
  console.error('  https://github.com/dazzer-io/dazzer-cli/issues');
  process.exit(1);
}

// Spawn the binary with all arguments passed through
const child = spawn(BINARY_PATH, process.argv.slice(2), {
  stdio: 'inherit',  // Inherit stdin, stdout, stderr
  env: process.env,  // Pass through environment variables
  shell: false       // Don't use shell (more secure)
});

// Handle exit
child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code);
  }
});

// Handle errors
child.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('❌ Failed to execute Dazzer CLI binary.');
    console.error('Binary path:', BINARY_PATH);
    console.error('\nPlease reinstall:');
    console.error('  npm uninstall -g dazzer-cli');
    console.error('  npm install -g dazzer-cli');
  } else if (err.code === 'EACCES') {
    console.error('❌ Permission denied executing Dazzer CLI.');
    console.error('\nTry fixing permissions:');
    console.error(`  chmod +x "${BINARY_PATH}"`);
  } else {
    console.error('❌ Failed to run Dazzer CLI:', err.message);
  }
  process.exit(1);
});
