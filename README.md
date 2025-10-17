# Mutant Test Gen JS

An automated system using LLMs and mutation testing in a feedback loop to generate high-quality unit tests for JavaScript projects. Built with Clean Architecture principles for scalability and maintainability.

## Overview

This project automates test generation by:
1. Using LLMs (OpenAI/Azure OpenAI) to generate initial unit tests
2. Running mutation testing (Stryker) to identify weaknesses
3. Iteratively improving tests based on survived mutants
4. Continuing until target mutation score is reached

The result is a robust, high-quality test suite with excellent coverage and mutation score.

## Features

- 🤖 **Multi-Provider LLM Support**: Works with both OpenAI and Azure OpenAI
- 🧬 **Mutation Testing**: Integrates with Stryker for JavaScript mutation testing
- 🔄 **Feedback Loop**: Automatically improves tests based on mutation testing results
- 📊 **Detailed Analytics**: Comprehensive mutation analysis and recommendations
- ⚙️ **Clean Architecture**: Modular, testable, and maintainable codebase
- 🚀 **Batch Processing**: Process multiple files concurrently
- 🎯 **Target-Driven**: Continues iterating until desired mutation score is achieved

## Installation

### For Development

```bash
# 1. Clone repository
git clone https://github.com/hoangtruonghrs/mutant_test_gen_js.git
cd mutant_test_gen_js

# 2. Install dependencies
npm install

# 3. Link globally (for development)
npm link

# 4. Verify installation
mutant-test-gen --help
```

### For Production Use

```bash
# Install globally from npm (when published)
npm install -g mutant_test_gen_js

# Or use locally in your project
npm install mutant_test_gen_js
```

See [INSTALLATION.md](./INSTALLATION.md) for detailed installation instructions.

## Prerequisites

- Node.js 14 or higher
- OpenAI API key OR Azure OpenAI credentials

## Quick Start

### 1. Set up your LLM provider

#### Using OpenAI

```bash
export OPENAI_API_KEY=your-api-key-here
```

#### Using Azure OpenAI

```bash
export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
export AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name
export AZURE_OPENAI_API_VERSION=2024-02-15-preview
```

### 2. Generate tests

#### Single file:
```bash
mutant-test-gen generate examples/calculator.js
# Output: tests/calculator.test.js
```

#### Specify output directory:
```bash
mutant-test-gen generate examples/calculator.js --output my-tests
# Output: my-tests/calculator.test.js
```

#### Multiple files:
```bash
mutant-test-gen generate "src/**/*.js"
# Output: tests/*.test.js
```

#### With options:
```bash
mutant-test-gen generate examples/calculator.js \
  --output tests \
  --target 90 \
  --iterations 3 \
  --model gpt-4
```

## Configuration

Initialize a configuration file:

```bash
mutant-test-gen init
```

### Configuration Options

```javascript
module.exports = {
  // LLM Provider
  llm: {
    provider: 'openai',  // 'openai' or 'azure'
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    apiKey: process.env.OPENAI_API_KEY,
    
    // Azure OpenAI (if provider is 'azure')
    azure: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: '2024-02-15-preview',
      deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    },
  },

  // Mutation Testing
  mutation: {
    testRunner: 'jest',
    timeout: 60000,
  },

  // Generation Settings
  targetMutationScore: 80,
  maxIterations: 5,
  useFeedbackLoop: false,
  concurrency: 3,

  // Paths
  paths: {
    output: 'tests',
    reports: 'reports',
  },
};
```

## Usage

### CLI Commands

#### Generate Tests

```bash
mutant-test-gen generate <files...> [options]
```

Options:
- `-c, --config <path>`: Path to configuration file
- `-o, --output <dir>`: Output directory for generated tests (default: tests)
- `-t, --target <score>`: Target mutation score (0-100, default: 80)
- `-i, --iterations <count>`: Maximum feedback iterations (default: 5)
- `-m, --model <name>`: LLM model to use (default: gpt-4)

Examples:

```bash
# Generate tests for a single file
mutant-test-gen generate src/calculator.js
# → Output: tests/calculator.test.js

# Specify output directory
mutant-test-gen generate src/calculator.js --output my-tests
# → Output: my-tests/calculator.test.js

# Generate with custom target score
mutant-test-gen generate src/*.js --target 90

# Use custom configuration
mutant-test-gen generate src/*.js --config ./my-config.js

# Use GPT-3.5 for faster/cheaper generation
mutant-test-gen generate src/*.js --model gpt-3.5-turbo
```

#### Initialize Configuration

```bash
mutant-test-gen init [options]
```

Options:
- `-o, --output <path>`: Output path for config file (default: mutant-test-gen.config.js)

### Programmatic API

```javascript
const { createApplication } = require('mutant_test_gen_js');

// Create application instance
const app = createApplication({
  llm: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4'
  }
});

// Generate tests for a single file
const result = await app.generateTests({
  sourcePath: 'src/calculator.js',
  outputPath: 'tests/calculator.test.js',
  useFeedbackLoop: true,
  targetMutationScore: 80
});

// Batch processing
const batchResult = await app.batchProcess({
  sourcePattern: 'src/**/*.js',
  outputDir: 'tests',
  mode: 'generate',
  concurrency: 3
});

// Cleanup
await app.cleanup();
```

## Output Structure

When you run `mutant-test-gen generate`, the tool creates test files in the specified output directory:

