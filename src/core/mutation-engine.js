const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

/**
 * Mutation testing engine using Stryker
 */
class MutationEngine {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Run mutation testing on the specified files
   * @param {string} sourceFile - Path to source file
   * @param {string} testFile - Path to test file
   * @returns {Promise<Object>} - Mutation testing results
   */
  async runMutationTests(sourceFile, testFile) {
    this.logger.info('Running mutation testing', { sourceFile, testFile });

    try {
      // Create a temporary Stryker configuration
      const strykerConfig = this._createStrykerConfig(sourceFile, testFile);
      
      // Write config to temporary file
      const configPath = path.join(process.cwd(), '.stryker-tmp.conf.json');
      await fs.writeFile(configPath, JSON.stringify(strykerConfig, null, 2));

      // Run Stryker via CLI
      await this._runStrykerCLI(configPath);

      // Clean up temporary config
      await fs.unlink(configPath).catch(() => {});

      // Read and process results
      const results = await this._readStrykerResults();
      
      return this._processResults(results);
    } catch (error) {
      this.logger.error('Mutation testing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Run Stryker via CLI
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
   */
  _createStrykerConfig(sourceFile, _testFile) {
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
      timeoutMS: 30000,
      maxConcurrentTestRunners: 2,
      tempDirName: '.stryker-tmp',
      cleanTempDir: true,
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
   * Process mutation testing results
   */
  _processResults(results) {
    
    const mutationScore = this._calculateMutationScore(results);
    const survivedMutants = this._extractSurvivedMutants(results);
    const killedMutants = this._extractKilledMutants(results);

    this.logger.info('Mutation testing completed', {
      mutationScore: mutationScore.toFixed(2),
      survived: survivedMutants.length,
      killed: killedMutants.length,
    });

    return {
      mutationScore,
      survivedMutants,
      killedMutants,
      totalMutants: survivedMutants.length + killedMutants.length,
      rawResults: results,
    };
  }

  /**
   * Calculate mutation score from results
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
   */
  _extractSurvivedMutants(results) {
    const survived = [];

    if (results.files) {
      Object.entries(results.files).forEach(([fileName, file]) => {
        if (file.mutants) {
          file.mutants.forEach((mutant) => {
            if (mutant.status === 'Survived' || mutant.status === 'NoCoverage') {
              survived.push({
                fileName,
                mutatorName: mutant.mutatorName,
                replacement: mutant.replacement,
                location: mutant.location,
                status: mutant.status,
              });
            }
          });
        }
      });
    }

    return survived;
  }

  /**
   * Extract killed mutants from results
   */
  _extractKilledMutants(results) {
    const killed = [];

    if (results.files) {
      Object.entries(results.files).forEach(([fileName, file]) => {
        if (file.mutants) {
          file.mutants.forEach((mutant) => {
            if (mutant.status === 'Killed' || mutant.status === 'Timeout') {
              killed.push({
                fileName,
                mutatorName: mutant.mutatorName,
                replacement: mutant.replacement,
                location: mutant.location,
                status: mutant.status,
              });
            }
          });
        }
      });
    }

    return killed;
  }

  /**
   * Generate mutation testing report
   */
  async generateReport(results, outputPath) {
    this.logger.info('Generating mutation testing report', { outputPath });

    const report = {
      timestamp: new Date().toISOString(),
      mutationScore: results.mutationScore,
      totalMutants: results.totalMutants,
      killedMutants: results.killedMutants.length,
      survivedMutants: results.survivedMutants.length,
      survived: results.survivedMutants,
      killed: results.killedMutants,
    };

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

    this.logger.info('Report generated successfully', { outputPath });
  }
}

module.exports = MutationEngine;
