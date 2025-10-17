/**
 * Mutation result entity representing the outcome of mutation testing
 */
class MutationResult {
  constructor(sourceFile, testFile, mutationScore = 0, rawResults = {}) {
    this.id = this._generateId();
    this.sourceFile = sourceFile;
    this.testFile = testFile;
    this.mutationScore = mutationScore;
    this.rawResults = rawResults;
    this.timestamp = new Date();
    this.totalMutants = 0;
    this.killedMutants = [];
    this.survivedMutants = [];
    this.timeoutMutants = [];
    this.noCoverageMutants = [];
    this.executionTime = 0;
    this.status = 'pending';
  }

  /**
   * Set mutation results
   * @param {Object} results - Processed mutation results
   */
  setResults(results) {
    this.mutationScore = results.mutationScore || 0;
    this.totalMutants = results.totalMutants || 0;
    this.killedMutants = results.killedMutants || [];
    this.survivedMutants = results.survivedMutants || [];
    this.timeoutMutants = results.timeoutMutants || [];
    this.noCoverageMutants = results.noCoverageMutants || [];
    this.executionTime = results.executionTime || 0;
    this.status = 'completed';
  }

  /**
   * Check if target mutation score was reached
   * @param {number} targetScore - Target mutation score
   * @returns {boolean} True if target was reached
   */
  hasReachedTarget(targetScore) {
    return this.mutationScore >= targetScore;
  }

  /**
   * Get score category
   * @returns {string} Score category (excellent, good, fair, poor)
   */
  getScoreCategory() {
    if (this.mutationScore >= 90) return 'excellent';
    if (this.mutationScore >= 80) return 'good';
    if (this.mutationScore >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Get mutants by type
   * @param {string} type - Mutator type
   * @returns {Array} Mutants of specified type
   */
  getMutantsByType(type) {
    return [...this.killedMutants, ...this.survivedMutants]
      .filter(mutant => mutant.mutatorName === type);
  }

  /**
   * Get most problematic mutators
   * @param {number} limit - Number of mutators to return
   * @returns {Array<Object>} Problematic mutators with survival rates
   */
  getProblematicMutators(limit = 5) {
    const mutatorStats = {};
    
    // Count survived mutants by mutator
    this.survivedMutants.forEach(mutant => {
      if (!mutatorStats[mutant.mutatorName]) {
        mutatorStats[mutant.mutatorName] = { survived: 0, total: 0 };
      }
      mutatorStats[mutant.mutatorName].survived++;
      mutatorStats[mutant.mutatorName].total++;
    });

    // Count killed mutants by mutator
    this.killedMutants.forEach(mutant => {
      if (!mutatorStats[mutant.mutatorName]) {
        mutatorStats[mutant.mutatorName] = { survived: 0, total: 0 };
      }
      mutatorStats[mutant.mutatorName].total++;
    });

    // Calculate survival rates
    const problematic = Object.entries(mutatorStats)
      .map(([mutator, stats]) => ({
        mutator,
        survivedCount: stats.survived,
        totalCount: stats.total,
        survivalRate: (stats.survived / stats.total) * 100
      }))
      .sort((a, b) => b.survivalRate - a.survivalRate)
      .slice(0, limit);

    return problematic;
  }

  /**
   * Get coverage gaps (areas not covered by tests)
   * @returns {Array<Object>} Coverage gaps
   */
  getCoverageGaps() {
    const gaps = [];
    
    // Group survived mutants by location
    const locationGroups = {};
    this.survivedMutants.forEach(mutant => {
      const key = `${mutant.location.start.line}:${mutant.location.start.column}`;
      if (!locationGroups[key]) {
        locationGroups[key] = [];
      }
      locationGroups[key].push(mutant);
    });

    // Identify gap patterns
    Object.entries(locationGroups).forEach(([location, mutants]) => {
      const [line, column] = location.split(':').map(Number);
      gaps.push({
        line,
        column,
        mutantCount: mutants.length,
        mutators: mutants.map(m => m.mutatorName),
        severity: mutants.length > 1 ? 'high' : 'medium'
      });
    });

    return gaps.sort((a, b) => b.mutantCount - a.mutantCount);
  }

  /**
   * Generate improvement suggestions
   * @returns {Array<string>} Improvement suggestions
   */
  getImprovementSuggestions() {
    const suggestions = [];
    
    if (this.mutationScore < 50) {
      suggestions.push('Consider adding more comprehensive test cases covering basic functionality');
    }
    
    if (this.survivedMutants.length > 10) {
      suggestions.push('Focus on testing edge cases and boundary conditions');
    }
    
    const arithmeticSurvived = this.survivedMutants.filter(m => 
      m.mutatorName.includes('Arithmetic')).length;
    if (arithmeticSurvived > 0) {
      suggestions.push('Add tests for different arithmetic operations and edge values');
    }
    
    const conditionalSurvived = this.survivedMutants.filter(m => 
      m.mutatorName.includes('Conditional')).length;
    if (conditionalSurvived > 0) {
      suggestions.push('Test boundary conditions and different comparison scenarios');
    }
    
    if (this.noCoverageMutants.length > 0) {
      suggestions.push('Improve test coverage - some code paths are not being tested');
    }
    
    return suggestions;
  }

  /**
   * Compare with previous result
   * @param {MutationResult} previousResult - Previous mutation result
   * @returns {Object} Comparison summary
   */
  compareWith(previousResult) {
    return {
      scoreImprovement: this.mutationScore - previousResult.mutationScore,
      newlyKilledMutants: this.killedMutants.length - previousResult.killedMutants.length,
      newSurvivedMutants: this.survivedMutants.length - previousResult.survivedMutants.length,
      isImprovement: this.mutationScore > previousResult.mutationScore
    };
  }

  /**
   * Convert to JSON representation
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      sourceFile: this.sourceFile?.getFileName(),
      testFile: this.testFile?.getFileName(),
      mutationScore: this.mutationScore,
      scoreCategory: this.getScoreCategory(),
      totalMutants: this.totalMutants,
      killedCount: this.killedMutants.length,
      survivedCount: this.survivedMutants.length,
      timeoutCount: this.timeoutMutants.length,
      noCoverageCount: this.noCoverageMutants.length,
      executionTime: this.executionTime,
      timestamp: this.timestamp,
      status: this.status,
      problematicMutators: this.getProblematicMutators(3),
      coverageGaps: this.getCoverageGaps().slice(0, 5),
      suggestions: this.getImprovementSuggestions()
    };
  }

  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   * @private
   */
  _generateId() {
    return `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = MutationResult;