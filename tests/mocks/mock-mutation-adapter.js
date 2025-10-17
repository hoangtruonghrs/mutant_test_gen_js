/**
 * Mock Mutation Adapter for testing
 */

class MockMutationAdapter {
  constructor(config = {}) {
    this.config = config;
    this.calls = [];
    this.shouldFail = config.shouldFail || false;
    this.delay = config.delay || 0;
    this.mockResults = config.mockResults || null;
  }

  async runMutationTests(sourceFilePath, testFilePath, options = {}) {
    this.calls.push({
      method: 'runMutationTests',
      args: { sourceFilePath, testFilePath, options },
      timestamp: Date.now()
    });

    if (this.delay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.delay));
    }

    if (this.shouldFail) {
      throw new Error('Mutation testing failed: Mock failure');
    }

    if (this.mockResults) {
      return this.mockResults;
    }

    // Return default mock results
    return {
      mutationScore: 75.5,
      totalMutants: 20,
      killedMutants: 15,
      survivedMutants: 5,
      timedOutMutants: 0,
      noCoverageMutants: 0,
      mutants: [
        {
          id: '1',
          mutatorName: 'ConditionalExpression',
          location: { start: { line: 10, column: 5 }, end: { line: 10, column: 20 } },
          replacement: '!condition',
          status: 'Killed'
        },
        {
          id: '2',
          mutatorName: 'BlockStatement',
          location: { start: { line: 15, column: 3 }, end: { line: 17, column: 4 } },
          replacement: '{}',
          status: 'Survived'
        },
        {
          id: '3',
          mutatorName: 'StringLiteral',
          location: { start: { line: 20, column: 10 }, end: { line: 20, column: 25 } },
          replacement: '""',
          status: 'Killed'
        }
      ],
      files: {
        [sourceFilePath]: {
          mutationScore: 75.5,
          killed: 15,
          survived: 5,
          timeout: 0,
          noCoverage: 0
        }
      }
    };
  }

  async cleanup() {
    this.calls.push({
      method: 'cleanup',
      args: {},
      timestamp: Date.now()
    });
    // Mock cleanup
  }

  getCallCount() {
    return this.calls.length;
  }

  getLastCall() {
    return this.calls[this.calls.length - 1];
  }

  reset() {
    this.calls = [];
  }

  setMockResults(results) {
    this.mockResults = results;
  }

  setShouldFail(shouldFail) {
    this.shouldFail = shouldFail;
  }
}

module.exports = { MockMutationAdapter };
