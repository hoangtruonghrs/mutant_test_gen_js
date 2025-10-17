/**
 * Use Cases Layer - Orchestrates business logic and coordinates services
 * Following Clean Architecture principles
 */

const path = require('path');

/**
 * Generate Tests Use Case
 * Orchestrates the complete test generation workflow
 */
class GenerateTestsUseCase {
  constructor(
    testGenerationService,
    mutationAnalysisService,
    feedbackLoopService,
    llmAdapterFactory,
    storageProvider,
    logger
  ) {
    this.testGenerationService = testGenerationService;
    this.mutationAnalysisService = mutationAnalysisService;
    this.feedbackLoopService = feedbackLoopService;
    this.llmAdapterFactory = llmAdapterFactory;
    this.storageProvider = storageProvider;
    this.logger = logger;
  }

  /**
   * Execute test generation for a single file
   * @param {Object} request - Generation request
   * @returns {Promise<Object>} Generation result
   */
  async execute(request) {
    const {
      sourcePath,
      outputPath,
      config = {},
      useFeedbackLoop = false
    } = request;

    this.logger.info('Starting test generation', {
      sourcePath,
      outputPath,
      useFeedbackLoop
    });

    try {
      // Validate inputs
      this._validateRequest(request);

      // Load source file
      const sourceFile = await this._loadSourceFile(sourcePath);
      
      // Configure LLM adapter
      const llmAdapter = this.llmAdapterFactory.createAdapter(config.llm || {});

      if (useFeedbackLoop) {
        // Use feedback loop for iterative improvement
        return await this._executeWithFeedbackLoop(sourceFile, outputPath, config);
      } else {
        // Simple test generation
        return await this._executeSimpleGeneration(sourceFile, outputPath, config);
      }

    } catch (error) {
      this.logger.error('Test generation failed', {
        sourcePath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Execute simple test generation without feedback loop
   * @param {SourceFile} sourceFile - Source file entity
   * @param {string} outputPath - Output path for test file
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Generation result
   * @private
   */
  async _executeSimpleGeneration(sourceFile, outputPath, config) {
    const startTime = new Date();

    // Generate tests
    const testFile = await this.testGenerationService.generateInitialTests(sourceFile, config);

    // Save test file
    await this.storageProvider.saveFile(outputPath, testFile.getContent());

    // Run mutation analysis if requested
    let mutationResult = null;
    if (config.runMutationAnalysis) {
      try {
        mutationResult = await this.mutationAnalysisService.runMutationAnalysis(
          sourceFile,
          testFile,
          config.mutationOptions || {}
        );
      } catch (mutationError) {
        this.logger.warn('Mutation analysis failed', { error: mutationError.message });
      }
    }

    const endTime = new Date();
    const result = {
      type: 'simple',
      sourceFile: sourceFile.getFileName(),
      testFile: outputPath,
      testCases: testFile.extractTestCases(),
      mutationResult: mutationResult?.toJSON(),
      duration: endTime - startTime,
      success: true,
      startTime,
      endTime
    };

    this.logger.info('Test generation completed', {
      sourceFile: sourceFile.getFileName(),
      testCases: testFile.extractTestCases().length,
      mutationScore: mutationResult?.mutationScore || 'N/A',
      duration: this._formatDuration(result.duration)
    });

    return result;
  }

  /**
   * Execute test generation with feedback loop
   * @param {SourceFile} sourceFile - Source file entity
   * @param {string} outputPath - Output path for test file
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Generation result
   * @private
   */
  async _executeWithFeedbackLoop(sourceFile, outputPath, config) {
    const feedbackConfig = {
      targetMutationScore: config.targetMutationScore || 80,
      maxIterations: config.maxIterations || 3,
      initialContext: config.initialContext,
      mutationOptions: config.mutationOptions || {},
      improvementOptions: config.improvementOptions || {}
    };

    const feedbackResult = await this.feedbackLoopService.executeFeedbackLoop(
      sourceFile,
      feedbackConfig
    );

    // Save final test file
    if (feedbackResult.testFile) {
      await this.storageProvider.saveFile(outputPath, feedbackResult.testFile.getContent());
    }

    const result = {
      type: 'feedback_loop',
      sourceFile: sourceFile.getFileName(),
      testFile: outputPath,
      feedbackResult: feedbackResult,
      success: !feedbackResult.error,
      recommendations: feedbackResult.analysis?.recommendations
    };

    this.logger.info('Feedback loop test generation completed', {
      sourceFile: sourceFile.getFileName(),
      iterations: feedbackResult.totalIterations,
      finalScore: feedbackResult.finalScore?.toFixed(2),
      targetReached: feedbackResult.targetReached
    });

    return result;
  }

  /**
   * Load source file from filesystem
   * @param {string} sourcePath - Path to source file
   * @returns {Promise<SourceFile>} Source file entity
   * @private
   */
  async _loadSourceFile(sourcePath) {
    const SourceFile = require('../entities/source-file');
    
    const content = await this.storageProvider.readFile(sourcePath);
    const fileName = path.basename(sourcePath);
    
    return new SourceFile(fileName, content, sourcePath);
  }

  /**
   * Validate generation request
   * @param {Object} request - Generation request
   * @private
   */
  _validateRequest(request) {
    if (!request.sourcePath) {
      throw new Error('Source path is required');
    }
    if (!request.outputPath) {
      throw new Error('Output path is required');
    }
    // Additional validation logic
  }

  /**
   * Format duration in human readable format
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration
   * @private
   */
  _formatDuration(duration) {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

/**
 * Improve Tests Use Case
 * Handles iterative test improvement workflows
 */
class ImproveTestsUseCase {
  constructor(
    testGenerationService,
    mutationAnalysisService,
    storageProvider,
    logger
  ) {
    this.testGenerationService = testGenerationService;
    this.mutationAnalysisService = mutationAnalysisService;
    this.storageProvider = storageProvider;
    this.logger = logger;
  }

  /**
   * Execute test improvement
   * @param {Object} request - Improvement request
   * @returns {Promise<Object>} Improvement result
   */
  async execute(request) {
    const {
      sourcePath,
      testPath,
      outputPath,
      config = {}
    } = request;

    this.logger.info('Starting test improvement', {
      sourcePath,
      testPath,
      outputPath
    });

    try {
      // Load files
      const sourceFile = await this._loadSourceFile(sourcePath);
      const testFile = await this._loadTestFile(testPath);

      // Run mutation analysis to identify weak points
      const mutationResult = await this.mutationAnalysisService.runMutationAnalysis(
        sourceFile,
        testFile,
        config.mutationOptions || {}
      );

      // If there are survived mutants, improve tests
      let improvedTestFile = testFile;
      if (mutationResult.survivedMutants.length > 0) {
        improvedTestFile = await this.testGenerationService.improveTests(
          sourceFile,
          testFile,
          mutationResult.survivedMutants,
          config.improvementOptions || {}
        );

        // Save improved test file
        const finalOutputPath = outputPath || testPath;
        await this.storageProvider.saveFile(finalOutputPath, improvedTestFile.getContent());
      }

      // Run final mutation analysis
      const finalMutationResult = await this.mutationAnalysisService.runMutationAnalysis(
        sourceFile,
        improvedTestFile,
        config.mutationOptions || {}
      );

      const result = {
        sourceFile: sourceFile.getFileName(),
        originalTestFile: testPath,
        improvedTestFile: outputPath || testPath,
        originalScore: mutationResult.mutationScore,
        improvedScore: finalMutationResult.mutationScore,
        improvement: finalMutationResult.mutationScore - mutationResult.mutationScore,
        survivedMutantsKilled: mutationResult.survivedMutants.length - finalMutationResult.survivedMutants.length,
        newTestCases: improvedTestFile.extractTestCases().length - testFile.extractTestCases().length,
        success: true
      };

      this.logger.info('Test improvement completed', {
        sourceFile: sourceFile.getFileName(),
        improvement: result.improvement.toFixed(2),
        survivedMutantsKilled: result.survivedMutantsKilled,
        newTestCases: result.newTestCases
      });

      return result;

    } catch (error) {
      this.logger.error('Test improvement failed', {
        sourcePath,
        testPath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Load source file from filesystem
   * @param {string} sourcePath - Path to source file
   * @returns {Promise<SourceFile>} Source file entity
   * @private
   */
  async _loadSourceFile(sourcePath) {
    const SourceFile = require('../entities/source-file');
    
    const content = await this.storageProvider.readFile(sourcePath);
    const fileName = path.basename(sourcePath);
    
    return new SourceFile(fileName, content, sourcePath);
  }

  /**
   * Load test file from filesystem
   * @param {string} testPath - Path to test file
   * @returns {Promise<TestFile>} Test file entity
   * @private
   */
  async _loadTestFile(testPath) {
    const TestFile = require('../entities/test-file');
    
    const content = await this.storageProvider.readFile(testPath);
    const fileName = path.basename(testPath);
    
    return new TestFile(fileName, content, testPath);
  }
}

/**
 * Batch Process Use Case
 * Handles batch processing of multiple files
 */
class BatchProcessUseCase {
  constructor(
    generateTestsUseCase,
    improveTestsUseCase,
    storageProvider,
    logger
  ) {
    this.generateTestsUseCase = generateTestsUseCase;
    this.improveTestsUseCase = improveTestsUseCase;
    this.storageProvider = storageProvider;
    this.logger = logger;
  }

  /**
   * Execute batch processing
   * @param {Object} request - Batch request
   * @returns {Promise<Object>} Batch result
   */
  async execute(request) {
    const {
      sourcePattern,
      outputDir,
      config = {},
      mode = 'generate' // 'generate' or 'improve'
    } = request;

    this.logger.info('Starting batch processing', {
      sourcePattern,
      outputDir,
      mode
    });

    try {
      // Find source files
      const sourceFiles = await this._findSourceFiles(sourcePattern);
      
      if (sourceFiles.length === 0) {
        throw new Error(`No source files found matching pattern: ${sourcePattern}`);
      }

      this.logger.info(`Found ${sourceFiles.length} files to process`);

      const results = {
        totalFiles: sourceFiles.length,
        processedFiles: [],
        successfulFiles: 0,
        failedFiles: 0,
        startTime: new Date(),
        endTime: null,
        errors: []
      };

      // Process files with concurrency control
      const concurrency = config.concurrency || 3;
      const batches = this._createBatches(sourceFiles, concurrency);

      for (const batch of batches) {
        const batchPromises = batch.map(async (sourceFile) => {
          try {
            const result = await this._processFile(sourceFile, outputDir, mode, config);
            results.processedFiles.push(result);
            results.successfulFiles++;
            
            this.logger.info(`Processed file ${results.processedFiles.length}/${results.totalFiles}`, {
              file: sourceFile,
              success: true
            });
            
          } catch (error) {
            const errorResult = {
              sourceFile,
              error: error.message,
              success: false
            };
            results.processedFiles.push(errorResult);
            results.failedFiles++;
            results.errors.push(errorResult);
            
            this.logger.error(`Failed to process file ${results.processedFiles.length}/${results.totalFiles}`, {
              file: sourceFile,
              error: error.message
            });
          }
        });

        await Promise.all(batchPromises);
      }

      results.endTime = new Date();
      results.duration = results.endTime - results.startTime;

      this.logger.info('Batch processing completed', {
        totalFiles: results.totalFiles,
        successful: results.successfulFiles,
        failed: results.failedFiles,
        duration: this._formatDuration(results.duration)
      });

      return results;

    } catch (error) {
      this.logger.error('Batch processing failed', {
        sourcePattern,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Process a single file in batch mode
   * @param {string} sourceFile - Source file path
   * @param {string} outputDir - Output directory
   * @param {string} mode - Processing mode
   * @param {Object} config - Configuration
   * @returns {Promise<Object>} Processing result
   * @private
   */
  async _processFile(sourceFile, outputDir, mode, config) {
    const fileName = path.basename(sourceFile, path.extname(sourceFile));
    const outputPath = path.join(outputDir, `${fileName}.test.js`);

    if (mode === 'generate') {
      return await this.generateTestsUseCase.execute({
        sourcePath: sourceFile,
        outputPath: outputPath,
        config: config
      });
    } else if (mode === 'improve') {
      const testPath = path.join(outputDir, `${fileName}.test.js`);
      return await this.improveTestsUseCase.execute({
        sourcePath: sourceFile,
        testPath: testPath,
        outputPath: outputPath,
        config: config
      });
    } else {
      throw new Error(`Unknown processing mode: ${mode}`);
    }
  }

  /**
   * Find source files matching pattern
   * @param {string} pattern - File pattern
   * @returns {Promise<Array<string>>} Array of file paths
   * @private
   */
  async _findSourceFiles(pattern) {
    // This would typically use glob or similar pattern matching
    // For now, simplified implementation
    const glob = require('glob');
    return new Promise((resolve, reject) => {
      glob(pattern, (err, files) => {
        if (err) reject(err);
        else resolve(files.filter(file => !file.includes('.test.') && !file.includes('.spec.')));
      });
    });
  }

  /**
   * Create batches for concurrent processing
   * @param {Array} items - Items to batch
   * @param {number} batchSize - Size of each batch
   * @returns {Array<Array>} Array of batches
   * @private
   */
  _createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Format duration in human readable format
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Formatted duration
   * @private
   */
  _formatDuration(duration) {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

module.exports = {
  GenerateTestsUseCase,
  ImproveTestsUseCase,
  BatchProcessUseCase
};