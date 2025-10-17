# Installation Guide

## Development Setup

To use `mutant-test-gen` command during development:

### 1. Install Dependencies

```bash
npm install
```

### 2. Link Package Globally

```bash
npm link
```

This creates a global symlink to your local package, allowing you to run `mutant-test-gen` from anywhere.

### 3. Verify Installation

```bash
mutant-test-gen --help
```

You should see the help menu with available commands.

## Usage

### Basic Commands

```bash
# Generate tests for a single file
mutant-test-gen generate examples/calculator.js

# Generate tests for multiple files
mutant-test-gen generate examples/*.js

# Use glob patterns
mutant-test-gen generate "src/**/*.js"

# Customize target score
mutant-test-gen generate examples/calculator.js --target 90

# Use different model
mutant-test-gen generate examples/calculator.js --model gpt-3.5-turbo

# More iterations
mutant-test-gen generate examples/calculator.js --iterations 7

# Custom config file
mutant-test-gen generate examples/*.js --config my-config.js

# Initialize config file
mutant-test-gen init
```

### Environment Variables

#### For OpenAI:
```bash
export OPENAI_API_KEY=sk-...
```

#### For Azure OpenAI:
```bash
export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
export AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
export OPENAI_API_KEY=your-azure-key
```

## Uninstalling

To remove the global link:

```bash
npm unlink -g mutant_test_gen_js
```

## Production Installation

For end users who want to install globally:

```bash
npm install -g mutant_test_gen_js
```

Then use `mutant-test-gen` command directly.

## Troubleshooting

### Command Not Found

If you get "command not found" after `npm link`:

1. Check if npm global bin directory is in your PATH:
   ```bash
   npm config get prefix
   ```

2. Add it to your PATH if needed:
   - **Windows (PowerShell)**: Add to `$env:PATH`
   - **macOS/Linux**: Add to `~/.bashrc` or `~/.zshrc`

### Module Not Found Errors

If you see module errors:

```bash
# Reinstall dependencies
npm install

# Re-link the package
npm unlink
npm link
```

### Permission Issues (macOS/Linux)

If you get permission errors:

```bash
sudo npm link
```

Or configure npm to use a directory you own:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
# Add ~/.npm-global/bin to your PATH
```

## Testing Your Changes

After making code changes, the `mutant-test-gen` command will automatically use the updated code (no need to re-link).

## Package Publishing

When ready to publish to npm:

```bash
# Update version in package.json
npm version patch  # or minor, or major

# Publish to npm
npm publish
```

After publishing, users can install with:
```bash
npm install -g mutant_test_gen_js
```
