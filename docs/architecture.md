# Dazzer CLI NPM Package Repository - Complete PRD

## 🎯 Repository Purpose

This repository (`dazzer-cli-npm`) is an **NPM package wrapper** that enables JavaScript developers to install the Dazzer CLI tool via NPM. The package **does not contain the actual CLI code** - it downloads pre-compiled Go binaries from Google Cloud Storage during installation.

## 📚 System Context

### What is Dazzer?
Dazzer is an AI-readiness scanner that helps developers identify code patterns that confuse AI assistants. It improves AI-generated code acceptance rates from 30% to 60%+ by detecting issues like:
- Magic numbers (unexplained constants)
- Inconsistent naming conventions
- Overly complex functions
- Code duplication

### How Dazzer Works
1. **Privacy First**: Source code NEVER leaves the developer's machine
2. **Local AST Generation**: The CLI converts code to Abstract Syntax Trees locally
3. **Cloud Analysis**: Only the AST (structure, not code) is sent to `api.dazzer.io`
4. **AI-Readiness Score**: Returns a score (0-100) with specific improvement suggestions

### The CLI Binary
- **Language**: Written in Go (not JavaScript)
- **Platforms**: Supports Mac (Intel/ARM), Linux (x64/ARM), Windows (x64/x86)
- **Size**: ~10-15MB per binary
- **Features**: Tree-sitter parsers compiled in, no external dependencies

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Developer Machine                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  npm install -g dazzer-cli                               │
│         ↓                                                 │
│  ┌─────────────────────────────────────────┐            │
│  │     This NPM Package (dazzer-cli-npm)    │            │
│  │  1. Detects OS/Architecture               │            │
│  │  2. Downloads correct binary from GCS     │            │
│  │  3. Installs to node_modules/.bin        │            │
│  │  4. Sends analytics to api.dazzer.io     │            │
│  └─────────────────────────────────────────┘            │
│         ↓                                                 │
│  Binary installed at:                                     │
│  /usr/local/lib/node_modules/dazzer-cli/bin/dazzer      │
│         ↓                                                 │
│  User runs: dazzer scan ./my-code                        │
│         ↓                                                 │
│  CLI generates AST locally and sends to api.dazzer.io   │
└──────────────────────────────────────────────────────────┘
```

## 📋 Implementation Requirements

### Repository Structure
```
dazzer-cli-npm/
├── package.json          # NPM package metadata
├── install.js            # Post-install script (downloads binary)
├── run.js               # Wrapper script (executes binary)
├── README.md            # User documentation
├── LICENSE              # MIT license
├── .gitignore           # Git ignore rules
├── .npmignore           # NPM publish ignore rules
└── bin/                 # Created during install (not in git)
    └── dazzer           # Downloaded binary (platform-specific)
```

---

## 📄 File Contents

### `package.json`

**Purpose**: NPM package metadata and configuration

```json
{
  "name": "dazzer-cli",
  "version": "0.1.0",
  "description": "AI-readiness scanner for codebases - detect patterns that confuse AI",
  "keywords": [
    "ai",
    "code-quality",
    "cli",
    "scanner",
    "ast",
    "ai-readiness",
    "code-analysis",
    "developer-tools"
  ],
  "homepage": "https://dazzer.io",
  "bugs": {
    "url": "https://github.com/dazzer-io/dazzer-cli/issues"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/dazzer-io/dazzer-cli-npm.git"
  },
  "license": "MIT",
  "author": "Dazzer <team@dazzer.io>",
  "main": "run.js",
  "bin": {
    "dazzer": "./run.js"
  },
  "scripts": {
    "postinstall": "node install.js",
    "test": "node test.js"
  },
  "engines": {
    "node": ">=14.0.0"
  },
  "os": [
    "darwin",
    "linux",
    "win32"
  ],
  "cpu": [
    "x64",
    "arm64",
    "ia32"
  ],
  "files": [
    "install.js",
    "run.js",
    "README.md",
    "LICENSE"
  ]
}
```

### `install.js`

**Purpose**: Downloads the correct binary for the user's platform during NPM install

```javascript
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

    // Get version
    const version = await getLatestVersion();
    console.log(`Version: ${version}`);

    // Construct download URL
    const extension = platform === 'windows' ? '.exe' : '';
    const binaryUrl = `${GCS_BASE_URL}/v${version}/dazzer-${platform}-${arch}${extension}`;
    console.log(`Downloading from: ${binaryUrl}`);

    // Create bin directory
    const binDir = path.join(__dirname, 'bin');
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    // Download binary
    const binaryPath = path.join(binDir, BINARY_NAME);
    await downloadFile(binaryUrl, binaryPath);
    console.log('Download complete');

    // Make executable on Unix systems
    if (platform !== 'windows') {
      fs.chmodSync(binaryPath, 0o755);
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
    console.error('1. Check your internet connection');
    console.error('2. Try clearing NPM cache: npm cache clean --force');
    console.error('3. Try installing again: npm install -g dazzer-cli');
    console.error('4. Report issues: https://github.com/dazzer-io/dazzer-cli/issues');
    process.exit(1);
  }
}

