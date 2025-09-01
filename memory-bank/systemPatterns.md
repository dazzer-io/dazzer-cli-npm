# System Patterns: Dazzer CLI NPM Package

## Architecture Pattern: Binary Wrapper
This package follows the "Binary Wrapper" pattern used by tools like:
- `esbuild` (Go binary distributed via NPM)
- `swc` (Rust binary distributed via NPM) 
- `prisma` (Multiple binaries distributed via NPM)

## Key Components

### 1. Platform Detection (`install.js`)
```javascript
// Detect OS
process.platform → 'darwin' | 'linux' | 'win32'

// Detect Architecture  
process.arch → 'x64' | 'arm64' | 'ia32'

// Map to binary naming
darwin + x64 → dazzer-darwin-amd64
linux + arm64 → dazzer-linux-arm64
win32 + x64 → dazzer-windows-amd64.exe
```

### 2. Binary Download Pattern
```javascript
// URL Construction
const url = `${GCS_BASE}/v${version}/dazzer-${platform}-${arch}${ext}`

// Download with redirects
https.get(url) → follow 301/302 → stream to file

// Make executable (Unix)
fs.chmodSync(path, 0o755)
```

### 3. Execution Wrapper (`run.js`)
```javascript
// Pass-through execution
spawn(binaryPath, process.argv.slice(2), {
  stdio: 'inherit',  // User sees all output
  env: process.env   // Pass environment
})
```

## Error Handling Strategy

### Network Errors
- Timeout after 30 seconds
- Retry once on failure
- Clear error messages with troubleshooting steps

### Platform Errors  
- Explicit unsupported platform messages
- Architecture detection fallbacks
- Permission error guidance

### Binary Errors
- Check existence before execution
- Validate file permissions
- Suggest reinstallation steps

## File Organization
```
dazzer-cli-npm/
├── package.json          # NPM metadata
├── install.js            # Downloads platform binary  
├── run.js               # Executes downloaded binary
├── test.js              # Validates installation
├── README.md            # User documentation
├── LICENSE              # MIT license
├── .gitignore           # Git exclusions
├── .npmignore           # NPM exclusions
└── bin/                 # Created during install (not in git)
    └── dazzer           # Downloaded binary (platform-specific)
```

## Version Synchronization
- NPM package version MUST match CLI binary version
- `install.js` fetches version from `api.dazzer.io/version`
- Fallback to package.json version if API unavailable
- Version validation with regex: `/^\d+\.\d+\.\d+/`

## Analytics Integration
- Fire-and-forget HTTP POST to `api.dazzer.io/analytics/install`
- 5-second timeout, silent failure
- Tracks platform distribution and success rates
- No user identification, purely anonymous

## Security Considerations
- Download only from trusted GCS bucket
- Validate binary after download (size check)
- No shell execution (use `spawn` with `shell: false`)
- Clear error messages without exposing internals
