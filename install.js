#!/usr/bin/env node
/**
 * Dazzer CLI NPM Installer
 * Downloads platform-specific binary from Google Cloud Storage
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Configuration
const GCS_BASE_URL = 'https://storage.googleapis.com/dazzer-asts-prod/binaries';
const API_BASE_URL = 'https://api.dazzer.io';
const BINARY_NAME = process.platform === 'win32' ? 'dazzer.exe' : 'dazzer';

/**
 * Detect the operating system
 */
function getPlatform() {
  const platform = process.platform;
  switch (platform) {
    case 'darwin':
      return 'darwin';
    case 'linux':
      return 'linux';
    case 'win32':
      return 'windows';
    default:
      throw new Error(`Unsupported platform: ${platform}. Dazzer CLI supports Mac, Linux, and Windows.`);
  }
}

/**
 * Detect the CPU architecture
 */
function getArchitecture() {
  const arch = process.arch;
  switch (arch) {
    case 'x64':
      return 'amd64';
    case 'arm64':
      return 'arm64';
    case 'ia32':
      return '386';
    default:
      throw new Error(`Unsupported architecture: ${arch}. Dazzer CLI supports x64, arm64, and x86.`);
  }
}

/**
 * Download file from URL with redirect support
 */
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    function download(urlString) {
      const parsedUrl = new URL(urlString);
      const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: {
          'User-Agent': 'dazzer-cli-npm'
        }
      };

      https.get(options, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(destination);
          return download(response.headers.location);
        }

        // Check for success
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destination);
          reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
          return;
        }

        // Pipe response to file
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlinkSync(destination);
          reject(err);
        });
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(destination)) {
          fs.unlinkSync(destination);
        }
        reject(err);
      });
    }

    download(url);
  });
}

/**
 * Get the latest CLI version from API
 */
async function getLatestVersion() {
  return new Promise((resolve) => {
    https.get(`${API_BASE_URL}/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const version = data.trim();
        // Validate version format
        if (/^\d+\.\d+\.\d+/.test(version)) {
          resolve(version);
        } else {
          console.warn('Invalid version from API, using default');
          resolve('0.1.0');
        }
      });
    }).on('error', (err) => {
      console.warn('Failed to fetch version, using default:', err.message);
      resolve('0.1.0');
    });
  });
}

/**
 * Send installation analytics (fire and forget)
 */
async function sendAnalytics(version, platform, arch) {
  try {
    const data = JSON.stringify({
      os: platform,
      arch: arch,
      version: version,
      method: 'npm',
      node_version: process.version,
      npm_version: process.env.npm_version || 'unknown'
    });

    const options = {
      hostname: 'api.dazzer.io',
      path: '/analytics/install',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      },
      timeout: 5000
    };

    const req = https.request(options);
    req.on('error', () => {}); // Silent fail
    req.on('timeout', () => req.destroy());
    req.write(data);
    req.end();
  } catch (error) {
    // Silent fail - don't break installation
  }
}

/**
 * Main installation function
 */
async function install() {
  console.log('Installing Dazzer CLI...');
  
  try {
    // Detect platform
    const platform = getPlatform();
    const arch = getArchitecture();
    console.log(`Platform: ${platform}-${arch}`);

    // Get version (for analytics only)
    const version = await getLatestVersion();
    console.log(`Version: ${version}`);

    // Determine source and target binary paths
    const extension = platform === 'windows' ? '.exe' : '';
    const sourceBinaryName = `dazzer-${platform}-${arch}${extension}`;
    const sourceBinaryPath = path.join(__dirname, 'bin', sourceBinaryName);
    const targetBinaryPath = path.join(__dirname, 'bin', BINARY_NAME);

    // Check if platform-specific binary exists
    if (!fs.existsSync(sourceBinaryPath)) {
      throw new Error(`Binary not found for ${platform}-${arch}. Supported platforms: darwin-amd64, darwin-arm64, linux-amd64, linux-arm64, windows-amd64`);
    }

    console.log(`Using bundled binary: ${sourceBinaryName}`);

    // Copy/rename binary to standard name if needed
    if (sourceBinaryPath !== targetBinaryPath) {
      if (fs.existsSync(targetBinaryPath)) {
        fs.unlinkSync(targetBinaryPath);
      }
      fs.copyFileSync(sourceBinaryPath, targetBinaryPath);
      console.log(`Binary ready: ${BINARY_NAME}`);
    }

    // Make executable on Unix systems
    if (platform !== 'windows') {
      fs.chmodSync(targetBinaryPath, 0o755);
      console.log('Made binary executable');
    }

    // Send analytics (don't await)
    sendAnalytics(version, platform, arch);

    // Success message
    console.log('\n✅ Dazzer CLI installed successfully!');
    console.log('\nGet started:');
    console.log('  dazzer init    # Configure your access token');
    console.log('  dazzer scan .  # Scan current directory');
    console.log('\nDocumentation: https://github.com/dazzer-io/dazzer-cli');
    
  } catch (error) {
    console.error('\n❌ Installation failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify your platform is supported (Mac, Linux, Windows on x64/ARM64)');
    console.error('2. Try clearing NPM cache: npm cache clean --force');
    console.error('3. Try installing again: npm install -g dazzer-cli');
    console.error('4. Report issues: https://github.com/dazzer-io/dazzer-cli/issues');
    process.exit(1);
  }
}

// Run installation
install();