// Run installation
install();
```

### `run.js`

**Purpose**: Wrapper script that executes the downloaded binary with passed arguments

```javascript
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
```

### `test.js`

**Purpose**: Simple test to verify installation worked

```javascript
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
  const output = execSync(`node "${path.join(__dirname, 'run.js')}" --version`, {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('   ✅ Binary runs successfully');
  console.log('   Version output:', output.trim());
} catch (err) {
  console.error('   ❌ Binary failed to run:', err.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! Dazzer CLI is ready to use.');
```

### `README.md`

**Purpose**: User-facing documentation

```markdown
# Dazzer CLI - NPM Package

This is the NPM distribution package for the [Dazzer CLI](https://github.com/dazzer-io/dazzer-cli), an AI-readiness scanner that helps developers identify code patterns that confuse AI assistants.

## Installation

```bash
npm install -g dazzer-cli
```

Or using yarn:
```bash
yarn global add dazzer-cli
```

Or using pnpm:
```bash
pnpm add -g dazzer-cli
```

## What Gets Installed

This NPM package downloads the appropriate pre-compiled Dazzer CLI binary for your platform during installation. The binary is written in Go and includes all necessary dependencies.

Supported platforms:
- macOS (Intel and Apple Silicon)
- Linux (x64 and ARM64)
- Windows (x64 and x86)

## Usage

After installation, the `dazzer` command will be available globally:

```bash
# Configure your access token (one-time setup)
dazzer init

# Scan a file or directory
dazzer scan ./my-project

# Get help
dazzer --help
```

## How It Works

1. **Privacy First**: Your source code never leaves your machine
2. **Local AST Generation**: Dazzer converts your code to Abstract Syntax Trees locally
3. **Cloud Analysis**: Only the AST structure is sent to our servers
4. **AI-Readiness Score**: Get a score (0-100) with specific suggestions

## Troubleshooting

### Installation Issues

If installation fails, try:

1. Clear NPM cache:
   ```bash
   npm cache clean --force
   ```

2. Reinstall:
   ```bash
   npm uninstall -g dazzer-cli
   npm install -g dazzer-cli
   ```

### Binary Not Found

If you get "command not found" after installation:

1. Check NPM global bin directory is in your PATH:
   ```bash
   npm bin -g
   ```

2. Add it to your PATH if needed:
   ```bash
   export PATH="$PATH:$(npm bin -g)"
   ```

### Permission Errors

On macOS/Linux, if you get permission errors:
```bash
sudo npm install -g dazzer-cli
```

Or better, configure NPM to use a different directory:
```bash
npm config set prefix ~/.npm-global
export PATH="$PATH:~/.npm-global/bin"
npm install -g dazzer-cli
```

## Links

- [Dazzer CLI Repository](https://github.com/dazzer-io/dazzer-cli)
- [Documentation](https://dazzer.io/docs)
- [Report Issues](https://github.com/dazzer-io/dazzer-cli/issues)
- [Website](https://dazzer.io)

## License

MIT © Dazzer

## Technical Details

This NPM package is a wrapper that downloads platform-specific binaries. The actual CLI is written in Go and compiled for each platform. The binaries are hosted on Google Cloud Storage and downloaded during the NPM postinstall phase.

Binary locations:
- Installed to: `node_modules/dazzer-cli/bin/dazzer`
- Symlinked to: Global NPM bin directory
```

### `.gitignore`

**Purpose**: Files to exclude from git

```gitignore
# Dependencies
node_modules/

# Downloaded binaries (not stored in git)
bin/

# OS files
.DS_Store
Thumbs.db

# IDE files
.idea/
.vscode/
*.swp
*.swo

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/
.nyc_output/

# Environment
.env
.env.local
```

### `.npmignore`

**Purpose**: Files to exclude from NPM package

```gitignore
# Development files
.gitignore
.github/
.git/

# Test files
test/
*.test.js

# Documentation source
docs/

# Downloaded binaries (will be downloaded during install)
bin/

# IDE and OS files
.idea/
.vscode/
.DS_Store
```

### `LICENSE`

**Purpose**: MIT License

```
MIT License

Copyright (c) 2024 Dazzer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🚀 Development & Publishing Process

### Initial Setup

1. **Create GitHub Repository**:
   - Name: `dazzer-cli-npm`
   - Description: "NPM package wrapper for Dazzer CLI"
   - Visibility: Public
   - Initialize with README: No (we have our own)

2. **Clone and Setup**:
   ```bash
   git clone https://github.com/dazzer-io/dazzer-cli-npm.git
   cd dazzer-cli-npm
   
   # Create all files as specified above
   # Then commit
   git add .
   git commit -m "Initial NPM package wrapper"
   git push origin main
   ```

3. **NPM Account Setup** (one-time):
   ```bash
   # Create account at npmjs.com
   npm login
   # Enter username, password, email
   ```

### Publishing Process

#### First Publish
```bash
# Ensure version matches CLI version
npm version 0.1.0

# Test locally first
npm pack  # Creates dazzer-cli-0.1.0.tgz
npm install -g ./dazzer-cli-0.1.0.tgz
dazzer --version  # Verify it works

# Publish to NPM
npm publish

# Verify
npm info dazzer-cli
```

#### Version Updates
When the CLI releases a new version:

1. **Update package.json version**:
   ```bash
   npm version 0.2.0  # Must match CLI version
   ```

2. **Test the download** (without publishing):
   ```bash
   # Temporarily modify install.js to use new version
   # Run locally
   node install.js
   # Verify new binary works
   ```

3. **Publish update**:
   ```bash
   npm publish
   ```

4. **Tag in git**:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```

### Testing Matrix

#### Local Testing Before Publish
```bash
# Test on Mac
npm install -g .
dazzer --version

# Test on Linux (using Docker)
docker run -it node:16 bash
# Inside container:
npm install -g /path/to/package
dazzer --version

# Test on Windows
# In PowerShell:
npm install -g .
dazzer --version
```

#### Post-Publish Testing
```bash
# Clean install test
npm uninstall -g dazzer-cli
npm cache clean --force
npm install -g dazzer-cli
dazzer --version
```

---

## 📊 Success Metrics

### Analytics Integration
The package sends anonymous installation analytics to `https://api.dazzer.io/analytics/install` containing:
- Operating system
- CPU architecture  
- CLI version
- Installation method ("npm")
- Node.js version

This helps track:
- Platform distribution
- Version adoption rate
- Installation success rate

### Expected Metrics
- **Installation Success Rate**: >95%
- **Platform Coverage**: 60% Mac, 30% Linux, 10% Windows
- **Version Adoption**: 80% on latest within 1 week

---

## 🔧 Troubleshooting Guide

### Common Issues

#### Issue: "Cannot find module './bin/dazzer'"
**Cause**: Binary didn't download during install
**Solution**: 
```bash
npm uninstall -g dazzer-cli
npm install -g dazzer-cli
```

#### Issue: "EACCES: permission denied"
**Cause**: NPM global directory requires sudo
**Solution**: Configure NPM to use user directory:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g dazzer-cli
```

#### Issue: "Failed to download: HTTP 404"
**Cause**: Version mismatch or binary not uploaded
**Solution**: Check GCS bucket has binaries for the version

#### Issue: Works on install but not after
**Cause**: PATH not configured correctly
**Solution**: Ensure NPM global bin is in PATH:
```bash
echo $PATH  # Should include npm global bin
npm bin -g  # Shows where global packages are installed
```

---

## ✅ Validation Checklist

### Pre-Development
- [ ] GitHub repository created
- [ ] NPM account created and verified
- [ ] GCS bucket accessible for binaries
- [ ] api.dazzer.io/version endpoint returns version

### Development Complete
- [ ] All files created as specified
- [ ] Package.json version matches CLI version
- [ ] Install.js handles all platforms
- [ ] Run.js executes binary correctly
- [ ] Test.js validates installation

### Pre-Publish Testing
- [ ] Local install works: `npm install -g .`
- [ ] Binary downloads successfully
- [ ] `dazzer --version` returns correct version
- [ ] Analytics sent (check server logs)
- [ ] Works on Mac, Linux, and Windows

### Post-Publish Validation
- [ ] Package visible on npmjs.com
- [ ] `npm install -g dazzer-cli` works
- [ ] Installation analytics being received
- [ ] No issues reported in first 24 hours
- [ ] Version badge shows on NPM page

---

## 📝 Maintenance Notes

### Regular Tasks
1. **Version Updates**: Keep in sync with CLI releases
2. **Dependency Updates**: Run `npm audit` monthly
3. **Analytics Review**: Check installation success rates
4. **Issue Triage**: Respond to GitHub issues

### Emergency Procedures

#### Rollback Bad Version
```bash
# Unpublish bad version (within 72 hours)
npm unpublish dazzer-cli@0.2.0

# Or deprecate with message
npm deprecate dazzer-cli@0.2.0 "Critical bug - use 0.1.0"
```

#### Binary URL Changes
If GCS bucket or URL structure changes:
1. Update `GCS_BASE_URL` in install.js
2. Publish patch version
3. Notify users via GitHub

---

## 🎯 Key Success Factors

1. **Zero Configuration**: Must work with just `npm install -g dazzer-cli`
2. **Cross-Platform**: Must support Mac, Linux, Windows equally well
3. **Fast Installation**: Download should complete in <30 seconds
4. **Clear Errors**: Every failure must have actionable error message
5. **Version Parity**: NPM version must always match CLI version

This package is a critical distribution channel that will account for ~60% of Dazzer CLI installations. It must be reliable, fast, and user-friendly.