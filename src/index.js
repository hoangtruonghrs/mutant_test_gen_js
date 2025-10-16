require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const glob = require('glob').glob;

const Logger = require('./utils/logger');
const OpenAIClient = require('./llm/openai-client');
const MutationEngine = require('./core/mutation-engine');
const TestGenerator = require('./core/test-generator');

/**
 * Main orchestrator for the mutation testing system
 */
class MutantTestGenJS {
  constructor(config) {
    this.config = config;
    this.logger = new Logger(config.logging);
    
    try {
      this.llmClient = new OpenAIClient(config.llm, this.logger);
      this.mutationEngine = new MutationEngine(config.mutationTesting, this.logger);
      this.testGenerator = new TestGenerator(
        this.llmClient,
        this.mutationEngine,
        config,
        this.logger
      );
    } catch (error) {
      this.logger.error('Failed to initialize components', { error: error.message });
      throw error;
    }
  }

  /**
   * Run the mutation testing system on specified files
   * @param {string|Array<string>} files - File path(s) or glob pattern(s)
   * @returns {Promise<Object>} - Results of the test generation process
   */
  async run(files) {
    this.logger.info('Starting Mutant Test Generation JS');
    
    // Resolve file paths
    const sourceFiles = await this._resolveFiles(files);
    
    if (sourceFiles.length === 0) {
      this.logger.warn('No source files found');
      return { success: false, message: 'No source files found' };
    }

    this.logger.info(`Found ${sourceFiles.length} source file(s) to process`);

    // Generate tests for all files
    const results = await this.testGenerator.generateTestsForMultipleFiles(sourceFiles);

    // Generate summary report
    const summary = this._generateSummary(results);
    this.logger.info('Test generation completed', summary);

    // Save summary report
    await this._saveSummaryReport(summary);

    return {
      success: true,
      summary,
      results,
    };
  }

  /**
   * Resolve file paths from patterns
   */
  async _resolveFiles(files) {
    const patterns = Array.isArray(files) ? files : [files];
    const resolvedFiles = new Set();

    for (const pattern of patterns) {
      // Check if it's a direct file path
      try {
        const stat = await fs.stat(pattern);
        if (stat.isFile() && pattern.endsWith('.js')) {
          resolvedFiles.add(path.resolve(pattern));
        } else if (stat.isDirectory()) {
          // If it's a directory, search for JS files
          const dirPattern = path.join(pattern, '**/*.js');
          const matches = await glob(dirPattern, { ignore: '**/node_modules/**' });
          matches.forEach((f) => resolvedFiles.add(path.resolve(f)));
        }
      } catch {
        // It's a glob pattern
        try {
          const matches = await glob(pattern, { ignore: '**/node_modules/**' });
          matches.forEach((f) => {
            if (f.endsWith('.js')) {
              resolvedFiles.add(path.resolve(f));
            }
          });
        } catch (error) {
          this.logger.warn(`Failed to resolve pattern: ${pattern}`, { error: error.message });
        }
      }
    }

    // Filter out test files
    return Array.from(resolvedFiles).filter((f) => !f.includes('.test.js') && !f.includes('.spec.js'));
  }

  /**
   * Generate summary of results
   */
  _generateSummary(results) {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const targetReached = successful.filter((r) => r.targetReached);

    const avgMutationScore =
      successful.length > 0
        ? successful.reduce((sum, r) => sum + (r.mutationScore || 0), 0) / successful.length
        : 0;

    const totalIterations = successful.reduce((sum, r) => sum + (r.iterations || 0), 0);

    return {
      totalFiles: results.length,
      successful: successful.length,
      failed: failed.length,
      targetReached: targetReached.length,
      averageMutationScore: avgMutationScore.toFixed(2),
      totalIterations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Save summary report
   */
  async _saveSummaryReport(summary) {
    const reportPath = path.join(this.config.paths.reports, 'summary.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
    this.logger.info('Summary report saved', { reportPath });
  }
}

module.exports = MutantTestGenJS;
