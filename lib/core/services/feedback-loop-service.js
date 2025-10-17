/**
 * Feedback loop service orchestrates the iterative improvement process
 */
class FeedbackLoopService {
  constructor(testGenerationService, mutationAnalysisService, logger) {
    this.testGenerationService = testGenerationService;
    this.mutationAnalysisService = mutationAnalysisService;
    this.logger = logger;
  }

  /**
   * Execute feedback loop for test improvement
   * @param {SourceFile} sourceFile - Source file entity
   * @param {Object} config - Feedback loop configuration
   * @returns {Promise<Object>} Feedback loop results
   */
  async executeFeedbackLoop(sourceFile, config) {
    this.logger.info('Starting feedback loop', {
      sourceFile: sourceFile.getFileName(),
      targetScore: config.targetMutationScore,
      maxIterations: config.maxIterations
    });

    const results = {
      sourceFile,
      testFile: null,
      iterations: [],
      finalScore: 0,
      targetReached: false,
      totalIterations: 0,
      startTime: new Date(),
      endTime: null
    };

    try {
      // Step 1: Generate initial tests
      results.testFile = await this.testGenerationService.generateInitialTests(sourceFile, {
        context: config.initialContext
      });

      let currentIteration = 0;
      let mutationResult = null;

      // Step 2: Feedback loop
      while (currentIteration < config.maxIterations) {
        currentIteration++;
        
        this.logger.info(`Feedback iteration ${currentIteration}/${config.maxIterations}`, {
          sourceFile: sourceFile.getFileName()
        });

        const iterationStart = new Date();
        
        // Run mutation analysis
        mutationResult = await this.mutationAnalysisService.runMutationAnalysis(
          sourceFile,
          results.testFile,
          config.mutationOptions || {}
        );

        const iteration = {
          number: currentIteration,
          mutationResult,
          improvements: null,
          duration: null,
          startTime: iterationStart
        };

        // Check if target score is reached
        if (mutationResult.hasReachedTarget(config.targetMutationScore)) {
          this.logger.info('Target mutation score reached!', {
            score: mutationResult.mutationScore.toFixed(2),
            target: config.targetMutationScore,
            iteration: currentIteration
          });
          
          iteration.targetReached = true;
          iteration.endTime = new Date();
          iteration.duration = iteration.endTime - iterationStart;
          results.iterations.push(iteration);
          results.targetReached = true;
          break;
        }

        // If there are survived mutants, improve tests
        if (mutationResult.survivedMutants.length > 0) {
          this.logger.info('Improving tests to kill survived mutants', {
            count: mutationResult.survivedMutants.length
          });

          try {
            results.testFile = await this.testGenerationService.improveTests(
              sourceFile,
              results.testFile,
              mutationResult.survivedMutants,
              config.improvementOptions || {}
            );

            // Record improvements
            iteration.improvements = {
              survivedMutantsTargeted: mutationResult.survivedMutants.length,
              newTestCases: results.testFile.extractTestCases().length,
              testFileVersion: results.testFile.version
            };

            results.testFile.recordImprovement(mutationResult);
          } catch (improvementError) {
            this.logger.error('Failed to improve tests in iteration', {
              iteration: currentIteration,
              error: improvementError.message
            });
            
            iteration.error = improvementError.message;
            // Continue to next iteration even if improvement fails
          }
        } else {
          this.logger.info('No survived mutants to address');
          iteration.noMutantsToKill = true;
          iteration.endTime = new Date();
          iteration.duration = iteration.endTime - iterationStart;
          results.iterations.push(iteration);
          break;
        }

        iteration.endTime = new Date();
        iteration.duration = iteration.endTime - iterationStart;
        results.iterations.push(iteration);
      }

      // Final results
      results.totalIterations = currentIteration;
      results.finalScore = mutationResult ? mutationResult.mutationScore : 0;
      results.endTime = new Date();
      results.totalDuration = results.endTime - results.startTime;

      // Generate final analysis
      results.analysis = await this._generateFinalAnalysis(results, config);

      this.logger.info('Feedback loop completed', {
        sourceFile: sourceFile.getFileName(),
        iterations: results.totalIterations,
        finalScore: results.finalScore.toFixed(2),
        targetReached: results.targetReached,
        duration: this._formatDuration(results.totalDuration)
      });

      return results;
    } catch (error) {
      this.logger.error('Feedback loop failed', {
        sourceFile: sourceFile.getFileName(),
        iteration: results.totalIterations,
        error: error.message
      });

      results.error = error.message;
      results.endTime = new Date();
      results.totalDuration = results.endTime - results.startTime;
      
      throw error;
    }
  }

