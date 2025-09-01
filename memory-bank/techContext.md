# Technical Context: Dazzer CLI NPM Package

## Technology Stack
- **Language**: JavaScript (Node.js)
- **Runtime**: Node.js >=14.0.0
- **Package Manager**: NPM (primary), Yarn/PNPM (supported)
- **Binary Source**: Google Cloud Storage
- **Analytics**: HTTPS POST to api.dazzer.io

## Dependencies
**Zero runtime dependencies** - uses only Node.js built-ins:
- `os` - Platform/architecture detection
- `fs` - File system operations
- `path` - Path manipulation
- `https` - Binary downloads and analytics
- `child_process` - Binary execution

## Platform Support Matrix
| Platform | Architecture | Binary Name | Status |
|----------|-------------|-------------|---------|
| macOS | Intel (x64) | dazzer-darwin-amd64 | ✅ |
| macOS | Apple Silicon (arm64) | dazzer-darwin-arm64 | ✅ |
| Linux | x64 | dazzer-linux-amd64 | ✅ |
| Linux | ARM64 | dazzer-linux-arm64 | ✅ |
| Windows | x64 | dazzer-windows-amd64.exe | ✅ |
| Windows | x86 | dazzer-windows-386.exe | ✅ |

## Binary Distribution
- **Host**: Google Cloud Storage
- **Bucket**: `dazzer-asts-prod`
- **Path**: `/binaries/v{version}/dazzer-{platform}-{arch}`
- **Size**: ~10-15MB per binary
- **Format**: Single executable, no dependencies

## API Endpoints
```
GET https://api.dazzer.io/version
→ Returns: "0.1.0" (plain text)

POST https://api.dazzer.io/analytics/install  
→ Body: {"os": "darwin", "arch": "arm64", "version": "0.1.0", "method": "npm", "node_version": "v16.14.0"}
→ Response: 200 OK (fire-and-forget)
```

## Development Setup
```bash
# Clone repository
git clone https://github.com/dazzer-io/dazzer-cli-npm.git
cd dazzer-cli-npm

# Test locally
npm install -g .
dazzer --version

# Run tests
npm test
```

## Publishing Process
```bash
# Update version to match CLI
npm version 0.1.0

# Test package creation
npm pack

# Publish to NPM
npm publish

# Tag release
git tag v0.1.0
git push origin v0.1.0
```

## Performance Constraints
- **Download Timeout**: 30 seconds maximum
- **Binary Size**: <20MB per platform
- **Installation Time**: <30 seconds total
- **Memory Usage**: <50MB during download

## Security Model
- **No Code Execution**: Only downloads and executes pre-built binaries
- **HTTPS Only**: All downloads over encrypted connections
- **No User Data**: Analytics are anonymous
- **Sandboxed**: Binary runs in user's environment, no elevation

## Error Handling
- **Network Failures**: Retry once, then fail with clear message
- **Platform Detection**: Explicit error for unsupported platforms
- **Permission Issues**: Guide user through resolution
- **Missing Binary**: Suggest reinstallation steps

## Testing Strategy
- **Unit Tests**: Platform detection logic
- **Integration Tests**: Full install/run cycle
- **Platform Tests**: Verify on Mac/Linux/Windows
- **Network Tests**: Handle download failures gracefully
