/**
 * Unit tests for TestGenerationService
 */

const TestGenerationService = require('../../lib/core/services/test-generation-service');
const SourceFile = require('../../lib/core/entities/source-file');
const TestFile = require('../../lib/core/entities/test-file');
const { MockLLMAdapter, MockStorageAdapter } = require('../mocks');
const { sampleSourceCode, sampleTestCode } = require('../fixtures/sample-data');

describe('TestGenerationService', () => {
  let service;
  let mockLLMProvider;
  let mockStorageProvider;
  let mockLogger;
  let sourceFile;

  beforeEach(() => {
    mockLLMProvider = new MockLLMAdapter();
    mockStorageProvider = new MockStorageAdapter();
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    service = new TestGenerationService(
      mockLLMProvider,
      mockStorageProvider,
      mockLogger
    );

    sourceFile = new SourceFile('/src/calculator.js', sampleSourceCode);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should create service with required dependencies', () => {
      expect(service.llmProvider).toBe(mockLLMProvider);
      expect(service.storageProvider).toBe(mockStorageProvider);
      expect(service.logger).toBe(mockLogger);
    });
  });

  describe('generateInitialTests', () => {
    test('should generate initial tests successfully', async () => {
      mockLLMProvider.setResponses([{
        testCode: sampleTestCode,
        suggestions: ['Add edge cases'],
        confidence: 0.9
      }]);

      const testFile = await service.generateInitialTests(sourceFile);

      expect(testFile).toBeInstanceOf(TestFile);
      expect(testFile.content).toBe(sampleTestCode);
      expect(testFile.sourceFile).toBe(sourceFile);
      expect(mockLLMProvider.getCallCount()).toBe(1);
      expect(mockStorageProvider.getCallCount()).toBe(1);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Generating initial tests',
        expect.objectContaining({ sourceFile: 'calculator.js' })
      );
    });

    test('should prepare generation context correctly', async () => {
      mockLLMProvider.setResponses([{ testCode: sampleTestCode }]);

      await service.generateInitialTests(sourceFile, {
        context: { framework: 'jest' }
      });

      const call = mockLLMProvider.getLastCall();
      expect(call.method).toBe('generateTests');
      expect(call.args.sourceCode).toBe(sampleSourceCode);
      expect(call.args.context).toBeDefined();
    });

    test('should validate generated tests', async () => {
      mockLLMProvider.setResponses([
        'const x = 5;' // Invalid test (no describe/test/expect)
      ]);

      await expect(
        service.generateInitialTests(sourceFile)
      ).rejects.toThrow('Generated tests have invalid syntax');
    });

    test('should save test file to storage', async () => {
      mockLLMProvider.setResponses([{ testCode: sampleTestCode }]);

      await service.generateInitialTests(sourceFile);

      const saveCall = mockStorageProvider.getLastCall();
      expect(saveCall.method).toBe('saveFile');
      expect(saveCall.args.filePath).toContain('calculator.test.js');
      expect(saveCall.args.content).toBe(sampleTestCode);
    });

    test('should log success', async () => {
      mockLLMProvider.setResponses([{ testCode: sampleTestCode }]);

      await service.generateInitialTests(sourceFile);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Initial tests generated successfully',
        expect.objectContaining({
          sourceFile: 'calculator.js',
          testCases: expect.any(Number)
        })
      );
    });

    test('should handle LLM errors', async () => {
      mockLLMProvider.setShouldFail(true);

      await expect(
        service.generateInitialTests(sourceFile)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to generate initial tests',
        expect.objectContaining({
          sourceFile: 'calculator.js',
          error: expect.any(String)
        })
      );
    });

    test('should handle storage errors', async () => {
      mockLLMProvider.setResponses([{ testCode: sampleTestCode }]);
      mockStorageProvider.setShouldFail(true);

      await expect(
        service.generateInitialTests(sourceFile)
      ).rejects.toThrow('Storage error');
    });

    test('should include existing tests in context if provided', async () => {
      const existingTestPath = '/tests/existing.test.js';
      mockStorageProvider.setFile(existingTestPath, 'existing test content');
      mockLLMProvider.setResponses([{ testCode: sampleTestCode }]);

      await service.generateInitialTests(sourceFile, {
        existingTestFile: existingTestPath
      });

      // Verify storage was read
      const readCalls = mockStorageProvider.calls.filter(c => c.method === 'readFile');
      expect(readCalls.length).toBeGreaterThan(0);
    });
  });

  describe('improveTests', () => {
    let testFile;
    let survivedMutants;

    beforeEach(() => {
      testFile = new TestFile('/tests/calculator.test.js', sampleTestCode, sourceFile);
      survivedMutants = [
        {
          id: 1,
          mutatorName: 'ArithmeticOperator',
          location: { start: { line: 5, column: 10 } },
          replacement: 'a - b'
        },
        {
          id: 2,
          mutatorName: 'ConditionalExpression',
          location: { start: { line: 2, column: 7 } },
          replacement: 'false'
        }
      ];
    });

    test('should improve tests based on survived mutants', async () => {
      const improvedCode = sampleTestCode + '\ntest("new test", () => {});';
      mockLLMProvider.setResponses([{
        testCode: improvedCode,
        improvements: ['Added boundary tests']
      }]);

      const improved = await service.improveTests(
        sourceFile,
        testFile,
        survivedMutants
      );

      expect(improved).toBeInstanceOf(TestFile);
      expect(improved.version).toBeGreaterThan(1);
      expect(mockLLMProvider.getLastCall().method).toBe('improveTests');
    });

    test('should pass survived mutants to LLM', async () => {
      mockLLMProvider.setResponses([sampleTestCode]);

      await service.improveTests(sourceFile, testFile, survivedMutants);

      const call = mockLLMProvider.getLastCall();
      expect(call.args.survivedMutants).toBe(survivedMutants);
    });

    test('should update test file version', async () => {
      mockLLMProvider.setResponses([sampleTestCode]);
      const initialVersion = testFile.version;

      await service.improveTests(sourceFile, testFile, survivedMutants);

      expect(testFile.version).toBe(initialVersion + 1);
    });

    test('should save improved tests', async () => {
      mockLLMProvider.setResponses([{ testCode: sampleTestCode }]);

      await service.improveTests(sourceFile, testFile, survivedMutants);

      const saveCall = mockStorageProvider.getLastCall();
      expect(saveCall.method).toBe('saveFile');
      expect(saveCall.args.filePath).toBe(testFile.filePath);
    });

    test('should log improvement success', async () => {
      mockLLMProvider.setResponses([{ testCode: sampleTestCode }]);

      await service.improveTests(sourceFile, testFile, survivedMutants);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Tests improved successfully',
        expect.objectContaining({
          version: expect.any(Number)
        })
      );
    });

    test('should handle improvement errors', async () => {
      mockLLMProvider.setShouldFail(true);

      await expect(
        service.improveTests(sourceFile, testFile, survivedMutants)
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to improve tests',
        expect.any(Object)
      );
    });
  });

  describe('estimateGenerationCost', () => {
    test('should estimate cost for test generation', () => {
      const mockEstimate = {
        estimatedTokens: 1500,
        estimatedCost: 0.03,
        model: 'gpt-4'
      };
      
      mockLLMProvider.estimateCost = jest.fn().mockReturnValue(mockEstimate);

      const estimate = service.estimateGenerationCost(sourceFile);

      expect(estimate).toEqual(mockEstimate);
      expect(mockLLMProvider.estimateCost).toHaveBeenCalledWith(
        sourceFile.content,
        expect.objectContaining({
          sourceCodeLength: sourceFile.content.length,
          complexity: expect.any(Object)
        })
      );
    });

    test('should include custom options in estimation', () => {
      mockLLMProvider.estimateCost = jest.fn().mockReturnValue({});

      service.estimateGenerationCost(sourceFile, { maxTokens: 3000 });

      expect(mockLLMProvider.estimateCost).toHaveBeenCalledWith(
        sourceFile.content,
        expect.objectContaining({ maxTokens: 3000 })
      );
    });
  });

  describe('validateCapabilities', () => {
    test('should validate all providers are healthy', async () => {
      mockLLMProvider.isHealthy = jest.fn().mockResolvedValue(true);
      mockLLMProvider.getInfo = jest.fn().mockReturnValue({
        provider: 'openai',
        model: 'gpt-4'
      });
      mockStorageProvider.getInfo = jest.fn().mockReturnValue({
        type: 'filesystem'
      });

      const results = await service.validateCapabilities();

      expect(results.llmProvider.healthy).toBe(true);
      expect(results.llmProvider.info).toBeDefined();
      expect(results.storageProvider.healthy).toBe(true);
      expect(results.storageProvider.info).toBeDefined();
    });

    test('should handle LLM provider errors', async () => {
      mockLLMProvider.isHealthy = jest.fn().mockRejectedValue(
        new Error('Connection failed')
      );

      const results = await service.validateCapabilities();

      expect(results.llmProvider.healthy).toBe(false);
      expect(results.llmProvider.error).toBe('Connection failed');
    });

    test('should handle storage provider errors', async () => {
      mockLLMProvider.isHealthy = jest.fn().mockResolvedValue(true);
      mockLLMProvider.getInfo = jest.fn().mockReturnValue({});
      mockStorageProvider.getInfo = jest.fn().mockImplementation(() => {
        throw new Error('Storage unavailable');
      });

      const results = await service.validateCapabilities();

      expect(results.storageProvider.healthy).toBe(false);
      expect(results.storageProvider.error).toBe('Storage unavailable');
    });
  });

  describe('_prepareGenerationContext', () => {
    test('should prepare basic context', async () => {
      const context = await service._prepareGenerationContext(sourceFile, {});

      expect(context.fileName).toBe('calculator.js');
      expect(context.language).toBe('javascript');
      expect(context.complexity).toBeDefined();
      expect(context.functions).toBeInstanceOf(Array);
    });

    test('should include existing tests if provided', async () => {
      const existingPath = '/tests/existing.test.js';
      const existingContent = 'existing test code';
      mockStorageProvider.setFile(existingPath, existingContent);

      const context = await service._prepareGenerationContext(sourceFile, {
        existingTestFile: existingPath
      });

      expect(context.existingTests).toBe(existingContent);
    });

    test('should merge custom context', async () => {
      const customContext = {
        framework: 'jest',
        style: 'BDD'
      };

      const context = await service._prepareGenerationContext(sourceFile, {
        context: customContext
      });

      expect(context.framework).toBe('jest');
      expect(context.style).toBe('BDD');
    });
  });

  describe('_createTestFile', () => {
    test('should create test file from source file', () => {
      const testFile = service._createTestFile(sourceFile, sampleTestCode);

      expect(testFile).toBeInstanceOf(TestFile);
      expect(testFile.content).toBe(sampleTestCode);
      expect(testFile.sourceFile).toBe(sourceFile);
      expect(testFile.filePath).toContain('calculator.test.js');
    });
  });

  describe('_generateTestFilePath', () => {
    test('should generate test file path from source file', () => {
      const path = service._generateTestFilePath(sourceFile);

      expect(path).toContain('calculator.test.js');
      expect(path).toMatch(/tests\//);
    });

    test('should handle different file extensions', () => {
      const tsFile = new SourceFile('/src/utils.ts', 'const x = 5;');
      const path = service._generateTestFilePath(tsFile);

      expect(path).toContain('utils.test.js');
    });

    test('should handle files with multiple dots', () => {
      const complexFile = new SourceFile('/src/my.file.name.js', 'code');
      const path = service._generateTestFilePath(complexFile);

      expect(path).toContain('my.file.name.test.js');
    });
  });

  describe('_validateGeneratedTests', () => {
    test('should validate tests with proper structure', async () => {
      const validTestFile = new TestFile(
        '/tests/test.test.js',
        sampleTestCode,
        sourceFile
      );

      await expect(
        service._validateGeneratedTests(validTestFile)
      ).resolves.not.toThrow();
    });

    test('should reject tests without test cases', async () => {
      const invalidTestFile = new TestFile(
        '/tests/test.test.js',
        'const x = 5;',
        sourceFile
      );

      await expect(
        service._validateGeneratedTests(invalidTestFile)
      ).rejects.toThrow('Generated tests have invalid syntax');
    });

    test('should warn about missing describe blocks', async () => {
      const testWithoutDescribe = new TestFile(
        '/tests/test.test.js',
        'test("works", () => { expect(1).toBe(1); });',
        sourceFile
      );

      await expect(
        service._validateGeneratedTests(testWithoutDescribe)
      ).rejects.toThrow('Generated tests have invalid syntax');
    });

    test('should reject tests with invalid syntax', async () => {
      const invalidSyntax = new TestFile(
        '/tests/test.test.js',
        'just random text without test structure',
        sourceFile
      );

      await expect(
        service._validateGeneratedTests(invalidSyntax)
      ).rejects.toThrow('invalid syntax');
    });
  });

  describe('_mergeTests', () => {
    test('should merge tests by appending', () => {
      const existing = sampleTestCode;
      const improved = 'test("new test", () => {});';

      const merged = service._mergeTests(existing, improved);

      expect(merged).toContain(sampleTestCode.trim());
      expect(merged).toContain('new test');
    });

    test('should handle describe block merging', () => {
      const existing = `
describe('Suite', () => {
  test('test1', () => {});
});
      `.trim();

      const improved = `
describe('Suite', () => {
  test('test2', () => {});
});
      `.trim();

      const merged = service._mergeTests(existing, improved);

      expect(merged).toContain('test1');
      expect(merged).toContain('test2');
    });

    test('should force append when option is set', () => {
      const existing = 'existing tests';
      const improved = 'new tests';

      const merged = service._mergeTests(existing, improved, {
        forceAppend: true
      });

      expect(merged).toContain('existing tests');
      expect(merged).toContain('new tests');
    });
  });
});
