# Contributing to Mutant Test Gen JS

Thank you for your interest in contributing to Mutant Test Gen JS! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/mutant_test_gen_js.git`
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 14 or higher
- npm or yarn
- OpenAI API key for testing

### Environment Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── core/           # Core functionality
│   ├── mutation-engine.js    # Mutation testing
│   └── test-generator.js     # Test generation
├── llm/            # LLM integration
│   └── openai-client.js      # OpenAI client
├── utils/          # Utility functions
│   └── logger.js             # Logging
└── index.js        # Main entry point
```

## Contribution Guidelines

### Code Style

- Use ES6+ features
- Follow existing code style
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions focused and small

### Commit Messages

Use clear, descriptive commit messages:

```
Add feature: Brief description

Longer explanation if needed.
- Bullet points for changes
- Multiple lines are okay
```

### Pull Request Process

1. Update README.md with details of changes if needed
2. Update CHANGELOG if applicable
3. Ensure all tests pass
4. Ensure code is linted
5. Update documentation for new features
6. Request review from maintainers

### Testing

- Write tests for new features
- Ensure existing tests pass
- Aim for good test coverage
- Test edge cases

## Areas for Contribution

### High Priority

- Python language support
- Additional LLM providers (Anthropic, local models)
- Better test merging strategies
- Performance optimizations

### Medium Priority

- Integration with CI/CD pipelines
- Web UI for monitoring
- Support for more test frameworks (Mocha, Vitest)
- Custom mutation operators

### Documentation

- Improve README examples
- Add tutorials
- Document API methods
- Add troubleshooting guide

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Questions about usage
- Suggestions for improvements

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Acknowledgments

Thank you for contributing to making mutation testing more accessible!
