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

This NPM package includes pre-compiled Dazzer CLI binaries for your platform. The binary is written in Go and includes all necessary dependencies, including advanced semantic AST processing with TypeScript support.

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

## What's New in v0.2.0 🎉

### Major AST Enhancement - Complete Semantic Analysis
- **✅ Precise Locations**: Fixed "line 0, col 0" issue - now shows exact line/column positions
- **✅ Function Context**: Fixed "function 'unknown'" issue - now shows actual function names
- **✅ TypeScript Support**: Full TypeScript (.ts), TSX (.tsx), and Node.js support added
- **✅ Advanced Semantics**: Function parameters, return types, and complexity metrics
- **✅ Enhanced Languages**: 7 languages supported (Python, JavaScript, Node.js, Go, Java, TypeScript, TSX)

### Performance & Quality
- **100% Backward Compatible**: No breaking changes
- **Production-Ready**: >90% test coverage with comprehensive validation
- **Optimized Processing**: <1ms coordinate overhead, <10ms semantic processing

### Before vs After
```bash
# BEFORE v0.1.1 (Broken)
🔴 Magic number 200 (line 0, col 0) in function 'unknown'

# AFTER v0.2.0 (Enhanced)
🔴 Magic number 200 (line 42, col 16) in function 'processPayment'
   Parameters: amount: number, currency?: string
   Return Type: Promise<boolean>
   Complexity: Cyclomatic=6, Nesting=11, Lines=20
```

## Links

- [Dazzer CLI Repository](https://github.com/dazzer-io/dazzer-cli)
- [v0.2.0 Release Notes](https://github.com/dazzer-io/dazzer-cli/releases/tag/v0.2.0)
- [Documentation](https://dazzer.io)
- [Report Issues](https://github.com/dazzer-io/dazzer-cli/issues)
- [Website](https://dazzer.io)

## License

MIT © Dazzer

## Technical Details

This NPM package is a wrapper that downloads platform-specific binaries. The actual CLI is written in Go and compiled for each platform. The binaries are hosted on Google Cloud Storage and downloaded during the NPM postinstall phase.

Binary locations:
- Installed to: `node_modules/dazzer-cli/bin/dazzer`
- Symlinked to: Global NPM bin directory
