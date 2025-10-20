# 🎯 Quick Start Guide - Try it in 5 Minutes!

Complete guide for newcomers to quickly test the Mutant Test Generator with example files.

## Prerequisites

- Node.js 14+ installed
- OpenAI API key OR Azure OpenAI access

## 📦 Step 1: Installation (2 minutes)

```bash
# Clone the repository
git clone https://github.com/hoangtruonghrs/mutant_test_gen_js.git
cd mutant_test_gen_js

# Install dependencies
npm install

# Link for global CLI access (optional)
npm link
```

## 🔑 Step 2: Set Up API Key (1 minute)

### Option A: OpenAI (Recommended for Quick Start)

```bash
# Windows (PowerShell)
$env:OPENAI_API_KEY="sk-your-api-key-here"

# macOS/Linux
export OPENAI_API_KEY="sk-your-api-key-here"
```

**Get your API key**: https://platform.openai.com/api-keys

### Option B: Azure OpenAI

```bash
# Windows (PowerShell)
$env:AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
$env:AZURE_OPENAI_API_KEY="your-azure-api-key"
$env:AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4"

# macOS/Linux
export AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com"
export AZURE_OPENAI_API_KEY="your-azure-api-key"
export AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4"
```

**Recommended Azure Models** (Oct 2025):
- **🥇 Best Overall**: `gpt-4o` - Fast, accurate, cost-effective (recommended!)
- **🥈 High Quality**: `gpt-4-turbo` - Excellent balance, 128K context
- **🥉 Reliable**: `gpt-4` - Proven baseline quality
- **💰 Budget**: `gpt-35-turbo` - Good for simple code

> 💡 **Tip**: Start with `gpt-35-turbo` for testing, use `gpt-4o` for production
> 
> 📚 **Note**: Models like GPT-4.5 or GPT-4.1 aren't official OpenAI releases. Current latest: GPT-4o (Oct 2024)

## 🚀 Step 3: Run Your First Test Generation (2 minutes)

### Example 1: Calculator (Simple)

```bash
# Generate tests for calculator
mutant-test-gen generate examples/calculator.js

# Expected output:
# 📝 Generating tests for: .../examples/calculator.js
# 📁 Output directory: .../tests
# 📄 Test file: calculator.test.js
# 
# ✅ Test generation completed successfully!
# 📄 Generated test file: .../tests/calculator.test.js
```

**View the generated test**:
```bash
cat tests/calculator.test.js
# or on Windows:
type tests\calculator.test.js
```

### Example 2: String Utils (Medium Complexity)

```bash
# Generate tests with custom output directory
mutant-test-gen generate examples/string-utils.js --output my-tests

# View the result
cat my-tests/string-utils.test.js
```

### Example 3: Generate All Examples at Once

```bash
# Batch processing
mutant-test-gen generate examples/*.js --output example-tests

# This will create:
# example-tests/calculator.test.js
# example-tests/string-utils.test.js
# example-tests/usage-example.test.js
```

## 📚 What's in the Examples?

### `calculator.js` - Perfect for Beginners
- Simple arithmetic operations (add, subtract, multiply, divide)
- Power and square root functions
- Error handling (division by zero)
- **Estimated generation time**: 30-60 seconds

### `string-utils.js` - Intermediate Level
- String manipulation utilities
- Input validation
- Edge case handling
- **Estimated generation time**: 45-90 seconds

### `usage-example.js` - Advanced
- User management class
- CRUD operations
- Complex business logic
- **Estimated generation time**: 60-120 seconds

## 🎨 Step 4: Customize Generation (Optional)

### Use a Specific Model

```bash
# Use GPT-4 for best quality
mutant-test-gen generate examples/calculator.js --model gpt-4

# Use GPT-3.5 for faster/cheaper generation
mutant-test-gen generate examples/calculator.js --model gpt-3.5-turbo
```

### Set Target Mutation Score

```bash
# Target 85% mutation score (more thorough tests)
mutant-test-gen generate examples/calculator.js --target 85

# Target 70% (faster, basic coverage)
mutant-test-gen generate examples/calculator.js --target 70
```

### Limit Iterations

```bash
# Maximum 3 improvement iterations
mutant-test-gen generate examples/calculator.js --iterations 3
```

### All Options Combined

```bash
mutant-test-gen generate examples/calculator.js \
  --output quality-tests \
  --target 90 \
  --iterations 5 \
  --model gpt-4
```

## ✅ Step 5: Run the Generated Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/calculator.test.js

