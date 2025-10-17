const MutationResult = require('../entities/mutation-result');

/**
 * Mutation analysis service for processing mutation testing results
 */
class MutationAnalysisService {
  constructor(mutationEngine, storageProvider, logger) {
    this.mutationEngine = mutationEngine;
    this.storageProvider = storageProvider;
    this.logger = logger;
  }

  /**
   * Run mutation testing and analyze results
   * @param {SourceFile} sourceFile - Source file entity
   * @param {TestFile} testFile - Test file entity
   * @param {Object} options - Analysis options
   * @returns {Promise<MutationResult>} Mutation analysis results
   */
  async runMutationAnalysis(sourceFile, testFile, options = {}) {
    this.logger.info('Running mutation analysis', {
      sourceFile: sourceFile.getFileName(),
      testFile: testFile.getFileName()
    });

    try {
      // Run mutation testing
      const rawResults = await this.mutationEngine.runMutationTests(
        sourceFile.filePath,
        testFile.filePath,
        options
      );

      // Create mutation result entity
      const mutationResult = new MutationResult(sourceFile, testFile);
      mutationResult.setResults(rawResults);

      // Perform additional analysis
      await this._performDetailedAnalysis(mutationResult, options);

      // Generate report if requested
      if (options.generateReport !== false) {
        await this._generateAnalysisReport(mutationResult, options);
      }

      this.logger.info('Mutation analysis completed', {
        sourceFile: sourceFile.getFileName(),
        mutationScore: mutationResult.mutationScore.toFixed(2),
        totalMutants: mutationResult.totalMutants,
        survivedMutants: mutationResult.survivedMutants.length
      });

      return mutationResult;
    } catch (error) {
      this.logger.error('Mutation analysis failed', {
        sourceFile: sourceFile.getFileName(),
        testFile: testFile.getFileName(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Analyze mutation trends across multiple results
   * @param {Array<MutationResult>} results - Array of mutation results
   * @returns {Object} Trend analysis
   */
  analyzeTrends(results) {
    if (results.length === 0) {
      return { message: 'No results to analyze' };
    }

    const trends = {
      scoreProgression: results.map(r => ({
        timestamp: r.timestamp,
        score: r.mutationScore,
        iteration: results.indexOf(r) + 1
      })),
      averageScore: results.reduce((sum, r) => sum + r.mutationScore, 0) / results.length,
      bestScore: Math.max(...results.map(r => r.mutationScore)),
      worstScore: Math.min(...results.map(r => r.mutationScore)),
      improvement: results.length > 1 ? 
        results[results.length - 1].mutationScore - results[0].mutationScore : 0,
      consistentlyProblematicMutators: this._findConsistentProblems(results),
      coverageGapTrends: this._analyzeCoverageGapTrends(results)
    };

    return trends;
  }

  /**
   * Get recommendations based on mutation analysis
   * @param {MutationResult} mutationResult - Mutation result to analyze
   * @param {Object} context - Additional context
   * @returns {Array<Object>} Recommendations
   */
  getRecommendations(mutationResult, context = {}) {
    const recommendations = [];
    
    // Score-based recommendations
    if (mutationResult.mutationScore < 50) {
      recommendations.push({
        type: 'critical',
        category: 'coverage',
        title: 'Low mutation score detected',
        description: 'Add comprehensive test cases covering basic functionality',
        priority: 'high',
        effort: 'high'
      });
    } else if (mutationResult.mutationScore < 80) {
      recommendations.push({
        type: 'improvement',
        category: 'coverage',
        title: 'Improve mutation score',
        description: 'Focus on edge cases and boundary conditions',
        priority: 'medium',
        effort: 'medium'
      });
    }

    // Mutant-specific recommendations
    const problematicMutators = mutationResult.getProblematicMutators(3);
    problematicMutators.forEach(mutator => {
      recommendations.push({
        type: 'specific',
        category: 'mutator',
        title: `Address ${mutator.mutator} mutations`,
        description: `${mutator.survivedCount} ${mutator.mutator} mutants survived (${mutator.survivalRate.toFixed(1)}% survival rate)`,
        priority: mutator.survivalRate > 50 ? 'high' : 'medium',
        effort: 'low',
        mutator: mutator.mutator
      });
    });

    // Coverage gap recommendations
    const coverageGaps = mutationResult.getCoverageGaps();
    if (coverageGaps.length > 0) {
      coverageGaps.slice(0, 3).forEach(gap => {
        recommendations.push({
          type: 'specific',
          category: 'coverage',
          title: `Test line ${gap.line}`,
          description: `${gap.mutantCount} mutants survived at line ${gap.line}`,
          priority: gap.severity === 'high' ? 'high' : 'medium',
          effort: 'low',
          location: { line: gap.line }
        });
      });
    }

    // No coverage recommendations
    if (mutationResult.noCoverageMutants.length > 0) {
      recommendations.push({
        type: 'critical',
        category: 'coverage',
        title: 'Untested code detected',
        description: `${mutationResult.noCoverageMutants.length} mutants have no test coverage`,
        priority: 'high',
        effort: 'medium'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Compare mutation results
   * @param {MutationResult} currentResult - Current result
   * @param {MutationResult} previousResult - Previous result
   * @returns {Object} Comparison analysis
   */
  compareResults(currentResult, previousResult) {
    return {
      scoreChange: currentResult.mutationScore - previousResult.mutationScore,
      mutantChanges: {
        newlyKilled: currentResult.killedMutants.length - previousResult.killedMutants.length,
        newSurvivors: currentResult.survivedMutants.length - previousResult.survivedMutants.length,
        totalChange: currentResult.totalMutants - previousResult.totalMutants
      },
      improvement: currentResult.mutationScore > previousResult.mutationScore,
      significantImprovement: (currentResult.mutationScore - previousResult.mutationScore) >= 5,
      regression: currentResult.mutationScore < previousResult.mutationScore,
      details: currentResult.compareWith(previousResult)
    };
  }

  /**
   * Export analysis results
   * @param {MutationResult} mutationResult - Mutation result
   * @param {string} format - Export format
   * @returns {Object|string} Exported data
   */
  exportResults(mutationResult, format = 'json') {
    switch (format) {
      case 'summary':
        return {
          score: mutationResult.mutationScore,
          total: mutationResult.totalMutants,
          killed: mutationResult.killedMutants.length,
          survived: mutationResult.survivedMutants.length,
          timestamp: mutationResult.timestamp
        };
      case 'csv':
        return this._exportToCSV(mutationResult);
      case 'json':
      default:
        return mutationResult.toJSON();
    }
  }

  /**
   * Perform detailed analysis on mutation results
   * @param {MutationResult} mutationResult - Mutation result entity
   * @param {Object} options - Analysis options
   * @returns {Promise<void>}
   * @private
   */
  async _performDetailedAnalysis(mutationResult, options) {
    // Add execution time tracking
    mutationResult.executionTime = Date.now() - mutationResult.timestamp.getTime();
    
    // Analyze mutant patterns
    const patterns = this._analyzeMutantPatterns(mutationResult);
    mutationResult.patterns = patterns;
    
    // Calculate quality metrics
    const qualityMetrics = this._calculateQualityMetrics(mutationResult);
    mutationResult.qualityMetrics = qualityMetrics;
  }

  /**
   * Generate analysis report
   * @param {MutationResult} mutationResult - Mutation result
   * @param {Object} options - Report options
   * @returns {Promise<void>}
   * @private
   */
  async _generateAnalysisReport(mutationResult, options) {
    const reportPath = options.reportPath || 
      `reports/${mutationResult.sourceFile.getFileName().replace('.js', '')}-mutation-analysis.json`;
    
    await this.mutationEngine.generateReport(mutationResult, reportPath);
  }

  /**
   * Find consistently problematic mutators
   * @param {Array<MutationResult>} results - Array of mutation results
   * @returns {Array} Consistent problems
   * @private
   */
  _findConsistentProblems(results) {
    const mutatorFrequency = {};
    
    results.forEach(result => {
      const problematic = result.getProblematicMutators(5);
      problematic.forEach(mutator => {
        if (!mutatorFrequency[mutator.mutator]) {
          mutatorFrequency[mutator.mutator] = 0;
        }
        mutatorFrequency[mutator.mutator]++;
      });
    });
    
    return Object.entries(mutatorFrequency)
      .filter(([_, frequency]) => frequency >= Math.max(2, results.length * 0.5))
      .map(([mutator, frequency]) => ({ mutator, frequency }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Analyze coverage gap trends
   * @param {Array<MutationResult>} results - Array of mutation results
   * @returns {Object} Coverage gap trends
   * @private
   */
  _analyzeCoverageGapTrends(results) {
    const gapsByLine = {};
    
    results.forEach((result, index) => {
      const gaps = result.getCoverageGaps();
      gaps.forEach(gap => {
        if (!gapsByLine[gap.line]) {
          gapsByLine[gap.line] = [];
        }
        gapsByLine[gap.line].push({
          iteration: index + 1,
          mutantCount: gap.mutantCount,
          severity: gap.severity
        });
      });
    });
    
    return {
      persistentGaps: Object.entries(gapsByLine)
        .filter(([_, gaps]) => gaps.length >= Math.max(2, results.length * 0.5))
        .map(([line, gaps]) => ({ line: parseInt(line), occurrences: gaps.length, gaps })),
      improving: Object.entries(gapsByLine)
        .filter(([_, gaps]) => gaps.length > 1 && 
          gaps[gaps.length - 1].mutantCount < gaps[0].mutantCount)
        .map(([line, gaps]) => ({ line: parseInt(line), gaps }))
    };
  }

  /**
   * Analyze mutant patterns
   * @param {MutationResult} mutationResult - Mutation result
   * @returns {Object} Pattern analysis
   * @private
   */
  _analyzeMutantPatterns(mutationResult) {
    const patterns = {
      mutatorDistribution: {},
      locationClusters: [],
      typePatterns: {}
    };
    
    // Analyze mutator distribution
    [...mutationResult.survivedMutants, ...mutationResult.killedMutants].forEach(mutant => {
      if (!patterns.mutatorDistribution[mutant.mutatorName]) {
        patterns.mutatorDistribution[mutant.mutatorName] = { total: 0, survived: 0 };
      }
      patterns.mutatorDistribution[mutant.mutatorName].total++;
      if (mutant.status === 'Survived') {
        patterns.mutatorDistribution[mutant.mutatorName].survived++;
      }
    });
    
    return patterns;
  }

  /**
   * Calculate quality metrics
   * @param {MutationResult} mutationResult - Mutation result
   * @returns {Object} Quality metrics
   * @private
   */
  _calculateQualityMetrics(mutationResult) {
    const totalMutants = mutationResult.totalMutants;
    const survivedMutants = mutationResult.survivedMutants.length;
    
    return {
      testStrength: totalMutants > 0 ? (1 - survivedMutants / totalMutants) : 0,
      coverageCompleteness: mutationResult.noCoverageMutants.length === 0,
      mutantDiversity: Object.keys(mutationResult.getProblematicMutators()).length,
      testQualityScore: this._calculateTestQualityScore(mutationResult)
    };
  }

  /**
   * Calculate test quality score
   * @param {MutationResult} mutationResult - Mutation result
   * @returns {number} Test quality score (0-100)
   * @private
   */
  _calculateTestQualityScore(mutationResult) {
    let score = mutationResult.mutationScore;
    
    // Penalty for no coverage
    if (mutationResult.noCoverageMutants.length > 0) {
      score *= 0.8;
    }
    
    // Bonus for killing all mutants
    if (mutationResult.survivedMutants.length === 0) {
      score = Math.min(100, score * 1.1);
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Export results to CSV format
   * @param {MutationResult} mutationResult - Mutation result
   * @returns {string} CSV data
   * @private
   */
  _exportToCSV(mutationResult) {
    const headers = ['File', 'Mutator', 'Line', 'Status', 'Replacement'];
    const rows = [headers.join(',')];
    
    const allMutants = [
      ...mutationResult.killedMutants,
      ...mutationResult.survivedMutants,
      ...mutationResult.timeoutMutants,
      ...mutationResult.noCoverageMutants
    ];
    
    allMutants.forEach(mutant => {
      const row = [
        mutant.fileName,
        mutant.mutatorName,
        mutant.location.start.line,
        mutant.status,
        `"${mutant.replacement}"`
      ];
      rows.push(row.join(','));
    });
    
    return rows.join('\n');
  }
}

module.exports = MutationAnalysisService;