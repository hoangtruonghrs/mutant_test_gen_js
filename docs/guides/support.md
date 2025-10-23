# Support

Thank you for using Mutant Test Gen JS! We're here to help.

## 📚 Documentation

Before seeking help, please check our comprehensive documentation:

- [README](./README.md) - Overview and basic usage
- [Quick Start Guide](./QUICKSTART.md) - 5-minute getting started
- [Installation Guide](./docs/INSTALLATION.md) - Detailed installation steps
- [API Documentation](./docs/API.md) - Complete API reference
- [Architecture Guide](./docs/ARCHITECTURE.md) - System design and structure
- [Troubleshooting](./docs/TROUBLESHOOTING.md) - Common issues and solutions
- [Azure Model Guide](./docs/AZURE_MODEL_GUIDE.md) - Azure OpenAI setup

## 🐛 Found a Bug?

1. Check [existing issues](https://github.com/hoangtruonghrs/mutant_test_gen_js/issues)
2. If new, [open an issue](https://github.com/hoangtruonghrs/mutant_test_gen_js/issues/new) with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
   - Error logs (if applicable)

## 💡 Feature Request?

We welcome feature requests! Please [open an issue](https://github.com/hoangtruonghrs/mutant_test_gen_js/issues/new) with:
- Clear use case description
- Why this feature would be valuable
- Proposed implementation (optional)

## 💬 Questions?

For questions and discussions:

1. Check [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)
2. Search [closed issues](https://github.com/hoangtruonghrs/mutant_test_gen_js/issues?q=is%3Aissue+is%3Aclosed)
3. Open a [new discussion](https://github.com/hoangtruonghrs/mutant_test_gen_js/discussions) or issue

## 🤝 Contributing

Want to contribute? See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## ⚡ Quick Help

### Common Issues

**Problem: "API key not set"**
```bash
# For OpenAI
export OPENAI_API_KEY=your-key

# For Azure OpenAI
export AZURE_OPENAI_ENDPOINT=your-endpoint
export AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
export OPENAI_API_KEY=your-azure-key
```

**Problem: "Module not found"**
```bash
npm install
```

**Problem: "Permission denied"**
```bash
# On Unix/macOS
chmod +x cli.js

# Or use npm link
npm link
```

**Problem: Tests not being generated**
- Check your LLM provider API key
- Verify source file path is correct
- Check logs in `logs/mutation-testing.log`
- Try with `--verbose` flag

### Getting Help Fast

When asking for help, include:
- Node.js version: `node --version`
- Package version: `mutant-test-gen --version`
- OS and version
- Complete error message
- Relevant config file (remove sensitive data!)

## 📧 Contact

For sensitive issues (security vulnerabilities), see [SECURITY.md](./SECURITY.md)

## 🌟 Support the Project

If this tool helps you:
- ⭐ Star the repository
- 📢 Share it with others
- 🐛 Report bugs
- 💻 Contribute code
- 📝 Improve documentation

Thank you for using Mutant Test Gen JS! 🚀
