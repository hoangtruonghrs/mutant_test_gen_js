# Testing Documentation

Comprehensive testing documentation for the Mutant Test Generator project.

## 📚 Quick Navigation

### 📋 Planning & Strategy
- **[Testing Plan](./TESTING_PLAN.md)** - Overall testing strategy, timeline, and methodology

### 📊 Progress Tracking
- **[Phase 1 Progress](./PHASE1_PROGRESS.md)** - Current implementation status and metrics
  - Test infrastructure setup ✅
  - Entity layer testing ✅ (98.63% coverage)
  - Service layer testing 🔄 (19.29% coverage - in progress)

### 📖 Detailed Reports

#### By Layer
- **[Entity Tests Summary](./ENTITY_TESTS_SUMMARY.md)** - Entity layer test breakdown
  - SourceFile (100% coverage, 34 tests)
  - TestFile (93.87% coverage, 27 tests)
  - MutationResult (100% coverage, 31 tests)
  - GenerationSession (100% coverage, 45 tests)

- **[Service Layer Progress](./SERVICE_LAYER_PROGRESS.md)** - Service layer test status
  - TestGenerationService ✅ (97.05% coverage, 34 tests)
  - MutationAnalysisService ⏳ (pending)
  - FeedbackLoopService ⏳ (pending)

## 📈 Current Status

```
Overall Test Coverage: 20.66%
Total Tests: 171 passing
Test Suites: 5 passing

By Layer:
├── Entities:        98.63% ✅ (137 tests)
├── Services:        19.29% 🔄 (34 tests, 1/3 complete)
├── Use Cases:        0.00% ⏳ (not started)
├── Adapters:         0.00% ⏳ (not started)
└── Application:      0.00% ⏳ (not started)
```

## 🎯 Testing Targets

| Layer | Target Coverage | Current | Status |
|-------|----------------|---------|--------|
| Entities | 90%+ | 98.63% | ✅ Complete |
| Services | 70%+ | 19.29% | 🔄 In Progress |
| Use Cases | 70%+ | 0% | ⏳ Pending |
| Adapters | 60%+ | 0% | ⏳ Pending |
| Overall | 70%+ | 20.66% | 🔄 In Progress |

## 🛠️ Test Infrastructure

### Test Structure
```
tests/
├── helpers/              # Reusable test utilities
│   └── test-helpers.js   # Temp files, console capture, assertions
├── mocks/                # Mock implementations
│   ├── mock-llm-adapter.js
│   ├── mock-mutation-adapter.js
│   ├── mock-storage-adapter.js
│   └── mock-factory.js
├── fixtures/             # Test data
│   └── sample-data.js    # Sample code, configs, sessions
├── entities/             # Entity tests
│   ├── source-file.test.js
│   ├── test-file.test.js
│   ├── mutation-result.test.js
│   └── generation-session.test.js
└── services/             # Service tests
    └── test-generation-service.test.js
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- tests/entities/source-file.test.js

# Run in watch mode
npm test -- --watch

# Run with verbose output
npm test -- --verbose
```

### Coverage Reports

After running tests with coverage:
- **Terminal**: Summary in console
- **HTML**: Open `coverage/lcov-report/index.html` in browser
- **JSON**: `coverage/coverage-summary.json` for CI/CD

## 📝 Testing Standards

### Test Structure (AAA Pattern)
```javascript
describe('Component', () => {
  test('should do something', () => {
    // Arrange - Setup
    const input = 'test';
    
    // Act - Execute
    const result = doSomething(input);
    
    // Assert - Verify
    expect(result).toBe('expected');
  });
});
```

### Best Practices
✅ Test one thing per test case
✅ Use descriptive test names
✅ Test both success and error paths
✅ Test edge cases (null, empty, boundary values)
✅ Use mocks for external dependencies
✅ Keep tests fast and isolated
✅ Avoid test interdependencies

## 🔗 Related Documentation

- [Architecture](../ARCHITECTURE.md) - System architecture overview
- [API Documentation](../API.md) - API reference
- [Troubleshooting](../TROUBLESHOOTING.md) - Common issues and solutions

## 🚀 Next Steps

1. **Complete Service Layer** (Week 3)
   - MutationAnalysisService tests
   - FeedbackLoopService tests
   - Target: 70%+ service coverage

2. **Adapter Layer** (Week 3-4)
   - OpenAI/Azure adapter tests
   - Stryker adapter tests
   - FileSystem storage tests

3. **Use Cases** (Week 4)
   - Workflow integration tests
   - End-to-end scenarios
   - Error propagation tests

4. **CI/CD Integration** (Week 4)
   - GitHub Actions setup
   - Automated test runs
   - Coverage reporting

---

*Last Updated: October 17, 2025*
*Maintained by: Development Team*