```
your-project/
├── src/
│   ├── calculator.js          # Your source file
│   └── utils.js              # Another source file
├── tests/                     # Default output directory
│   ├── calculator.test.js    # Generated test
│   └── utils.test.js         # Generated test
└── reports/                   # Mutation reports (optional)
    └── mutation-report.json
```

### Generated Test File Example

```javascript
// tests/calculator.test.js
const { add, subtract, multiply } = require('../src/calculator');

describe('Calculator', () => {
  describe('add', () => {
    test('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5);
    });
    
    test('should handle negative numbers', () => {
      expect(add(-2, -3)).toBe(-5);
    });
    
    // ... more test cases
  });
  
  // ... more describe blocks
});
```

## How It Works

1. **Initial Test Generation**: The LLM analyzes source code and generates comprehensive unit tests covering main functionality, edge cases, and error handling.

2. **Mutation Testing**: Stryker runs mutation testing, creating mutants (small code changes) and checking if tests catch them.

3. **Feedback Analysis**: The system identifies survived mutants (mutations not caught by tests) and analyzes what additional tests are needed.

4. **Test Improvement**: The LLM generates additional tests specifically targeting survived mutants.

5. **Iteration**: Steps 2-4 repeat until target mutation score is reached or max iterations exceeded.

6. **Report Generation**: Detailed reports are generated showing mutation scores, survived/killed mutants, and test quality metrics.

## Project Structure

```
mutant_test_gen_js/
├── lib/
│   ├── adapters/               # External service adapters
│   │   ├── llm/               # LLM providers (OpenAI, Azure)
│   │   ├── mutation/          # Mutation testing (Stryker)
│   │   └── storage/           # Storage providers
│   ├── core/
│   │   ├── entities/          # Domain entities
│   │   ├── services/          # Business logic services
│   │   └── use-cases/         # Application use cases
│   ├── interfaces/            # Interface contracts
│   ├── utils/                 # Shared utilities
│   └── application.js         # Main application
├── tests/                     # Test suite
│   ├── entities/             # Entity unit tests
│   ├── services/             # Service unit tests
│   ├── mocks/                # Mock adapters
│   ├── fixtures/             # Test data
│   └── helpers/              # Test utilities
├── docs/
│   ├── testing/              # Testing documentation
│   │   ├── README.md         # Testing overview
│   │   ├── PHASE1_PROGRESS.md
│   │   └── ...
│   ├── ARCHITECTURE.md       # System architecture
│   ├── API.md                # API reference
│   └── TROUBLESHOOTING.md
├── config/
│   └── default.config.js      # Default configuration
├── examples/                  # Example source files
├── reports/                   # Mutation reports
├── index.js                   # Public API exports
├── cli.js                     # CLI interface
└── package.json
```

## Documentation

- **[Architecture](./docs/ARCHITECTURE.md)** - System design and Clean Architecture implementation
- **[API Reference](./docs/API.md)** - Detailed API documentation
- **[Testing](./docs/testing/README.md)** - Testing documentation and progress (171 tests, 20.66% coverage)
- **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Installation](./docs/INSTALLATION.md)** - Detailed installation guide

## Examples

The `examples/` directory contains sample files to demonstrate the system:

- `calculator.js`: A simple calculator class with various operations
- `string-utils.js`: String manipulation utilities

Try generating tests for these examples:

```bash
node cli.js generate examples/calculator.js --target 85
```

## Mutation Testing

The system uses Stryker for mutation testing, which applies various mutation operators:

- **Arithmetic Operators**: Changes `+` to `-`, `*` to `/`, etc.
- **Logical Operators**: Changes `&&` to `||`, etc.
- **Conditional Expressions**: Changes `<` to `<=`, `>` to `>=`, etc.
- **Boolean Literals**: Changes `true` to `false`
- **String Literals**: Removes or changes strings
- And more...

A high mutation score indicates that tests effectively catch bugs and code changes.

## Reports

Generated reports include:

- **Summary Report**: Overall statistics across all files
- **File Reports**: Detailed mutation results per file
- **Mutation Scores**: Percentage of mutants killed by tests
- **Survived Mutants**: List of mutations not caught by tests

Reports are saved in the `reports/` directory in JSON format.

## Best Practices

1. **Start with Small Files**: Test the system on small, focused modules first
2. **Review Generated Tests**: Always review and understand generated tests
3. **Iterate Gradually**: Start with lower target scores and increase gradually
4. **Monitor API Usage**: LLM API calls can be expensive; monitor your usage
5. **Combine with Manual Tests**: Use generated tests as a foundation, add manual tests for complex scenarios

## Limitations

- Requires OpenAI API key (paid service)
- Best suited for JavaScript codebases (Python support planned)
- LLM-generated tests should be reviewed by developers
- Mutation testing can be time-consuming for large codebases
- API costs can add up for large projects

## Future Enhancements

- Python language support
- Additional LLM providers (Anthropic, local models)
- Integration with CI/CD pipelines
- Web UI for monitoring and configuration
- Support for more test frameworks (Mocha, Vitest)
- Intelligent test deduplication and merging
- Custom mutation operators

## Contributing

Contributions are welcome! Areas for improvement:

- Additional language support
- More sophisticated test merging strategies
- Performance optimizations
- Better prompt engineering for test generation
- Integration with more testing frameworks

## License

ISC

## Acknowledgments

Inspired by Meta's M-GUiTAr (Mutation-Guided Unit Test Auto-generation and Repair) research.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.