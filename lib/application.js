/**
 * Application Layer - Main entry point and dependency injection
 * Orchestrates all components following Clean Architecture
 */

const { GenerateTestsUseCase, ImproveTestsUseCase, BatchProcessUseCase } = require('./core/use-cases');
const TestGenerationService = require('./core/services/test-generation-service');
const MutationAnalysisService = require('./core/services/mutation-analysis-service');
const FeedbackLoopService = require('./core/services/feedback-loop-service');

// Adapters
const LLMAdapterFactory = require('./adapters/llm/llm-adapter-factory');
const StrykerAdapter = require('./adapters/mutation/stryker-adapter');
const FileSystemStorage = require('./adapters/storage/fs-storage');

// Utils
const logger = require('./utils/logger');

/**
 * Main Application class
 * Handles dependency injection and provides high-level API
 */
class MutantTestGenApplication {
  constructor(config = {}) {
    this.config = {
      // Default configuration
      llm: {
        provider: 'openai',
        apiKey: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        temperature: 0.1,
        maxTokens: 2000
      },
      mutation: {
        testRunner: 'jest',
        timeout: 60000,
        reporters: ['clear-text', 'progress'],
        tempDirName: 'stryker-tmp'
      },
      storage: {
        type: 'filesystem',
        encoding: 'utf8'
      },
      logging: {
        level: 'info',
        format: 'json'
      },
      ...config
    };

    this._initializeComponents();
  }

  /**
   * Initialize all components with dependency injection
   * @private
   */
  _initializeComponents() {
    // Initialize logger
    logger.configure(this.config.logging);

    // Initialize adapters
    this.llmAdapterFactory = new LLMAdapterFactory();
    this.mutationEngine = new StrykerAdapter(this.config.mutation, logger);
    this.storageProvider = new FileSystemStorage(this.config.storage, logger);

    // Initialize services
    this.testGenerationService = new TestGenerationService(
      this.llmAdapterFactory,
      logger
    );

    this.mutationAnalysisService = new MutationAnalysisService(
      this.mutationEngine,
      logger
    );

    this.feedbackLoopService = new FeedbackLoopService(
      this.testGenerationService,
      this.mutationAnalysisService,
      logger
    );

    // Initialize use cases
    this.generateTestsUseCase = new GenerateTestsUseCase(
      this.testGenerationService,
      this.mutationAnalysisService,
      this.feedbackLoopService,
      this.llmAdapterFactory,
      this.storageProvider,
      logger
    );

    this.improveTestsUseCase = new ImproveTestsUseCase(
      this.testGenerationService,
      this.mutationAnalysisService,
      this.storageProvider,
      logger
    );

    this.batchProcessUseCase = new BatchProcessUseCase(
      this.generateTestsUseCase,
      this.improveTestsUseCase,
      this.storageProvider,
      logger
    );

    logger.info('Application initialized successfully', {
      llmProvider: this.config.llm.provider,
      mutationEngine: 'stryker',
      storageType: this.config.storage.type
    });
  }

  /**
   * Generate tests for a single source file
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result
   */
  async generateTests(options) {
    const {
      sourcePath,
      outputPath,
      useFeedbackLoop = false,
      targetMutationScore = 80,
      maxIterations = 3,
      runMutationAnalysis = true,
      llmOptions = {},
      mutationOptions = {}
    } = options;

    return await this.generateTestsUseCase.execute({
      sourcePath,
      outputPath,
      useFeedbackLoop,
      config: {
        llm: { ...this.config.llm, ...llmOptions },
        targetMutationScore,
        maxIterations,
        runMutationAnalysis,
        mutationOptions: { ...this.config.mutation, ...mutationOptions }
      }
    });
  }

  /**
   * Improve existing tests
   * @param {Object} options - Improvement options
   * @returns {Promise<Object>} Improvement result
   */
  async improveTests(options) {
    const {
      sourcePath,
      testPath,
      outputPath,
      llmOptions = {},
      mutationOptions = {}
    } = options;

    return await this.improveTestsUseCase.execute({
      sourcePath,
      testPath,
      outputPath,
      config: {
        llm: { ...this.config.llm, ...llmOptions },
        mutationOptions: { ...this.config.mutation, ...mutationOptions }
      }
    });
  }

