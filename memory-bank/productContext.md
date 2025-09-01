# Product Context: Dazzer CLI NPM Package

## Why This Package Exists
JavaScript developers expect to install CLI tools via NPM (`npm install -g tool-name`). The Dazzer CLI is written in Go, not JavaScript, so we need a bridge package that downloads the appropriate binary for their platform.

## Problems It Solves
1. **Distribution Gap**: Go binaries can't be directly published to NPM
2. **Platform Detection**: Automatically detects user's OS/architecture
3. **Installation Simplicity**: Single command installation for JS developers
4. **Version Management**: Keeps NPM version in sync with CLI releases
5. **Analytics**: Tracks installation success across platforms

## How It Should Work

### Installation Flow
```bash
# User installs
npm install -g dazzer-cli

# NPM runs postinstall automatically  
node install.js  # Detects platform, downloads binary from GCS

# User runs CLI
dazzer scan ./code  # Executes via run.js wrapper
```

### Binary Distribution
- **Source**: Pre-compiled Go binaries from Google Cloud Storage
- **URL Pattern**: `https://storage.googleapis.com/dazzer-asts-prod/binaries/v{version}/dazzer-{platform}-{arch}`
- **Size**: ~10-15MB per binary
- **Platforms**: darwin-amd64, darwin-arm64, linux-amd64, linux-arm64, windows-amd64, windows-386

## User Experience Goals
1. **Invisible Complexity**: User doesn't know it's downloading a binary
2. **Fast Installation**: Downloads complete quickly globally
3. **Clear Feedback**: Progress messages during download
4. **Helpful Errors**: Actionable troubleshooting when things fail
5. **Seamless Usage**: Once installed, works exactly like any other CLI

## Analytics Payload
Installation sends anonymous data to help track success:
```json
{
  "os": "darwin",
  "arch": "arm64", 
  "version": "0.1.0",
  "method": "npm",
  "node_version": "v16.14.0"
}
```

## Expected Usage Patterns
- **Primary**: Global installation (`npm install -g dazzer-cli`)
- **Secondary**: Project-specific installation (less common)
- **Verification**: `dazzer --version` to confirm installation
- **Troubleshooting**: Reinstall when binary missing
