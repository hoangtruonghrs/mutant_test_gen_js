/**
 * Test file entity representing a generated test file
 */
class TestFile {
  constructor(filePath, content = '', sourceFile = null) {
    this.filePath = filePath;
    this.content = content;
    this.sourceFile = sourceFile;
    this.createdAt = new Date();
    this.lastModified = null;
    this.version = 1;
    this.generationMetadata = {
      iterations: 0,
      lastImprovement: null,
      improvementHistory: []
    };
  }

  /**
   * Get test file name
   * @returns {string} Test file name
   */
  getFileName() {
    return this.filePath.split(/[/\\]/).pop();
  }

  /**
   * Get test content
   * @returns {string} Test content
   */
  getContent() {
    return this.content;
  }

  /**
   * Get corresponding source file name
   * @returns {string} Source file name
   */
  getSourceFileName() {
    if (this.sourceFile) {
      return this.sourceFile.getFileName();
    }
    // Extract from test file name (remove .test.js)
    return this.getFileName().replace(/\.test\.js$/, '.js');
  }

  /**
   * Update test content
   * @param {string} newContent - New test content
   * @param {string} reason - Reason for update
   */
  updateContent(newContent, reason = 'manual') {
    this.content = newContent;
    this.lastModified = new Date();
    this.version++;

    this.generationMetadata.improvementHistory.push({
      version: this.version,
      timestamp: this.lastModified,
      reason,
      contentLength: newContent.length
    });
  }

  /**
   * Record an improvement iteration
   * @param {Object} results - Improvement results
   */
  recordImprovement(results) {
    this.generationMetadata.iterations++;
    this.generationMetadata.lastImprovement = {
      timestamp: new Date(),
      mutationScore: results.mutationScore,
      survivedMutants: results.survivedMutants?.length || 0,
      killedMutants: results.killedMutants?.length || 0
    };
  }

  /**
   * Extract test cases from content
   * @returns {Array<Object>} Test cases
   */
  extractTestCases() {
    const testCases = [];
    const testRegex = /(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = testRegex.exec(this.content)) !== null) {
      testCases.push({
        name: match[1],
        line: this.content.substring(0, match.index).split('\n').length,
        type: 'test'
      });
    }

    return testCases;
  }

  /**
   * Extract describe blocks
   * @returns {Array<Object>} Describe blocks
   */
  extractDescribeBlocks() {
    const describes = [];
    const describeRegex = /describe\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = describeRegex.exec(this.content)) !== null) {
      describes.push({
        name: match[1],
        line: this.content.substring(0, match.index).split('\n').length,
        type: 'describe'
      });
    }

    return describes;
  }

  /**
   * Get test statistics
   * @returns {Object} Test statistics
   */
  getStatistics() {
    const testCases = this.extractTestCases();
    const describes = this.extractDescribeBlocks();
    const lineCount = this.content.split('\n').length;

    return {
      testCases: testCases.length,
      describeBlocks: describes.length,
      lines: lineCount,
      size: this.content.length,
      version: this.version,
      iterations: this.generationMetadata.iterations,
      lastImprovement: this.generationMetadata.lastImprovement
    };
  }

  /**
   * Validate test syntax (basic check)
   * @returns {boolean} True if syntax appears valid
   */
  validateSyntax() {
    try {
      // Basic syntax validation
      const hasDescribe = this.content.includes('describe(');
      const hasTest = this.content.includes('it(') || this.content.includes('test(');
      const hasExpect = this.content.includes('expect(');

      return hasDescribe && hasTest && hasExpect;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get coverage areas (estimated)
   * @returns {Array<string>} Coverage areas
   */
  getCoverageAreas() {
    const areas = [];

    if (this.content.includes('expect(') && this.content.includes('.toBe')) {
      areas.push('basic_assertions');
    }
    if (this.content.includes('.toThrow')) {
      areas.push('error_handling');
    }
    if (this.content.includes('null') || this.content.includes('undefined')) {
      areas.push('edge_cases');
    }
    if (this.content.includes('beforeEach') || this.content.includes('beforeAll')) {
      areas.push('setup_teardown');
    }

    return areas;
  }

  /**
   * Convert to JSON representation
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      filePath: this.filePath,
      fileName: this.getFileName(),
      sourceFile: this.sourceFile?.getFileName(),
      size: this.content.length,
      lines: this.content.split('\n').length,
      version: this.version,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      statistics: this.getStatistics(),
      generationMetadata: this.generationMetadata,
      coverageAreas: this.getCoverageAreas()
    };
  }
}

module.exports = TestFile;