  /**
   * Process multiple files in batch
   * @param {Object} options - Batch options
   * @returns {Promise<Object>} Batch result
   */
  async batchProcess(options) {
    const {
      sourcePattern,
      outputDir,
      mode = 'generate',
      concurrency = 3,
      useFeedbackLoop = false,
      llmOptions = {},
      mutationOptions = {}
    } = options;

    return await this.batchProcessUseCase.execute({
      sourcePattern,
      outputDir,
      mode,
      config: {
        llm: { ...this.config.llm, ...llmOptions },
        mutationOptions: { ...this.config.mutation, ...mutationOptions },
        concurrency,
        useFeedbackLoop
      }
    });
  }

  /**
   * Run mutation analysis on existing test file
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async runMutationAnalysis(options) {
    const { sourcePath, testPath, mutationOptions = {} } = options;

    const SourceFile = require('./core/entities/source-file');
    const TestFile = require('./core/entities/test-file');
    const path = require('path');

    // Load files
    const sourceContent = await this.storageProvider.readFile(sourcePath);
    const testContent = await this.storageProvider.readFile(testPath);

    const sourceFile = new SourceFile(
      path.basename(sourcePath),
      sourceContent,
      sourcePath
    );

    const testFile = new TestFile(
      path.basename(testPath),
      testContent,
      testPath
    );

    // Run analysis
    const mutationResult = await this.mutationAnalysisService.runMutationAnalysis(
      sourceFile,
      testFile,
      { ...this.config.mutation, ...mutationOptions }
    );

    return {
      sourceFile: sourcePath,
      testFile: testPath,
      mutationResult: mutationResult.toJSON(),
      recommendations: this.mutationAnalysisService.getRecommendations(mutationResult)
    };
  }

  /**
   * Execute feedback loop for iterative improvement
   * @param {Object} options - Feedback loop options
   * @returns {Promise<Object>} Feedback loop result
   */
  async executeFeedbackLoop(options) {
    const {
      sourcePath,
      outputPath,
      targetMutationScore = 80,
      maxIterations = 3,
      llmOptions = {},
      mutationOptions = {}
    } = options;

    const SourceFile = require('./core/entities/source-file');
    const path = require('path');

    // Load source file
    const sourceContent = await this.storageProvider.readFile(sourcePath);
    const sourceFile = new SourceFile(
      path.basename(sourcePath),
      sourceContent,
      sourcePath
    );

    // Execute feedback loop
    const feedbackConfig = {
      targetMutationScore,
      maxIterations,
      mutationOptions: { ...this.config.mutation, ...mutationOptions },
      improvementOptions: {
        llm: { ...this.config.llm, ...llmOptions }
      }
    };

    const result = await this.feedbackLoopService.executeFeedbackLoop(
      sourceFile,
      feedbackConfig
    );

    // Save final test file if successful
    if (result.testFile && outputPath) {
      await this.storageProvider.saveFile(outputPath, result.testFile.getContent());
    }

    return {
      ...result,
      outputPath: outputPath,
      sourceFile: sourcePath
    };
  }

  /**
   * Get application status and health
   * @returns {Object} Status information
   */
  getStatus() {
    return {
      version: require('../package.json').version,
      config: {
        llmProvider: this.config.llm.provider,
        mutationEngine: 'stryker',
        storageType: this.config.storage.type
      },
      components: {
        llmAdapterFactory: !!this.llmAdapterFactory,
        mutationEngine: !!this.mutationEngine,
        storageProvider: !!this.storageProvider,
        services: {
          testGeneration: !!this.testGenerationService,
          mutationAnalysis: !!this.mutationAnalysisService,
          feedbackLoop: !!this.feedbackLoopService
        },
        useCases: {
          generateTests: !!this.generateTestsUseCase,
          improveTests: !!this.improveTestsUseCase,
          batchProcess: !!this.batchProcessUseCase
        }
      }
    };
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this._initializeComponents();
    logger.info('Configuration updated', { config: this.config });
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    logger.info('Cleaning up application resources');
    
    // Cleanup mutation engine
    if (this.mutationEngine && typeof this.mutationEngine.cleanup === 'function') {
      await this.mutationEngine.cleanup();
    }

    // Cleanup storage provider
    if (this.storageProvider && typeof this.storageProvider.cleanup === 'function') {
      await this.storageProvider.cleanup();
    }

    logger.info('Application cleanup completed');
  }
}

/**
 * Factory function to create application instance
 * @param {Object} config - Configuration options
 * @returns {MutantTestGenApplication} Application instance
 */
function createApplication(config = {}) {
  return new MutantTestGenApplication(config);
}

module.exports = {
  MutantTestGenApplication,
  createApplication
};