  /**
   * Analyze feedback loop performance
   * @param {Array<Object>} loopResults - Array of feedback loop results
   * @returns {Object} Performance analysis
   */
  analyzePerformance(loopResults) {
    if (loopResults.length === 0) {
      return { message: 'No results to analyze' };
    }

    const analysis = {
      totalFiles: loopResults.length,
      successfulFiles: loopResults.filter(r => !r.error).length,
      averageIterations: 0,
      averageFinalScore: 0,
      targetReachedCount: 0,
      averageDuration: 0,
      iterationEfficiency: [],
      convergencePatterns: [],
      commonFailures: []
    };

    const successful = loopResults.filter(r => !r.error);
    
    if (successful.length > 0) {
      analysis.averageIterations = successful.reduce((sum, r) => sum + r.totalIterations, 0) / successful.length;
      analysis.averageFinalScore = successful.reduce((sum, r) => sum + r.finalScore, 0) / successful.length;
      analysis.targetReachedCount = successful.filter(r => r.targetReached).length;
      analysis.averageDuration = successful.reduce((sum, r) => sum + r.totalDuration, 0) / successful.length;
    }

    // Analyze iteration efficiency
    analysis.iterationEfficiency = this._analyzeIterationEfficiency(successful);
    
    // Analyze convergence patterns
    analysis.convergencePatterns = this._analyzeConvergencePatterns(successful);
    
    // Analyze common failures
    analysis.commonFailures = this._analyzeCommonFailures(loopResults.filter(r => r.error));

    return analysis;
  }

