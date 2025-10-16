const fs = require('fs').promises;
const path = require('path');

/**
 * Test generator that coordinates LLM-based test generation and mutation testing
 */
class TestGenerator {
  constructor(llmClient, mutationEngine, config, logger) {
    this.llmClient = llmClient;
    this.mutationEngine = mutationEngine;
    this.config = config;
    this.logger = logger;
  }

  /**
   * Generate tests for a source file with mutation testing feedback loop
   * @param {string} sourceFilePath - Path to the source file
   * @returns {Promise<Object>} - Generation results including tests and mutation score
   */
  async generateTestsWithFeedback(sourceFilePath) {
    this.logger.info('Starting test generation with feedback loop', { sourceFilePath });

    // Read source code
    const sourceCode = await fs.readFile(sourceFilePath, 'utf-8');
    const fileName = path.basename(sourceFilePath);
    
    // Generate initial tests
    this.logger.info('Generating initial tests');
    let testCode = await this.llmClient.generateTests(sourceCode, fileName);
    
    // Determine test file path
    const testFilePath = this._getTestFilePath(sourceFilePath);
    await this._writeTestFile(testFilePath, testCode);

    let iteration = 0;
    let mutationScore = 0;
    let results = null;

    // Feedback loop
    while (
      iteration < this.config.mutationTesting.maxIterations &&
      mutationScore < this.config.mutationTesting.targetMutationScore
    ) {
      iteration++;
      this.logger.info(`Feedback iteration ${iteration}/${this.config.mutationTesting.maxIterations}`);

      // Run mutation testing
      try {
        results = await this.mutationEngine.runMutationTests(sourceFilePath, testFilePath);
        mutationScore = results.mutationScore;

        this.logger.info(`Mutation score: ${mutationScore.toFixed(2)}%`, {
          target: this.config.mutationTesting.targetMutationScore,
        });

        // Check if target is reached
        if (mutationScore >= this.config.mutationTesting.targetMutationScore) {
          this.logger.info('Target mutation score reached!');
          break;
        }

        // If there are survived mutants, improve tests
        if (results.survivedMutants.length > 0) {
          this.logger.info('Improving tests to kill survived mutants', {
            count: results.survivedMutants.length,
          });

          const improvedTests = await this.llmClient.improveTests(
            sourceCode,
            testCode,
            results.survivedMutants
          );

          // Merge with existing tests
          testCode = this._mergeTests(testCode, improvedTests);
          await this._writeTestFile(testFilePath, testCode);
        } else {
          break;
        }
      } catch (error) {
        this.logger.error('Error during mutation testing iteration', {
          iteration,
          error: error.message,
        });
        
        // Continue with what we have if mutation testing fails
        break;
      }
    }

    // Generate final report
    if (results) {
      const reportPath = path.join(
        this.config.paths.reports,
        `${path.basename(sourceFilePath, '.js')}-report.json`
      );
      await this.mutationEngine.generateReport(results, reportPath);
    }

    return {
      testFilePath,
      testCode,
      iterations: iteration,
      mutationScore,
      results,
      targetReached: mutationScore >= this.config.mutationTesting.targetMutationScore,
    };
  }

  /**
   * Generate tests for multiple source files
   * @param {Array<string>} sourceFiles - Array of source file paths
   * @returns {Promise<Array>} - Array of generation results
   */
  async generateTestsForMultipleFiles(sourceFiles) {
    this.logger.info('Generating tests for multiple files', { count: sourceFiles.length });

    const results = [];

    for (const sourceFile of sourceFiles) {
      try {
        const result = await this.generateTestsWithFeedback(sourceFile);
        results.push({
          sourceFile,
          success: true,
          ...result,
        });
      } catch (error) {
        this.logger.error('Failed to generate tests for file', {
          sourceFile,
          error: error.message,
        });
        results.push({
          sourceFile,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get test file path for a source file
   */
  _getTestFilePath(sourceFilePath) {
    const fileName = path.basename(sourceFilePath, '.js');
    const testFileName = `${fileName}.test.js`;
    
    // Create test file in the configured tests directory
    return path.join(this.config.paths.tests, testFileName);
  }

  /**
   * Write test code to file
   */
  async _writeTestFile(testFilePath, testCode) {
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });
    await fs.writeFile(testFilePath, testCode, 'utf-8');
    this.logger.info('Test file written', { testFilePath });
  }

  /**
   * Merge existing tests with improved tests
   */
  _mergeTests(existingTests, improvedTests) {
    // Simple merge: append improved tests to existing ones
    // In a more sophisticated implementation, this could deduplicate or intelligently merge
    
    // Remove duplicate describe blocks and imports
    let merged = existingTests.trim();
    
    // Extract only the new test cases from improved tests
    const improvedContent = improvedTests.trim();
    
    // If improved tests have a describe block, extract the content
    const describeMatch = improvedContent.match(/describe\([^{]+\{([\s\S]*)\}\);?\s*$/);
    
    if (describeMatch) {
      // Add new tests inside the existing describe block
      merged = merged.replace(/(\}\);?\s*)$/, `\n${describeMatch[1]}\n$1`);
    } else {
      // Just append the new tests
      merged += '\n\n' + improvedContent;
    }
    
    return merged;
  }
}

module.exports = TestGenerator;
