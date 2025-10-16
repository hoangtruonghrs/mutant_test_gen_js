# Troubleshooting Guide

Common issues and solutions for Mutant Test Gen JS.

## Installation Issues

### npm install fails

**Problem:** Dependencies fail to install.

**Solutions:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Use different Node version:
   ```bash
   nvm install 18
   nvm use 18
   npm install
   ```

3. Check Node.js version:
   ```bash
   node --version  # Should be 14+
   ```

## API Key Issues

### "OpenAI API key is required"

**Problem:** OPENAI_API_KEY environment variable not set.

**Solutions:**
1. Set environment variable:
   ```bash
   export OPENAI_API_KEY=sk-your-key-here
   ```

2. Add to .env file:
   ```bash
   echo "OPENAI_API_KEY=sk-your-key-here" > .env
   ```

3. Verify it's set:
   ```bash
   echo $OPENAI_API_KEY
   ```

### API rate limit exceeded

**Problem:** Too many requests to OpenAI API.

**Solutions:**
1. Reduce concurrent operations
2. Add delays between iterations
3. Use GPT-3.5-turbo (higher rate limits)
4. Upgrade OpenAI plan

## File Resolution Issues

### "No files matching the pattern"

**Problem:** File patterns not resolving correctly.

**Solutions:**
1. Use quotes for glob patterns:
   ```bash
   node cli.js generate "src/**/*.js"
   ```

2. Use absolute paths:
   ```bash
   node cli.js generate /full/path/to/file.js
   ```

3. Check file exists:
   ```bash
   ls src/**/*.js
   ```

4. Exclude test files explicitly:
   ```bash
   node cli.js generate src/*.js --exclude "*.test.js"
   ```

## Mutation Testing Issues

### Stryker times out

**Problem:** Mutation testing doesn't complete.

**Solutions:**
1. Increase timeout in config:
   ```javascript
   mutationTesting: {
     timeoutMS: 60000  // 60 seconds
   }
   ```

2. Reduce concurrent test runners:
   ```javascript
   maxConcurrentTestRunners: 1
   ```

3. Check test file is valid:
   ```bash
   npm test tests/your-file.test.js
   ```

### Stryker fails with "No mutants generated"

**Problem:** No mutations created for source file.

**Solutions:**
1. Verify source file has code to mutate
2. Check file is JavaScript (not TypeScript without config)
3. Ensure file is not empty or only comments

### Mutation score is 0%

**Problem:** No mutants are being killed.

**Solutions:**
1. Check tests actually run:
   ```bash
   npm test
   ```

2. Verify test file path is correct
3. Ensure Jest is configured properly
4. Check test file imports source correctly

## LLM Generation Issues

### Generated tests are invalid JavaScript

**Problem:** LLM produces syntactically incorrect code.

**Solutions:**
1. Try different model:
   ```bash
   node cli.js generate file.js --model gpt-4
   ```

2. Adjust temperature (lower = more deterministic):
   ```javascript
   llm: {
     temperature: 0.5  // Default is 0.7
   }
   ```

3. Increase max tokens:
   ```javascript
   llm: {
     maxTokens: 3000  // Default is 2000
   }
   ```

### Tests don't improve between iterations

**Problem:** Mutation score stays the same.

**Solutions:**
1. Increase max iterations:
   ```bash
   node cli.js generate file.js --iterations 10
   ```

2. Use GPT-4 instead of GPT-3.5
3. Review survived mutants manually
4. Add custom prompt guidance

### LLM API request fails

**Problem:** Network or API errors.

**Solutions:**
1. Check internet connection
2. Verify API key is valid
3. Check OpenAI status page
4. Try again (temporary outage)

## Test Execution Issues

### "Jest is not recognized"

**Problem:** Jest not installed or not in PATH.

**Solutions:**
1. Install Jest:
   ```bash
   npm install --save-dev jest
   ```

2. Run via npx:
   ```bash
   npx jest
   ```

3. Check Jest config exists:
   ```bash
   ls jest.config.js
   ```

### Generated tests fail when run

**Problem:** Tests have runtime errors.

**Solutions:**
1. Check imports are correct:
   ```javascript
   // Generated test should have:
   const Calculator = require('../src/calculator');
   ```

