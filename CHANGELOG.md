# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-23

### Added

- Initial release of Mutant Test Gen JS
- LLM-based test generation using OpenAI and Azure OpenAI
- Full Azure OpenAI support with deployment configuration
- Mutation testing integration with Stryker
- Feedback loop for iterative test improvement
- CLI interface for easy usage
- Configuration system with default and custom configs
- Comprehensive logging with Winston
- Example source files (calculator, string utilities)
- Complete documentation:
  - README with usage instructions
  - Quick Start guide
  - Architecture documentation
  - API documentation
  - Troubleshooting guide
  - Contributing guidelines
- Support for JavaScript projects with Jest
- Automatic report generation (JSON and HTML)
- Customizable target mutation scores
- Configurable iteration limits
- Multiple file processing support
- Glob pattern support for file selection

### Features

- **Test Generation**: Generate comprehensive unit tests using GPT-4 or GPT-3.5
- **Mutation Testing**: Identify weak spots in tests using Stryker
- **Feedback Loop**: Automatically improve tests based on survived mutants
- **High-Quality Tests**: Achieve target mutation scores (default 80%)
- **Flexible Configuration**: Customize via config files or CLI options
- **Detailed Reports**: JSON and HTML reports for mutation results
- **Batch Processing**: Process multiple files in one run
- **Error Handling**: Graceful degradation and detailed error messages
- **Logging**: Structured logging to console and file

### Supported

- JavaScript (ES6+, CommonJS)
- Jest testing framework
- OpenAI (GPT-4, GPT-4-turbo, GPT-3.5-turbo)
- Azure OpenAI Service (all GPT models)
- Clean Architecture pattern for maintainability
- Stryker mutation testing framework
- Node.js 14+

### Configuration Options

- LLM model selection
- Target mutation score (0-100)
- Maximum iterations
- Temperature and token limits
- Test framework settings
- Output directories
- Logging levels

### CLI Commands

- `generate`: Generate tests for source files
- `init`: Initialize configuration file

## [Unreleased]

### Planned

- Python language support
- TypeScript support
- Additional LLM providers (Anthropic Claude, local models)
- Web UI for monitoring and configuration
- CI/CD integration examples
- Support for more test frameworks (Mocha, Vitest)
- Parallel file processing
- Custom mutation operators
- Test quality metrics beyond mutation score
- AST-based intelligent test merging
- Incremental testing (only changed files)
- Cost estimation and tracking
- Custom prompt templates
- Interactive mode for reviewing generated tests

### Known Issues

- ESM modules require workarounds
- TypeScript requires additional configuration
- Large files may hit token limits
- Mutation testing can be slow for large codebases

## Version History

- **1.0.0** (2024-10-16): Initial release

---

For more information, see the [README](README.md) and [documentation](docs/).
