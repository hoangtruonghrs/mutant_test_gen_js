# Testing Strategy & Recommendations

## Current Status: ❌ NO TESTS

The project currently has **ZERO test coverage**, which is ironic for a test generation tool.

## Priority Levels

### 🔴 P0 - Critical (Implement Immediately)

#### 1. Unit Tests for Core Entities
- `lib/core/entities/source-file.js`
- `lib/core/entities/test-file.js`
- `lib/core/entities/mutation-result.js`
- `lib/core/entities/generation-session.js`

**Coverage Target**: 80%+

#### 2. Unit Tests for Services
- `lib/core/services/test-generation-service.js`
- `lib/core/services/mutation-analysis-service.js`
- `lib/core/services/feedback-loop-service.js`

**Strategy**: Mock all adapters

#### 3. Unit Tests for Adapters
- Mock external APIs (OpenAI, Azure)
- Mock file system operations
- Mock Stryker CLI

### 🟡 P1 - High Priority

#### 4. Integration Tests
- End-to-end workflow tests
- Real LLM API tests (with test API keys)
- Stryker integration tests

#### 5. Use Case Tests
- `GenerateTestsUseCase`
- `ImproveTestsUseCase`
- `BatchProcessUseCase`

### 🟢 P2 - Medium Priority

#### 6. CLI Tests
- Command parsing
- Error handling
- Output formatting

#### 7. Configuration Tests
- Config loading
- Environment variables
- Validation

## Test Structure Recommendation

```
tests/
├── unit/
│   ├── entities/
│   │   ├── source-file.test.js
│   │   ├── test-file.test.js
│   │   ├── mutation-result.test.js
│   │   └── generation-session.test.js
│   ├── services/
│   │   ├── test-generation-service.test.js
│   │   ├── mutation-analysis-service.test.js
│   │   └── feedback-loop-service.test.js
│   ├── adapters/
│   │   ├── llm/
│   │   │   ├── openai-adapter.test.js
│   │   │   ├── azure-adapter.test.js
│   │   │   └── llm-adapter-factory.test.js
│   │   ├── mutation/
│   │   │   └── stryker-adapter.test.js
│   │   └── storage/
│   │       └── fs-storage.test.js
│   └── use-cases/
│       ├── generate-tests-use-case.test.js
│       ├── improve-tests-use-case.test.js
│       └── batch-process-use-case.test.js
├── integration/
│   ├── e2e-workflow.test.js
│   ├── llm-integration.test.js
│   ├── stryker-integration.test.js
│   └── batch-processing.test.js
├── cli/
│   ├── commands.test.js
│   ├── error-handling.test.js
│   └── output-formatting.test.js
├── fixtures/
│   ├── sample-source-files/
│   ├── sample-test-files/
│   └── mock-responses/
└── helpers/
    ├── mock-llm-adapter.js
    ├── mock-mutation-engine.js
    └── test-utils.js
```

## Example Test Templates

### Unit Test Example

```javascript
// tests/unit/entities/source-file.test.js
const SourceFile = require('../../../lib/core/entities/source-file');

describe('SourceFile Entity', () => {
  describe('constructor', () => {
    it('should create source file with required properties', () => {
      const file = new SourceFile('test.js', 'const x = 1;', '/path/test.js');
      
      expect(file.getFileName()).toBe('test.js');
      expect(file.getContent()).toBe('const x = 1;');
      expect(file.getPath()).toBe('/path/test.js');
    });
  });

  describe('extractFunctions', () => {
    it('should extract function declarations', () => {
      const code = `
        function add(a, b) { return a + b; }
        function subtract(a, b) { return a - b; }
      `;
      const file = new SourceFile('math.js', code);
      
      const functions = file.extractFunctions();
      
      expect(functions).toHaveLength(2);
      expect(functions[0].name).toBe('add');
      expect(functions[1].name).toBe('subtract');
    });

    it('should extract arrow functions', () => {
      const code = 'const multiply = (a, b) => a * b;';
      const file = new SourceFile('math.js', code);
      
      const functions = file.extractFunctions();
      
      expect(functions).toHaveLength(1);
      expect(functions[0].name).toBe('multiply');
    });
  });

  describe('validate', () => {
    it('should return true for valid JavaScript', () => {
      const file = new SourceFile('test.js', 'const x = 1;');
      expect(file.validate()).toBe(true);
    });

    it('should return false for invalid JavaScript', () => {
      const file = new SourceFile('test.js', 'const x = ;');
      expect(file.validate()).toBe(false);
    });
  });
});
```

### Service Test with Mocks

