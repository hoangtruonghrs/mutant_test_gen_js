const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const MutationEngine = require('../../interfaces/mutation-engine');

/**
 * Stryker mutation testing adapter
 */
class StrykerAdapter extends MutationEngine {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.info = {
      name: 'Stryker',
      version: '9.2.0',
      language: 'JavaScript',
      supportedMutators: [
        'ArithmeticOperator',
        'ArrayDeclaration', 
        'BlockStatement',
        'BooleanLiteral',
        'ConditionalExpression',
        'EqualityOperator',
        'LogicalOperator',
        'StringLiteral',
        'UnaryOperator'
      ]
    };
  }

  /**
   * Run mutation testing on source and test files
   * @param {string} sourceFile - Path to source file
   * @param {string} testFile - Path to test file
   * @param {Object} options - Mutation testing options
   * @returns {Promise<Object>} Mutation results
   */
  async runMutationTests(sourceFile, testFile, options = {}) {
    this.logger.info('Running mutation testing with Stryker', { 
      sourceFile, 
      testFile,
      mutators: this.config.mutators?.length || 0
    });

    try {
      // Create temporary Stryker configuration
      const strykerConfig = this._createStrykerConfig(sourceFile, testFile, options);
      
      // Write config to temporary file
      const configPath = path.join(process.cwd(), '.stryker-tmp.conf.json');
      await fs.writeFile(configPath, JSON.stringify(strykerConfig, null, 2));

      // Run Stryker via CLI
      await this._runStrykerCLI(configPath);

      // Clean up temporary config
      await fs.unlink(configPath).catch(() => {});

      // Read and process results
      const rawResults = await this._readStrykerResults();
      const processedResults = this.analyzeResults(rawResults);
      
      return processedResults;
    } catch (error) {
      this.logger.error('Mutation testing failed', { 
        error: error.message,
        sourceFile,
        testFile
      });
      throw error;
    }
  }

  /**
   * Analyze mutation results
   * @param {Object} rawResults - Raw mutation testing results
   * @returns {Object} Processed results with scores and mutant details
   */
  analyzeResults(rawResults) {
    const mutationScore = this._calculateMutationScore(rawResults);
    const survivedMutants = this._extractSurvivedMutants(rawResults);
    const killedMutants = this._extractKilledMutants(rawResults);
    const timeoutMutants = this._extractTimeoutMutants(rawResults);
    const noCoverageMutants = this._extractNoCoverageMutants(rawResults);

    this.logger.info('Mutation testing completed', {
      mutationScore: mutationScore.toFixed(2),
      survived: survivedMutants.length,
      killed: killedMutants.length,
      timeout: timeoutMutants.length,
      noCoverage: noCoverageMutants.length
    });

    return {
      mutationScore,
      totalMutants: survivedMutants.length + killedMutants.length + timeoutMutants.length + noCoverageMutants.length,
      survivedMutants,
      killedMutants,
      timeoutMutants,
      noCoverageMutants,
      rawResults
    };
  }

  /**
   * Generate mutation testing report
   * @param {Object} results - Mutation results
   * @param {string} outputPath - Path to save report
   * @returns {Promise<void>}
   */
  async generateReport(results, outputPath) {
    this.logger.info('Generating mutation testing report', { outputPath });

    const report = {
      timestamp: new Date().toISOString(),
      mutationScore: results.mutationScore,
      totalMutants: results.totalMutants,
      summary: {
        killed: results.killedMutants.length,
        survived: results.survivedMutants.length,
        timeout: results.timeoutMutants.length,
        noCoverage: results.noCoverageMutants.length
      },
      mutants: {
        survived: results.survivedMutants,
        killed: results.killedMutants,
        timeout: results.timeoutMutants,
        noCoverage: results.noCoverageMutants
      },
      analysis: {
        problematicMutators: this._getProblematicMutators(results),
        coverageGaps: this._getCoverageGaps(results),
        recommendations: this._getRecommendations(results)
      }
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

    this.logger.info('Report generated successfully', { outputPath });
  }

  /**
   * Get supported mutators
   * @returns {Array<string>} List of available mutators
   */
  getSupportedMutators() {
    return [...this.info.supportedMutators];
  }

  /**
   * Validate engine configuration
   * @param {Object} config - Engine configuration
   * @returns {boolean} True if configuration is valid
   */
  validateConfig(config) {
    if (!config) return false;
    if (config.mutators && !Array.isArray(config.mutators)) return false;
    if (config.targetMutationScore && (config.targetMutationScore < 0 || config.targetMutationScore > 100)) return false;
    if (config.maxIterations && config.maxIterations < 1) return false;
    
    return true;
  }

  /**
   * Check if mutation engine is available
   * @returns {Promise<boolean>} True if engine is ready
   */
  async isAvailable() {
    try {
      const { spawn } = require('child_process');
      const stryker = spawn('npx', ['stryker', '--version'], { stdio: 'pipe' });
      
      return new Promise((resolve) => {
        stryker.on('close', (code) => {
          resolve(code === 0);
        });
        stryker.on('error', () => {
          resolve(false);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Get engine information
   * @returns {Object} Engine metadata
   */
  getInfo() {
    return { ...this.info };
  }

  /**
   * Run Stryker via CLI
   * @param {string} configPath - Path to config file
   * @returns {Promise<void>}
   * @private
   */
  async _runStrykerCLI(configPath) {
    return new Promise((resolve, reject) => {
      const stryker = spawn('npx', ['stryker', 'run', '--configFile', configPath], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      stryker.on('close', (code) => {
        if (code === 0 || code === 1) {
          // Exit code 1 is acceptable as it means some mutants survived
          resolve();
        } else {
          reject(new Error(`Stryker exited with code ${code}`));
        }
      });

      stryker.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Read Stryker results from JSON report
   * @returns {Promise<Object>} Stryker results
   * @private
   */
  async _readStrykerResults() {
    const reportPath = path.join(process.cwd(), 'reports', 'mutation', 'mutation.json');
    
    try {
      const content = await fs.readFile(reportPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.logger.warn('Could not read Stryker results', { error: error.message });
      // Return a mock result structure if file doesn't exist
      return {
        files: {},
        schemaVersion: '1.0',
        thresholds: { high: 80, low: 60 },
      };
    }
  }

  /**
   * Create Stryker configuration object
   * @param {string} sourceFile - Source file path
   * @param {string} testFile - Test file path
   * @param {Object} options - Additional options
   * @returns {Object} Stryker configuration
   * @private
   */
  _createStrykerConfig(sourceFile, testFile, options) {
    return {
      $schema: './node_modules/@stryker-mutator/core/schema/stryker-schema.json',
      _comment: 'Auto-generated configuration for mutation testing',
      packageManager: 'npm',
      reporters: ['json', 'html', 'clear-text'],
      testRunner: 'jest',
      coverageAnalysis: 'perTest',
      mutate: [sourceFile],
      jest: {
        projectType: 'custom',
        configFile: 'jest.config.js',
      },
      timeoutMS: options.timeoutMS || this.config.timeoutMS || 30000,
      maxConcurrentTestRunners: options.maxConcurrentTestRunners || 2,
      tempDirName: '.stryker-tmp',
      cleanTempDir: true,
      mutator: {
        excludedMutations: options.excludedMutations || []
      },
      thresholds: {
        high: 80,
        low: 60,
        break: null,
      },
      jsonReporter: {
        fileName: 'reports/mutation/mutation.json',
      },
      htmlReporter: {
        fileName: 'reports/mutation/mutation.html',
      },
    };
  }

  /**
   * Calculate mutation score from results
   * @param {Object} results - Stryker results
   * @returns {number} Mutation score percentage
   * @private
   */
  _calculateMutationScore(results) {
    if (!results.files || Object.keys(results.files).length === 0) {
      return 0;
    }

    let totalMutants = 0;
    let killedMutants = 0;

    Object.values(results.files).forEach((file) => {
      if (file.mutants) {
        file.mutants.forEach((mutant) => {
          totalMutants++;
          if (mutant.status === 'Killed' || mutant.status === 'Timeout') {
            killedMutants++;
          }
        });
      }
    });

    return totalMutants > 0 ? (killedMutants / totalMutants) * 100 : 0;
  }

  /**
   * Extract survived mutants from results
   * @param {Object} results - Stryker results
   * @returns {Array} Survived mutants
   * @private
   */
  _extractSurvivedMutants(results) {
    return this._extractMutantsByStatus(results, ['Survived']);
  }

  /**
   * Extract killed mutants from results
   * @param {Object} results - Stryker results
   * @returns {Array} Killed mutants
   * @private
   */
  _extractKilledMutants(results) {
    return this._extractMutantsByStatus(results, ['Killed']);
  }

  /**
   * Extract timeout mutants from results
   * @param {Object} results - Stryker results
   * @returns {Array} Timeout mutants
   * @private
   */
  _extractTimeoutMutants(results) {
    return this._extractMutantsByStatus(results, ['Timeout']);
  }

  /**
   * Extract no coverage mutants from results
   * @param {Object} results - Stryker results
   * @returns {Array} No coverage mutants
   * @private
   */
  _extractNoCoverageMutants(results) {
    return this._extractMutantsByStatus(results, ['NoCoverage']);
  }

  /**
   * Extract mutants by status
   * @param {Object} results - Stryker results
   * @param {Array<string>} statuses - Target statuses
   * @returns {Array} Filtered mutants
   * @private
   */
  _extractMutantsByStatus(results, statuses) {
    const mutants = [];

    if (results.files) {
      Object.entries(results.files).forEach(([fileName, file]) => {
        if (file.mutants) {
          file.mutants.forEach((mutant) => {
            if (statuses.includes(mutant.status)) {
              mutants.push({
                fileName,
                mutatorName: mutant.mutatorName,
                replacement: mutant.replacement,
                location: mutant.location,
                status: mutant.status,
                description: mutant.description || ''
              });
            }
          });
        }
      });
    }

    return mutants;
  }

  /**
   * Get problematic mutators
   * @param {Object} results - Mutation results
   * @returns {Array} Problematic mutators
   * @private
   */
  _getProblematicMutators(results) {
    const mutatorStats = {};
    
    // Count all mutants by mutator
    [...results.survivedMutants, ...results.killedMutants].forEach(mutant => {
      if (!mutatorStats[mutant.mutatorName]) {
        mutatorStats[mutant.mutatorName] = { survived: 0, total: 0 };
      }
      mutatorStats[mutant.mutatorName].total++;
      if (mutant.status === 'Survived') {
        mutatorStats[mutant.mutatorName].survived++;
      }
    });

    return Object.entries(mutatorStats)
      .map(([mutator, stats]) => ({
        mutator,
        survivedCount: stats.survived,
        totalCount: stats.total,
        survivalRate: stats.total > 0 ? (stats.survived / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.survivalRate - a.survivalRate)
      .slice(0, 5);
  }

  /**
   * Get coverage gaps
   * @param {Object} results - Mutation results
   * @returns {Array} Coverage gaps
   * @private
   */
  _getCoverageGaps(results) {
    const gaps = [];
    const locationGroups = {};
    
    results.survivedMutants.forEach(mutant => {
      const key = `${mutant.location.start.line}`;
      if (!locationGroups[key]) {
        locationGroups[key] = [];
      }
      locationGroups[key].push(mutant);
    });

    Object.entries(locationGroups).forEach(([line, mutants]) => {
      gaps.push({
        line: parseInt(line),
        mutantCount: mutants.length,
        mutators: mutants.map(m => m.mutatorName),
        severity: mutants.length > 2 ? 'high' : mutants.length > 1 ? 'medium' : 'low'
      });
    });

    return gaps.sort((a, b) => b.mutantCount - a.mutantCount).slice(0, 10);
  }

  /**
   * Get recommendations based on results
   * @param {Object} results - Mutation results
   * @returns {Array<string>} Recommendations
   * @private
   */
  _getRecommendations(results) {
    const recommendations = [];
    
    if (results.mutationScore < 50) {
      recommendations.push('Add more comprehensive test cases covering basic functionality');
    }
    
    if (results.survivedMutants.length > 10) {
      recommendations.push('Focus on testing edge cases and boundary conditions');
    }
    
    if (results.noCoverageMutants.length > 0) {
      recommendations.push('Improve test coverage - some code paths are not being tested');
    }
    
    const problematicMutators = this._getProblematicMutators(results);
    if (problematicMutators.length > 0) {
      const topMutator = problematicMutators[0];
      recommendations.push(`Focus on ${topMutator.mutator} mutations - ${topMutator.survivedCount} survived`);
    }
    
    return recommendations;
  }
}

module.exports = StrykerAdapter;