  /**
   * Get optimization suggestions based on feedback loop results
   * @param {Array<Object>} loopResults - Array of feedback loop results
   * @returns {Array<Object>} Optimization suggestions
   */
  getOptimizationSuggestions(loopResults) {
    const suggestions = [];
    const analysis = this.analyzePerformance(loopResults);

    // Low success rate suggestions
    const successRate = analysis.successfulFiles / analysis.totalFiles;
    if (successRate < 0.8) {
      suggestions.push({
        type: 'configuration',
        category: 'reliability',
        title: 'Improve success rate',
        description: `Only ${(successRate * 100).toFixed(1)}% of files completed successfully`,
        recommendation: 'Review error patterns and adjust timeouts or API limits',
        priority: 'high'
      });
    }

    // High iteration count suggestions
    if (analysis.averageIterations > 4) {
      suggestions.push({
        type: 'configuration',
        category: 'efficiency',
        title: 'Reduce iteration count',
        description: `Average of ${analysis.averageIterations.toFixed(1)} iterations per file`,
        recommendation: 'Lower target mutation score or improve initial test generation prompts',
        priority: 'medium'
      });
    }

    // Low target reach rate suggestions
    const targetReachRate = analysis.targetReachedCount / analysis.successfulFiles;
    if (targetReachRate < 0.7 && analysis.successfulFiles > 0) {
      suggestions.push({
        type: 'configuration',
        category: 'effectiveness',
        title: 'Improve target achievement',
        description: `Only ${(targetReachRate * 100).toFixed(1)}% of files reached target score`,
        recommendation: 'Adjust target score or increase maximum iterations',
        priority: 'medium'
      });
    }

    // Performance suggestions
    if (analysis.averageDuration > 300000) { // 5 minutes
      suggestions.push({
        type: 'performance',
        category: 'speed',
        title: 'Optimize execution time',
        description: `Average duration is ${this._formatDuration(analysis.averageDuration)}`,
        recommendation: 'Use faster LLM model or optimize mutation testing configuration',
        priority: 'low'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Export feedback loop results
   * @param {Object} results - Feedback loop results
   * @param {string} format - Export format
   * @returns {Object|string} Exported data
   */
  exportResults(results, format = 'json') {
    switch (format) {
      case 'summary':
        return {
          sourceFile: results.sourceFile?.getFileName(),
          iterations: results.totalIterations,
          finalScore: results.finalScore,
          targetReached: results.targetReached,
          duration: results.totalDuration,
          success: !results.error
        };
      case 'detailed':
        return {
          ...results,
          sourceFile: results.sourceFile?.toJSON(),
          testFile: results.testFile?.toJSON(),
          iterations: results.iterations.map(iter => ({
            ...iter,
            mutationResult: iter.mutationResult?.toJSON()
          }))
        };
      case 'json':
      default:
        return JSON.stringify(this.exportResults(results, 'detailed'), null, 2);
    }
  }

  /**
   * Generate final analysis of feedback loop results
   * @param {Object} results - Feedback loop results
   * @param {Object} config - Configuration used
   * @returns {Promise<Object>} Final analysis
   * @private
   */
  async _generateFinalAnalysis(results, config) {
    const analysis = {
      summary: {
        success: !results.error,
        targetReached: results.targetReached,
        finalScore: results.finalScore,
        totalIterations: results.totalIterations,
        duration: results.totalDuration
      },
      iterations: results.iterations.map((iter, index) => ({
        number: iter.number,
        score: iter.mutationResult?.mutationScore || 0,
        survivedMutants: iter.mutationResult?.survivedMutants.length || 0,
        improvement: index > 0 ? 
          (iter.mutationResult?.mutationScore || 0) - (results.iterations[index-1].mutationResult?.mutationScore || 0) : 0,
        duration: iter.duration
      })),
      convergence: {
        scoreProgression: results.iterations.map(iter => iter.mutationResult?.mutationScore || 0),
        averageImprovement: results.iterations.length > 1 ?
          (results.finalScore - (results.iterations[0].mutationResult?.mutationScore || 0)) / (results.iterations.length - 1) : 0,
        diminishingReturns: this._detectDiminishingReturns(results.iterations)
      },
      efficiency: {
        timePerIteration: results.totalIterations > 0 ? results.totalDuration / results.totalIterations : 0,
        scorePerIteration: results.totalIterations > 0 ? results.finalScore / results.totalIterations : 0,
        costEffectiveness: results.testFile ? this._calculateCostEffectiveness(results) : 0
      }
    };

    // Add recommendations if target wasn't reached
    if (!results.targetReached && results.iterations.length > 0) {
      const lastIteration = results.iterations[results.iterations.length - 1];
      if (lastIteration.mutationResult) {
        analysis.recommendations = this.mutationAnalysisService.getRecommendations(
          lastIteration.mutationResult,
          { feedbackLoop: true }
        );
      }
    }

    return analysis;
  }

  /**
   * Analyze iteration efficiency across multiple results
   * @param {Array<Object>} results - Successful feedback loop results
   * @returns {Object} Iteration efficiency analysis
   * @private
   */
  _analyzeIterationEfficiency(results) {
    if (results.length === 0) return {};

    const efficiencyByIteration = {};
    
    results.forEach(result => {
      result.iterations.forEach((iter, index) => {
        if (!efficiencyByIteration[index + 1]) {
          efficiencyByIteration[index + 1] = {
            totalFiles: 0,
            averageImprovement: 0,
            averageDuration: 0
          };
        }
        
        const iterData = efficiencyByIteration[index + 1];
        iterData.totalFiles++;
        
        if (index > 0) {
          const previousScore = result.iterations[index - 1].mutationResult?.mutationScore || 0;
          const currentScore = iter.mutationResult?.mutationScore || 0;
          iterData.averageImprovement += (currentScore - previousScore);
        }
        
        iterData.averageDuration += iter.duration || 0;
      });
    });

    // Calculate averages
    Object.values(efficiencyByIteration).forEach(data => {
      data.averageImprovement /= data.totalFiles;
      data.averageDuration /= data.totalFiles;
    });

    return efficiencyByIteration;
  }

  /**
   * Analyze convergence patterns
   * @param {Array<Object>} results - Successful feedback loop results
   * @returns {Object} Convergence analysis
   * @private
   */
  _analyzeConvergencePatterns(results) {
    if (results.length === 0) return {};

    const patterns = {
      fastConvergence: results.filter(r => r.targetReached && r.totalIterations <= 2).length,
      slowConvergence: results.filter(r => r.targetReached && r.totalIterations >= 4).length,
      nonConvergent: results.filter(r => !r.targetReached).length,
      averageConvergenceIteration: 0
    };

    const converged = results.filter(r => r.targetReached);
    if (converged.length > 0) {
      patterns.averageConvergenceIteration = 
        converged.reduce((sum, r) => sum + r.totalIterations, 0) / converged.length;
    }

    return patterns;
  }

  /**
   * Analyze common failures
   * @param {Array<Object>} failedResults - Failed feedback loop results
   * @returns {Array<Object>} Common failure patterns
   * @private
   */
  _analyzeCommonFailures(failedResults) {
    if (failedResults.length === 0) return [];

    const errorCounts = {};
    failedResults.forEach(result => {
      const errorType = this._categorizeError(result.error);
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .map(([error, count]) => ({ error, count, percentage: (count / failedResults.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Detect diminishing returns in iterations
   * @param {Array<Object>} iterations - Feedback loop iterations
   * @returns {boolean} True if diminishing returns detected
   * @private
   */
  _detectDiminishingReturns(iterations) {
    if (iterations.length < 3) return false;

    const improvements = [];
    for (let i = 1; i < iterations.length; i++) {
      const currentScore = iterations[i].mutationResult?.mutationScore || 0;
      const previousScore = iterations[i-1].mutationResult?.mutationScore || 0;
      improvements.push(currentScore - previousScore);
    }

    // Check if improvements are consistently decreasing
    let decreasingCount = 0;
    for (let i = 1; i < improvements.length; i++) {
      if (improvements[i] < improvements[i-1]) {
        decreasingCount++;
      }
    }

    return decreasingCount >= improvements.length * 0.6;
  }

  /**
   * Calculate cost effectiveness of feedback loop
   * @param {Object} results - Feedback loop results
   * @returns {number} Cost effectiveness score
   * @private
   */
  _calculateCostEffectiveness(results) {
    // Simple calculation: score improvement per unit time
    const scoreImprovement = results.finalScore;
    const timeInMinutes = results.totalDuration / 60000;
    
    return timeInMinutes > 0 ? scoreImprovement / timeInMinutes : 0;
  }

  /**
   * Categorize error for analysis
   * @param {string} error - Error message
   * @returns {string} Error category
   * @private
   */
  _categorizeError(error) {
    if (error.includes('API') || error.includes('rate limit')) return 'API Error';
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('file') || error.includes('path')) return 'File System';
    if (error.includes('syntax') || error.includes('parse')) return 'Syntax Error';
    if (error.includes('mutation')) return 'Mutation Testing';
    return 'Other';
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

module.exports = FeedbackLoopService;