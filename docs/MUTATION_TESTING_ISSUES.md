# Mutation Testing Issues & Workarounds

## ⚠️ Current Status

**Mutation testing tích hợp trong tool hiện đang có issues và đã được DISABLED mặc định.**

## 🐛 Lỗi `spawn npx ENOENT`

### Nguyên nhân:
```
2025-10-23 11:40:21 [error]: Mutation testing failed {"error":"spawn npx ENOENT"}
```

Lỗi này xảy ra khi Node.js spawn process không tìm thấy `npx` command trên Windows.

### ✅ Đã fix:
Thêm `shell: true` vào spawn options trong `stryker-adapter.js`:

```javascript
// TRƯỚC (bị lỗi trên Windows)
spawn('npx', ['stryker', 'run'], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

// SAU (hoạt động trên Windows)
spawn('npx', ['stryker', 'run'], {
  stdio: 'inherit',
  cwd: process.cwd(),
  shell: true, // ← Fix cho Windows
});
```

---

## 🐛 Issues Còn Lại

### 1. Path Mismatch Issue

**Vấn đề:** Test file được generate với incorrect import paths.

**Ví dụ:**
```javascript
// File: test_example/calculator.test.js
const Calculator = require('./calculator');  // ❌ Sai path!

// Nên là:
const Calculator = require('../examples/calculator');  // ✅ Đúng
```

**Impact:** Tests không chạy được, mutation testing fail.

### 2. Jest Configuration Missing

Stryker cần Jest config đúng để tìm và chạy tests, nhưng:
- Jest config không khớp với test output directories
- Test files ở custom locations (`test_example/`) không được Jest detect

---

## 🔧 Workarounds

### Option 1: Disable Mutation Analysis (Mặc định)

Config đã được set:
```javascript
runMutationAnalysis: false  // Disabled
```

**Pros:**
- ✅ Tool hoạt động smooth
- ✅ Vẫn generate được tests
- ✅ Không bị hang/timeout

**Cons:**
- ❌ Không có mutation score feedback
- ❌ Không biết test quality
- ❌ Feedback loop không hoạt động

### Option 2: Manual Mutation Testing

Generate tests trước, sau đó manually run mutation:

```bash
# Step 1: Generate tests
mutant-test-gen generate examples/calculator.js -o tests

# Step 2: Fix import paths trong test file
# Edit tests/calculator.test.js:
const Calculator = require('../examples/calculator');

# Step 3: Run tests để verify
npm test tests/calculator.test.js

# Step 4: Run mutation testing manually
npx stryker run
```

### Option 3: Use Standard Directory Structure

Đặt tests vào thư mục Jest expects:

```bash
# Generate vào standard test directory
mutant-test-gen generate src/calculator.js -o __tests__

# Hoặc
mutant-test-gen generate src/calculator.js -o tests

# Với structure:
project/
  src/
    calculator.js
  tests/  hoặc __tests__/
    calculator.test.js
```

---

## 🎯 Recommended Workflow (Hiện tại)

### For Simple Test Generation:
```bash
# 1. Generate tests (mutation disabled)
mutant-test-gen generate examples/calculator.js -o tests

# 2. Manually fix import paths nếu cần
# Edit generated test file

# 3. Run tests
npm test

# 4. (Optional) Run mutation manually
npx stryker run
```

### For Feedback Loop:
**⚠️ KHÔNG KHUYẾN NGHỊ hiện tại** - Feedback loop cần mutation testing hoạt động.

Chờ fixes hoàn chỉnh trước khi dùng:
```bash
# Sẽ lỗi vì mutation testing issues
mutant-test-gen generate file.js --feedback  # ❌
```

---

## 🔨 TODO: Cần Fix Để Enable Mutation Testing

### High Priority:
1. **Path Resolution** - LLM cần biết correct relative paths
   - Pass source file location info to LLM
   - Generate correct require/import statements
   
2. **Jest Configuration** - Ensure tests are discoverable
   - Update jest.config.js để support custom test dirs
   - Hoặc enforce standard test directory structure

3. **Stryker Configuration** - Better integration
   - Dynamic config generation dựa trên actual paths
   - Handle different project structures

### Medium Priority:
4. **Better Error Handling** - Graceful degradation
   - Fallback khi mutation fails
   - Clear error messages
   - Option để skip mutation

5. **Validation** - Check setup trước khi chạy
   - Verify Jest is configured
   - Verify Stryker can run
   - Validate paths exist

### Low Priority:
6. **Documentation** - Comprehensive setup guide
7. **Examples** - Working mutation testing examples
8. **Tests** - Unit tests cho mutation adapter

---

## 🧪 Testing Mutation Manually

Nếu muốn test mutation analysis độc lập:

### 1. Create Stryker Config:
```javascript
// stryker.conf.json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "reporters": ["html", "clear-text", "progress"],
  "testRunner": "jest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "examples/**/*.js",
    "!examples/**/*.test.js"
  ]
}
```

### 2. Run Stryker:
```bash
npx stryker run
```

### 3. View Results:
```bash
# HTML report
start reports/mutation/html/index.html

# Console output shows mutation score
```

---

## 💡 Best Practices (Until Fixed)

### ✅ DO:
- Use tool for initial test generation
- Manually fix import paths
- Run tests with `npm test`
- Use mutation testing separately if needed
- Keep `runMutationAnalysis: false` in config

### ❌ DON'T:
- Don't enable `--feedback` flag yet
- Don't set `runMutationAnalysis: true`
- Don't expect mutation scores in output
- Don't rely on automatic path resolution

---

## 📊 Status Summary

| Feature | Status | Note |
|---------|--------|------|
| Test Generation | ✅ Working | LLM generates good tests |
| Azure OpenAI | ✅ Working | Fully integrated |
| Simple Mode | ✅ Working | Fast, reliable |
| Path Resolution | ⚠️ Manual Fix | Need to adjust imports |
| Mutation Testing | ❌ Disabled | Issues with paths & config |
| Feedback Loop | ❌ Not Working | Depends on mutation |
| Windows Support | ✅ Fixed | `shell: true` added |

---

## 🎓 For Interns

**Good Learning Project:** Fix mutation testing integration!

### Tasks:
1. Study how Stryker finds and runs tests
2. Implement smart path resolution for imports
3. Create dynamic Jest/Stryker config generation
4. Add validation checks
5. Write integration tests

### Learning Outcomes:
- Node.js child processes
- Path manipulation
- Tool integration
- Error handling
- Testing strategies

---

## 📞 Current Recommendation

**Đơn giản là:**
1. ✅ Dùng tool để generate tests
2. ✅ Manually fix paths nếu cần
3. ✅ Run tests với Jest
4. ⚠️ Run mutation testing riêng nếu muốn
5. ❌ Tạm KHÔNG dùng feedback loop

Tool vẫn rất hữu ích cho test generation, chỉ là mutation integration cần thêm công sức!