2. Verify source file exports:
   ```javascript
   // Source file should have:
   module.exports = Calculator;
   ```

3. Run linter:
   ```bash
   npm run lint
   ```

4. Manually review and fix tests

## Performance Issues

### Generation takes too long

**Problem:** Process is very slow.

**Solutions:**
1. Use GPT-3.5-turbo:
   ```bash
   node cli.js generate file.js --model gpt-3.5-turbo
   ```

2. Reduce max iterations:
   ```bash
   node cli.js generate file.js --iterations 3
   ```

3. Lower target score:
   ```bash
   node cli.js generate file.js --target 70
   ```

4. Process fewer files at once

### High memory usage

**Problem:** System runs out of memory.

**Solutions:**
1. Process files individually
2. Increase Node.js memory:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" node cli.js generate ...
   ```

3. Clean up temporary files:
   ```bash
   rm -rf .stryker-tmp
   ```

## Configuration Issues

### Custom config not loading

**Problem:** Config file not being used.

**Solutions:**
1. Verify file path:
   ```bash
   ls -la my-config.js
   ```

2. Use absolute path:
   ```bash
   node cli.js generate file.js --config /full/path/to/config.js
   ```

3. Check syntax:
   ```bash
   node -c my-config.js
   ```

4. Verify exports:
   ```javascript
   // Config file must have:
   module.exports = { ... };
   ```

## Output Issues

### Reports not generated

**Problem:** No report files created.

**Solutions:**
1. Check reports directory exists:
   ```bash
   mkdir -p reports
   ```

2. Verify permissions:
   ```bash
   chmod 755 reports
   ```

3. Check for errors in logs:
   ```bash
   cat logs/mutation-testing.log
   ```

### Generated tests not saved

**Problem:** Test files not written to disk.

**Solutions:**
1. Check tests directory exists:
   ```bash
   mkdir -p tests
   ```

2. Verify write permissions:
   ```bash
   chmod 755 tests
   ```

3. Check disk space:
   ```bash
   df -h
   ```

## Debugging Tips

### Enable debug logging

```javascript
// In config:
logging: {
  level: 'debug',
  console: true
}
```

### View full error stack

```bash
NODE_ENV=development node cli.js generate file.js
```

### Test components individually

```javascript
// Test LLM client
const OpenAIClient = require('./src/llm/openai-client');
const Logger = require('./src/utils/logger');

const logger = new Logger({ level: 'debug', console: true });
const client = new OpenAIClient({
  model: 'gpt-3.5-turbo',
  apiKey: process.env.OPENAI_API_KEY
}, logger);

const sourceCode = 'function add(a, b) { return a + b; }';
const tests = await client.generateTests(sourceCode, 'test.js');
console.log(tests);
```

### Check Stryker directly

```bash
# Create test config
cat > stryker.conf.json << EOF
{
  "testRunner": "jest",
  "mutate": ["src/calculator.js"]
}
EOF

# Run Stryker
npx stryker run
```

## Getting Help

If issues persist:

1. **Check logs**: Review `logs/mutation-testing.log`
2. **Search issues**: Check GitHub issues for similar problems
3. **Create issue**: Provide:
   - Node.js version
   - npm version
   - Full error message
   - Steps to reproduce
   - Config file (without API key)

4. **Enable debug mode**: Include debug logs in issue

## Known Limitations

1. **ESM Modules**: Currently only supports CommonJS
2. **TypeScript**: Requires additional configuration
3. **Large Files**: May hit token limits (>2000 tokens)
4. **Complex Code**: May need manual test refinement
5. **API Costs**: Can be expensive for large projects

## FAQ

### Q: Can I use local LLM instead of OpenAI?
A: Not currently. Future enhancement planned.

### Q: Does it support TypeScript?
A: Basic support via Stryker, but not optimized.

### Q: Can I customize the prompts?
A: Yes, edit `src/llm/openai-client.js` methods.

### Q: How do I reduce API costs?
A: Use GPT-3.5-turbo, lower iterations, process fewer files.

### Q: Can I run this in CI/CD?
A: Yes, set OPENAI_API_KEY in CI environment variables.

### Q: What if mutation score doesn't reach target?
A: It's okay. Review generated tests, add manual tests as needed.
