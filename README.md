# Mutant Test Gen JS

An automated system using LLMs and mutation testing in a feedback loop to generate high-quality unit tests for JavaScript projects. Inspired by Meta's M-GUiTAr.

## Overview

This project automates test generation by:
1. Using LLMs (Large Language Models) to generate initial unit tests
2. Running mutation testing to identify weaknesses
3. Iteratively improving tests based on survived mutants
4. Continuing until target mutation score is reached

The result is a robust, high-quality test suite with excellent coverage and mutation score.

## Features

- 🤖 **LLM-Powered Test Generation**: Uses OpenAI's GPT models to generate comprehensive unit tests
- 🧬 **Mutation Testing**: Integrates with Stryker for JavaScript mutation testing
- 🔄 **Feedback Loop**: Automatically improves tests based on mutation testing results
- 📊 **Detailed Reports**: Generates comprehensive reports on mutation scores and test quality
- ⚙️ **Configurable**: Flexible configuration for target scores, iterations, and more
- 🎯 **Target-Driven**: Continues iterating until desired mutation score is achieved

## Installation

```bash
npm install
```

## Prerequisites

- Node.js 14 or higher
- OpenAI API key (set as `OPENAI_API_KEY` environment variable)

## Quick Start

1. Set your OpenAI API key:
```bash
export OPENAI_API_KEY=your-api-key-here
```

2. Generate tests for a source file:
```bash
node cli.js generate examples/calculator.js
```

3. Generate tests for multiple files:
```bash
node cli.js generate examples/*.js
```

## Configuration

Create a configuration file:

```bash
node cli.js init
```

This creates `mutant-test-gen.config.js` with default settings. You can customize:

- **Target Mutation Score**: Desired mutation score percentage (default: 80%)
- **Max Iterations**: Maximum feedback loop iterations (default: 5)
- **LLM Model**: OpenAI model to use (default: gpt-4)
- **Test Framework**: Testing framework (default: Jest)
- **Mutators**: Which mutation operators to apply

Example configuration:

```javascript
module.exports = {
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
  },
  mutationTesting: {
    targetMutationScore: 80,
    maxIterations: 5,
    mutators: ['ArithmeticOperator', 'LogicalOperator', ...],
  },
  testGeneration: {
    framework: 'jest',
    outputDir: 'tests',
  },
};
```

## Usage

### CLI Commands

#### Generate Tests

```bash
node cli.js generate <files...> [options]
```

Options:
- `-c, --config <path>`: Path to configuration file
- `-t, --target <score>`: Target mutation score (0-100)
- `-i, --iterations <count>`: Maximum feedback iterations
- `-m, --model <name>`: LLM model to use

Examples:

```bash
# Generate tests for a single file
node cli.js generate src/calculator.js

# Generate with custom target score
node cli.js generate src/*.js --target 90

# Use custom configuration
node cli.js generate src/*.js --config ./my-config.js

# Use GPT-3.5 for faster/cheaper generation
node cli.js generate src/*.js --model gpt-3.5-turbo
```

#### Initialize Configuration

```bash
node cli.js init [options]
```

Options:
- `-o, --output <path>`: Output path for config file

### Programmatic API

```javascript
const MutantTestGenJS = require('./src/index');
const config = require('./config/default.config');

const mutantTestGen = new MutantTestGenJS(config);

// Generate tests for files
const result = await mutantTestGen.run(['src/calculator.js']);

console.log(`Average mutation score: ${result.summary.averageMutationScore}%`);
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
├── src/
│   ├── core/
│   │   ├── mutation-engine.js    # Mutation testing orchestration
│   │   └── test-generator.js     # Test generation with feedback loop
│   ├── llm/
│   │   └── openai-client.js      # OpenAI API integration
│   ├── utils/
│   │   └── logger.js             # Logging utility
│   └── index.js                  # Main orchestrator
├── config/
│   └── default.config.js         # Default configuration
├── examples/
│   ├── calculator.js             # Example source file
│   └── string-utils.js           # Example source file
├── tests/                        # Generated tests
├── reports/                      # Mutation testing reports
├── cli.js                        # CLI interface
└── package.json
```

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