```javascript
// tests/unit/services/test-generation-service.test.js
const TestGenerationService = require('../../../lib/core/services/test-generation-service');
const SourceFile = require('../../../lib/core/entities/source-file');
const TestFile = require('../../../lib/core/entities/test-file');

describe('TestGenerationService', () => {
  let service;
  let mockLLMFactory;
  let mockLLMAdapter;
  let mockLogger;

  beforeEach(() => {
    mockLLMAdapter = {
      generateTests: jest.fn(),
      improveTests: jest.fn()
    };

    mockLLMFactory = {
      createAdapter: jest.fn().mockReturnValue(mockLLMAdapter)
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    service = new TestGenerationService(mockLLMFactory, mockLogger);
  });

  describe('generateInitialTests', () => {
    it('should generate tests using LLM adapter', async () => {
      const sourceFile = new SourceFile('calc.js', 'function add(a,b) { return a+b; }');
      const mockTestCode = 'describe("add", () => { it("should add", () => {}); });';
      
      mockLLMAdapter.generateTests.mockResolvedValue(mockTestCode);

      const result = await service.generateInitialTests(sourceFile, {});

      expect(mockLLMAdapter.generateTests).toHaveBeenCalledWith(
        sourceFile.getContent(),
        sourceFile.getFileName(),
        expect.any(Object)
      );
      expect(result).toBeInstanceOf(TestFile);
      expect(result.getContent()).toContain('describe');
    });

    it('should handle LLM errors gracefully', async () => {
      const sourceFile = new SourceFile('calc.js', 'function add(a,b) { return a+b; }');
      
      mockLLMAdapter.generateTests.mockRejectedValue(new Error('API Error'));

      await expect(service.generateInitialTests(sourceFile, {}))
        .rejects.toThrow('API Error');
      
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
```

### Integration Test Example

```javascript
// tests/integration/e2e-workflow.test.js
const { createApplication } = require('../../index');
const fs = require('fs').promises;
const path = require('path');

describe('E2E Test Generation Workflow', () => {
  let app;
  const testFixturesDir = path.join(__dirname, '../fixtures');
  const outputDir = path.join(__dirname, '../output');

  beforeAll(async () => {
    // Create output directory
    await fs.mkdir(outputDir, { recursive: true });

    // Initialize application with test config
    app = createApplication({
      llm: {
        provider: 'openai',
        apiKey: process.env.TEST_OPENAI_API_KEY || 'test-key',
        model: 'gpt-3.5-turbo'
      },
      targetMutationScore: 70,
      maxIterations: 2
    });
  });

  afterAll(async () => {
    await app.cleanup();
    // Clean up output directory
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('should generate tests for a simple calculator', async () => {
    const sourcePath = path.join(testFixturesDir, 'calculator.js');
    const outputPath = path.join(outputDir, 'calculator.test.js');

    const result = await app.generateTests({
      sourcePath,
      outputPath,
      useFeedbackLoop: false
    });

    expect(result.success).toBe(true);
    expect(result.testFile).toBe(outputPath);

    // Verify test file was created
    const exists = await fs.access(outputPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);

    // Verify test file contains expected structure
    const content = await fs.readFile(outputPath, 'utf-8');
    expect(content).toContain('describe');
    expect(content).toContain('it(');
    expect(content).toContain('expect');
  }, 60000); // 60s timeout for LLM API
});
```

## Test Utilities

```javascript
// tests/helpers/mock-llm-adapter.js
class MockLLMAdapter {
  constructor() {
    this.generateTestsCallCount = 0;
    this.improveTestsCallCount = 0;
  }

  async generateTests(sourceCode, fileName, context) {
    this.generateTestsCallCount++;
    return `
describe('${fileName}', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
    `.trim();
  }

  async improveTests(sourceCode, existingTests, mutants, context) {
    this.improveTestsCallCount++;
    return existingTests + `
  it('should handle edge case', () => {
    expect(true).toBe(true);
  });
`;
  }
}

module.exports = MockLLMAdapter;
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          TEST_OPENAI_API_KEY: ${{ secrets.TEST_OPENAI_API_KEY }}
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration --runInBand",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```

## Coverage Targets

- **Overall**: 70%+
- **Entities**: 90%+
- **Services**: 80%+
- **Adapters**: 70%+
- **Use Cases**: 80%+

## Next Steps

1. **Week 1**: Unit tests for entities (P0)
2. **Week 2**: Unit tests for services with mocks (P0)
3. **Week 3**: Unit tests for adapters (P0)
4. **Week 4**: Integration tests (P1)
5. **Week 5**: CLI tests + Coverage review (P2)

## Resources

- Jest Documentation: https://jestjs.io/
- Testing Best Practices: https://testingjavascript.com/
- Mock Strategies: https://jestjs.io/docs/mock-functions