# Run with coverage
npm test -- --coverage
```

**Expected output**:
```
PASS  tests/calculator.test.js
  Calculator
    ✓ should add two numbers (3 ms)
    ✓ should subtract numbers (1 ms)
    ✓ should multiply numbers (1 ms)
    ✓ should divide numbers (1 ms)
    ✓ should throw error on division by zero (2 ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
```

## 🎯 Quick Comparison: Which Example to Try First?

| Example | Complexity | Time | Best For |
|---------|-----------|------|----------|
| `calculator.js` | ⭐ Easy | ~45s | First-time users |
| `string-utils.js` | ⭐⭐ Medium | ~60s | Understanding edge cases |
| `usage-example.js` | ⭐⭐⭐ Advanced | ~90s | Complex scenarios |

**Recommendation**: Start with `calculator.js` → then try `string-utils.js` → finally `usage-example.js`

## 🔍 Understanding the Output

### Generated Test Structure

```javascript
// tests/calculator.test.js
const Calculator = require('../examples/calculator');

describe('Calculator', () => {
  let calculator;
  
  beforeEach(() => {
    calculator = new Calculator();
  });
  
  describe('add', () => {
    test('should add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });
    
    test('should add negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });
    
    test('should handle zero', () => {
      expect(calculator.add(0, 5)).toBe(5);
    });
  });
  
  // ... more test cases for other methods
});
```

### Files Created

```
your-project/
├── examples/
│   ├── calculator.js          ← Source file (provided)
│   └── string-utils.js        ← Source file (provided)
└── tests/                     ← Generated by tool
    ├── calculator.test.js     ← Generated tests ✨
    └── string-utils.test.js   ← Generated tests ✨
```

## 💡 Pro Tips

### 1. **Review Before Using**
Always review generated tests before committing. The LLM is smart but not perfect.

### 2. **Start Small**
Test with one file first, then scale to batch processing.

### 3. **Adjust Target Score**
- **70-80%**: Good baseline for most code
- **80-90%**: High quality, thorough testing
- **90%+**: Critical code, may require manual refinement

### 4. **Monitor API Costs**
```bash
# Use GPT-3.5 for development/testing
mutant-test-gen generate examples/*.js --model gpt-3.5-turbo

# Use GPT-4 for production
mutant-test-gen generate src/*.js --model gpt-4
```

### 5. **Save Your Configuration**
```bash
# Create config file
mutant-test-gen init

# Edit mutant-test-gen.config.js with your preferences

# Use it
mutant-test-gen generate examples/calculator.js --config ./mutant-test-gen.config.js
```

## ❓ Troubleshooting

### "OpenAI API key not found"
```bash
# Check if key is set
echo $OPENAI_API_KEY      # macOS/Linux
echo $env:OPENAI_API_KEY  # Windows PowerShell

# If empty, set it again
export OPENAI_API_KEY="sk-..."
```

### "Module not found"
```bash
# Make sure dependencies are installed
npm install

# Try re-linking
npm link
```

### "Permission denied"
```bash
# On macOS/Linux, you may need sudo
sudo npm link
```

### "Tests not found"
Check that test files were generated in the correct directory:
```bash
ls tests/          # macOS/Linux
dir tests\         # Windows
```

## 🎓 Next Steps

After trying the examples:

1. **Read the Full Documentation**
   - [Architecture](./docs/ARCHITECTURE.md) - Understand system design
   - [API Reference](./docs/API.md) - Detailed API docs
   - [Testing](./docs/testing/README.md) - View our test suite

2. **Try on Your Own Code**
   ```bash
   mutant-test-gen generate src/your-file.js
   ```

3. **Explore Advanced Features**
   - Feedback loop with mutation testing
   - Batch processing multiple files
   - Custom configurations

4. **Integrate into Workflow**
   - Add to pre-commit hooks
   - Integrate with CI/CD
   - Automate test maintenance

## 📊 Example Results

Here's what you can expect when running the calculator example:

```bash
$ mutant-test-gen generate examples/calculator.js

📝 Generating tests for: /path/to/examples/calculator.js
📁 Output directory: /path/to/tests
📄 Test file: calculator.test.js

🤖 Analyzing source code...
📝 Generating initial test suite...
✨ Created 18 test cases
✅ All tests passing

✅ Test generation completed successfully!

📊 Summary:
  Total files: 1
  Successful: 1
  Failed: 0

📄 Generated test file:
  /path/to/tests/calculator.test.js

💡 Next steps:
  1. Review the generated tests
  2. Run: npm test
  3. Adjust tests as needed

$ npm test -- tests/calculator.test.js

PASS  tests/calculator.test.js
  Calculator
    add
      ✓ should add two positive numbers (2ms)
      ✓ should add negative numbers (1ms)
      ✓ should handle zero (1ms)
    subtract
      ✓ should subtract two numbers (1ms)
      ✓ should handle negative result (1ms)
    multiply
      ✓ should multiply two numbers (1ms)
      ✓ should handle zero multiplication (1ms)
    divide
      ✓ should divide two numbers (1ms)
      ✓ should throw error on division by zero (2ms)
      ✓ should handle decimal division (1ms)
    power
      ✓ should calculate power correctly (1ms)
      ✓ should handle zero exponent (1ms)
    sqrt
      ✓ should calculate square root (1ms)
      ✓ should throw error for negative numbers (2ms)

Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
Time:        0.842s
```

## 🎉 Success!

You've successfully:
- ✅ Installed the tool
- ✅ Set up API credentials
- ✅ Generated your first test
- ✅ Ran the tests

**Welcome to automated test generation!** 🚀

---

**Questions?** Check [Troubleshooting](./docs/TROUBLESHOOTING.md) or open an issue on GitHub.

**Want to learn more?** Read the [full documentation](./docs/README.md).
