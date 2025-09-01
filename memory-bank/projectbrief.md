# Project Brief: Dazzer CLI NPM Package

## Core Mission
Build an NPM package wrapper (`dazzer-cli-npm`) that enables JavaScript developers to install the Dazzer CLI tool via NPM. This package **does NOT contain CLI code** - it downloads pre-compiled Go binaries from Google Cloud Storage during installation.

## What is Dazzer?
Dazzer is an AI-readiness scanner that helps developers identify code patterns that confuse AI assistants, improving AI-generated code acceptance rates from 30% to 60%+.

## Critical Architecture Decision
This NPM package is a **WRAPPER ONLY**:
- Downloads platform-specific Go binaries from Google Cloud Storage during `npm install`
- Detects user's OS/architecture automatically  
- Installs binary to `node_modules/.bin/dazzer` for global access
- Sends anonymous installation analytics to `api.dazzer.io`
- Provides seamless cross-platform distribution for JavaScript developers

## Requirements
- **Zero Configuration**: Must work with just `npm install -g dazzer-cli`
- **Cross-Platform**: Support Mac (Intel/ARM), Linux (x64/ARM), Windows (x64/x86)
- **Fast Installation**: Complete in <30 seconds
- **Robust Error Handling**: Actionable error messages for every failure case
- **Version Parity**: NPM version must match CLI binary version exactly

## Implementation Files (8 total)
1. `package.json` - NPM metadata and configuration
2. `install.js` - Post-install script (downloads correct binary)
3. `run.js` - Wrapper script (executes downloaded binary)
4. `test.js` - Installation validation script
5. `README.md` - User documentation
6. `LICENSE` - MIT license
7. `.gitignore` - Git exclusions
8. `.npmignore` - NPM publish exclusions

## Success Metrics
- Installation success rate: >95%
- Platform support: Mac, Linux, Windows equally
- Download speed: <30 seconds globally
- Zero post-install configuration required
