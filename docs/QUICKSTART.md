# Quick Start Guide

Get started with Mutant Test Gen JS in minutes!

## Prerequisites

- Node.js 14+ installed
- npm or yarn
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hoangtruonghrs/mutant_test_gen_js.git
cd mutant_test_gen_js
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your OpenAI API key
```

## Basic Usage

### Generate Tests for Example Files

Try it out with the included example files:

```bash
# Set your API key
export OPENAI_API_KEY=your-api-key-here

# Generate tests for the calculator example
node cli.js generate examples/calculator.js
```

This will:
1. Generate initial tests using GPT-4
2. Run mutation testing with Stryker
3. Improve tests iteratively until reaching 80% mutation score
4. Save generated tests to `tests/calculator.test.js`
5. Create detailed reports in `reports/`

### Generate Tests for Your Own Code

```bash
node cli.js generate src/my-module.js
```

### Generate Tests for Multiple Files

```bash
node cli.js generate src/**/*.js
```

### Customize Target Mutation Score

```bash
node cli.js generate examples/calculator.js --target 90
```

### Use GPT-3.5 for Faster/Cheaper Generation

```bash
node cli.js generate examples/calculator.js --model gpt-3.5-turbo
```

## Configuration

### Create a Configuration File

```bash
node cli.js init
```

This creates `mutant-test-gen.config.js` with default settings.

### Edit Configuration

Modify `mutant-test-gen.config.js` to customize:

```javascript
module.exports = {
  llm: {
    model: 'gpt-4',           // or 'gpt-3.5-turbo'
    temperature: 0.7,
    maxTokens: 2000,
  },
  mutationTesting: {
    targetMutationScore: 80,  // Target score (0-100)
    maxIterations: 5,         // Max feedback loops
  },
  testGeneration: {
    framework: 'jest',
    outputDir: 'tests',
  },
};
```

### Use Custom Configuration

```bash
node cli.js generate src/*.js --config my-config.js
```

## Understanding the Output

### Console Output

```
Starting Mutant Test Generation JS
Found 1 source file(s) to process
Generating initial tests
Feedback iteration 1/5
Mutation score: 65.23%
Improving tests to kill survived mutants
Feedback iteration 2/5
Mutation score: 78.50%
...
✓ Test generation completed successfully!
  Total files: 1
  Successful: 1
  Average mutation score: 85.40%
```

### Generated Files

- `tests/*.test.js` - Generated test files
- `reports/summary.json` - Summary statistics
- `reports/[filename]-report.json` - Per-file mutation reports
- `reports/mutation/mutation.html` - Stryker HTML report

## Programmatic Usage

```javascript
const MutantTestGenJS = require('./src/index');
const config = require('./config/default.config');

// Set API key
process.env.OPENAI_API_KEY = 'your-api-key';

async function main() {
  const mutantTestGen = new MutantTestGenJS(config);
  const result = await mutantTestGen.run(['src/calculator.js']);
  
  console.log(`Mutation score: ${result.summary.averageMutationScore}%`);
}

main();
```

## Tips for Best Results

1. **Start Small**: Test with small, focused modules first
2. **Review Tests**: Always review generated tests before using in production
3. **Iterate**: If score is low, increase max iterations
4. **Lower Target**: Start with 70-75% target, then increase
5. **Use GPT-4**: Better quality tests, worth the extra cost

## Common Issues

### "OPENAI_API_KEY is required"

Set your API key:
```bash
export OPENAI_API_KEY=your-api-key-here
```

### "No files matching pattern"

Check your file path:
```bash
# Use quotes for glob patterns
node cli.js generate "src/**/*.js"
```

### Mutation Testing Times Out

Increase timeout in config:
```javascript
mutationTesting: {
  timeoutMS: 60000,  // 60 seconds
}
```

### Low Mutation Score

Try:
- Increase `maxIterations` to 7-10
- Use `gpt-4` instead of `gpt-3.5-turbo`
- Lower `targetMutationScore` initially
- Review generated tests and add manual tests

## Next Steps

- Read the [Architecture docs](ARCHITECTURE.md)
- Check out [Contributing guidelines](../CONTRIBUTING.md)
- Explore example files in `examples/`
- Customize prompts in `src/llm/openai-client.js`

## Getting Help

- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation

## Example Session

Here's what a complete session looks like:

```bash
# 1. Set API key
export OPENAI_API_KEY=sk-...

# 2. Generate tests with custom settings
node cli.js generate examples/calculator.js \
  --target 85 \
  --iterations 7 \
  --model gpt-4

# Output:
# [timestamp] [info]: Starting Mutant Test Generation JS
# [timestamp] [info]: Found 1 source file(s) to process
# [timestamp] [info]: Generating tests via LLM { fileName: 'calculator.js' }
# [timestamp] [info]: Generating initial tests
# [timestamp] [info]: Test file written { testFilePath: 'tests/calculator.test.js' }
# [timestamp] [info]: Feedback iteration 1/7
# [timestamp] [info]: Running mutation testing { sourceFile: '...', testFile: '...' }
# [timestamp] [info]: Mutation testing completed { mutationScore: '72.50', survived: 11, killed: 29 }
# [timestamp] [info]: Mutation score: 72.50% { target: 85 }
# [timestamp] [info]: Improving tests to kill survived mutants { count: 11 }
# ...
# [timestamp] [info]: Mutation score: 87.50% { target: 85 }
# [timestamp] [info]: Target mutation score reached!
# [timestamp] [info]: Report generated successfully
# [timestamp] [info]: Test generation completed { ... }
#
# ✓ Test generation completed successfully!
#   Total files: 1
#   Successful: 1
#   Average mutation score: 87.50%
#   Target reached: 1 files

# 3. View generated tests
cat tests/calculator.test.js

# 4. View mutation report
open reports/mutation/mutation.html

# 5. Run the generated tests
npm test tests/calculator.test.js
```

Congratulations! You've successfully generated tests with mutation testing feedback.
