# CLI Improvements - Output Path Display

## 🎯 Problem
Users didn't know where the generated test files were saved. The CLI would complete but not show the output location.

## ✅ Solution Implemented

### 1. **Added `-o, --output` Option**
```bash
mutant-test-gen generate src/file.js --output my-tests
```

Users can now specify custom output directory (default: `tests`)

### 2. **Enhanced Console Output**

#### Before Generation:
```
📝 Generating tests for: /path/to/source.js
📁 Output directory: /path/to/project/tests
📄 Test file: source.test.js
```

#### After Completion (Single File):
```
✅ Test generation completed successfully!

📊 Summary:
  Total files: 1
  Successful: 1
  Failed: 0

📄 Generated test file:
  /absolute/path/to/tests/source.test.js

💡 Next steps:
  1. Review the generated tests
  2. Run: npm test
  3. Adjust tests as needed
```

#### After Completion (Batch):
```
✅ Test generation completed successfully!

📊 Summary:
  Total files: 5
  Successful: 5
  Failed: 0
  Duration: 45s

📁 Tests generated in:
  /absolute/path/to/tests

💡 Next steps:
  1. Review the generated tests
  2. Run: npm test
  3. Adjust tests as needed
```

#### On Failure:
```
❌ Test generation failed
  Successful: 3/5
  Failed: 2/5
```

### 3. **Updated Documentation**

#### README.md Examples:
```bash
# Single file
mutant-test-gen generate examples/calculator.js
# Output: tests/calculator.test.js

# Custom output directory
mutant-test-gen generate examples/calculator.js --output my-tests
# Output: my-tests/calculator.test.js

# Multiple files
mutant-test-gen generate "src/**/*.js"
# Output: tests/*.test.js
```

#### Added "Output Structure" Section:
Shows clear folder structure and example of generated test file.

### 4. **CLI Help Updated**
```bash
$ mutant-test-gen generate --help

Options:
  -c, --config <path>       Path to configuration file
  -o, --output <dir>        Output directory for generated tests (default: tests)
  -t, --target <score>      Target mutation score (0-100) (default: "80")
  -i, --iterations <count>  Maximum feedback iterations (default: "5")
  -m, --model <name>        LLM model to use (default: "gpt-4")
```

## 📝 Changes Made

### Files Modified:
1. **cli.js**
   - Added `--output` option
   - Show output paths before generation starts
   - Display absolute paths in completion message
   - Added helpful "Next steps" section
   - Better error messages with counts

2. **README.md**
   - Added output path comments in examples
   - New "Output Structure" section
   - Updated CLI options documentation
   - Added example of generated test file

## 🎨 User Experience Improvements

| Before | After |
|--------|-------|
| ❌ No info about output location | ✅ Shows output directory upfront |
| ❌ Silent completion | ✅ Clear success message with paths |
| ❌ Hard-coded `tests/` directory | ✅ Customizable with `--output` |
| ❌ No guidance after completion | ✅ "Next steps" suggestions |
| ❌ Vague error messages | ✅ Detailed failure counts |

## 🚀 Usage Examples

### Basic Usage
```bash
mutant-test-gen generate src/calculator.js
```

Output:
```
📝 Generating tests for: /Users/dev/project/src/calculator.js
📁 Output directory: /Users/dev/project/tests
📄 Test file: calculator.test.js

[... generation process ...]

✅ Test generation completed successfully!
📄 Generated test file:
  /Users/dev/project/tests/calculator.test.js
```

### Custom Output
```bash
mutant-test-gen generate src/calculator.js --output test-suite
```

Output:
```
📝 Generating tests for: /Users/dev/project/src/calculator.js
📁 Output directory: /Users/dev/project/test-suite
📄 Test file: calculator.test.js

[... generation process ...]

✅ Test generation completed successfully!
📄 Generated test file:
  /Users/dev/project/test-suite/calculator.test.js
```

### Batch Processing
```bash
mutant-test-gen generate "src/**/*.js" --output tests
```

Output:
```
📝 Batch processing 1 file pattern(s)
📁 Output directory: /Users/dev/project/tests

[... generation process ...]

✅ Test generation completed successfully!

📊 Summary:
  Total files: 5
  Successful: 5
  Failed: 0
  Duration: 45s

📁 Tests generated in:
  /Users/dev/project/tests
```

## 🎯 Benefits

1. **Transparency**: Users always know where files are saved
2. **Flexibility**: Custom output directories for different workflows
3. **Guidance**: Clear next steps after generation
4. **Professionalism**: Clean, informative output with emojis
5. **Error Clarity**: Better failure information

---

*Implemented: October 17, 2025*
*Impact: Improved user experience and clarity*
