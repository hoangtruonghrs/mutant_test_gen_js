const SourceFile = require('../entities/source-file');
const TestFile = require('../entities/test-file');

/**
 * Test generation service responsible for coordinating LLM-based test generation
 */
class TestGenerationService {
  constructor(llmProvider, storageProvider, logger) {
    this.llmProvider = llmProvider;
    this.storageProvider = storageProvider;
    this.logger = logger;
  }

  /**
   * Generate initial tests for a source file
   * @param {SourceFile} sourceFile - Source file entity
   * @param {Object} options - Generation options
   * @returns {Promise<TestFile>} Generated test file
   */
  async generateInitialTests(sourceFile, options = {}) {
    this.logger.info('Generating initial tests', {
      sourceFile: sourceFile.getFileName(),
      complexity: sourceFile.getComplexityMetrics()
    });

    try {
      // Get LLM adapter - either passed in options or create from factory
      const llmAdapter = options.llmAdapter || this.llmProvider;

      // Prepare context for test generation
      const context = await this._prepareGenerationContext(sourceFile, options);

      // Generate tests using LLM
      const testCode = await llmAdapter.generateTests(
        sourceFile.content,
        sourceFile.getFileName(),
        context
      );

      // Create test file entity
      const testFile = this._createTestFile(sourceFile, testCode);

      // Validate generated tests
      await this._validateGeneratedTests(testFile);

      // Save test file
      await this.storageProvider.writeFile(testFile.filePath, testFile.content);

      this.logger.info('Initial tests generated successfully', {
        sourceFile: sourceFile.getFileName(),
        testFile: testFile.getFileName(),
        testCases: testFile.extractTestCases().length,
        size: testFile.content.length
      });

      return testFile;
    } catch (error) {
      this.logger.error('Failed to generate initial tests', {
        sourceFile: sourceFile.getFileName(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Improve existing tests based on mutation feedback
   * @param {SourceFile} sourceFile - Source file entity
   * @param {TestFile} testFile - Current test file
   * @param {Array} survivedMutants - Mutants that survived testing
   * @param {Object} options - Improvement options
   * @returns {Promise<TestFile>} Improved test file
   */
  async improveTests(sourceFile, testFile, survivedMutants, options = {}) {
    this.logger.info('Improving tests based on mutation feedback', {
      sourceFile: sourceFile.getFileName(),
      testFile: testFile.getFileName(),
      survivedMutants: survivedMutants.length
    });

    try {
      // Generate improved tests using LLM
      const improvedTestCode = await this.llmProvider.improveTests(
        sourceFile.content,
        testFile.content,
        survivedMutants
      );

      // Merge improved tests with existing ones
      const mergedTestCode = this._mergeTests(testFile.content, improvedTestCode, options);

      // Update test file
      testFile.updateContent(mergedTestCode, 'mutation_feedback');

      // Validate merged tests
      await this._validateGeneratedTests(testFile);

      // Save updated test file
      await this.storageProvider.writeFile(testFile.filePath, testFile.content);

      this.logger.info('Tests improved successfully', {
        sourceFile: sourceFile.getFileName(),
        testFile: testFile.getFileName(),
        newTestCases: testFile.extractTestCases().length,
        version: testFile.version
      });

      return testFile;
    } catch (error) {
      this.logger.error('Failed to improve tests', {
        sourceFile: sourceFile.getFileName(),
        testFile: testFile.getFileName(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Estimate test generation cost
   * @param {SourceFile} sourceFile - Source file entity
   * @param {Object} options - Estimation options
   * @returns {Object} Cost estimation
   */
  estimateGenerationCost(sourceFile, options = {}) {
    const context = {
      sourceCodeLength: sourceFile.content.length,
      complexity: sourceFile.getComplexityMetrics(),
      functions: sourceFile.extractFunctions().length
    };

    return this.llmProvider.estimateCost(sourceFile.content, {
      maxTokens: options.maxTokens || 2000,
      ...context
    });
  }

  /**
   * Validate test generation capabilities
   * @returns {Promise<Object>} Validation results
   */
  async validateCapabilities() {
    const results = {
      llmProvider: {
        healthy: false,
        info: null,
        error: null
      },
      storageProvider: {
        healthy: false,
        info: null,
        error: null
      }
    };

    try {
      // Check LLM provider health
      results.llmProvider.healthy = await this.llmProvider.isHealthy();
      results.llmProvider.info = this.llmProvider.getInfo();
    } catch (error) {
      results.llmProvider.error = error.message;
    }

    try {
      // Check storage provider
      results.storageProvider.info = this.storageProvider.getInfo();
      results.storageProvider.healthy = true;
    } catch (error) {
      results.storageProvider.error = error.message;
    }

    return results;
  }

  /**
   * Prepare context for test generation
   * @param {SourceFile} sourceFile - Source file entity
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation context
   * @private
   */
  async _prepareGenerationContext(sourceFile, options) {
    const context = {
      fileName: sourceFile.getFileName(),
      language: sourceFile.language,
      complexity: sourceFile.getComplexityMetrics(),
      functions: sourceFile.extractFunctions()
    };

    // Check for existing tests
    if (options.existingTestFile) {
      const existingContent = await this.storageProvider.readFile(options.existingTestFile);
      context.existingTests = existingContent;
    }

    // Add custom context
    if (options.context) {
      Object.assign(context, options.context);
    }

    return context;
  }

  /**
   * Create test file entity from source file and test code
   * @param {SourceFile} sourceFile - Source file entity
   * @param {string} testCode - Generated test code
   * @returns {TestFile} Test file entity
   * @private
   */
  _createTestFile(sourceFile, testCode) {
    const testFilePath = this._generateTestFilePath(sourceFile);
    return new TestFile(testFilePath, testCode, sourceFile);
  }

  /**
   * Generate test file path from source file
   * @param {SourceFile} sourceFile - Source file entity
   * @returns {string} Test file path
   * @private
   */
  _generateTestFilePath(sourceFile) {
    const fileName = sourceFile.getFileName();
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
    const testFileName = `${nameWithoutExt}.test.js`;

    // Return relative path in tests directory
    return `tests/${testFileName}`;
  }

  /**
   * Validate generated tests
   * @param {TestFile} testFile - Test file to validate
   * @returns {Promise<void>}
   * @private
   */
  async _validateGeneratedTests(testFile) {
    // Basic syntax validation
    if (!testFile.validateSyntax()) {
      throw new Error('Generated tests have invalid syntax');
    }

    // Check for minimum test structure
    const testCases = testFile.extractTestCases();
    if (testCases.length === 0) {
      throw new Error('No test cases found in generated tests');
    }

    const describes = testFile.extractDescribeBlocks();
    if (describes.length === 0) {
      this.logger.warn('No describe blocks found in generated tests', {
        testFile: testFile.getFileName()
      });
    }
  }

  /**
   * Merge existing tests with improved tests
   * @param {string} existingTests - Existing test code
   * @param {string} improvedTests - Improved test code
   * @param {Object} options - Merge options
   * @returns {string} Merged test code
   * @private
   */
  _mergeTests(existingTests, improvedTests, options = {}) {
    // Simple merge strategy: append improved tests
    // In a more sophisticated implementation, this could deduplicate or intelligently merge

    let merged = existingTests.trim();
    const improvedContent = improvedTests.trim();

    // If improved tests have a describe block, extract the content
    const describeMatch = improvedContent.match(/describe\([^{]+\{([\s\S]*)\}\);?\s*$/);

    if (describeMatch && !options.forceAppend) {
      // Add new tests inside the existing describe block
      merged = merged.replace(/(\}\);?\s*)$/, `\n${describeMatch[1]}\n$1`);
    } else {
      // Just append the new tests
      merged += '\n\n' + improvedContent;
    }

    return merged;
  }
}

module.exports = TestGenerationService;