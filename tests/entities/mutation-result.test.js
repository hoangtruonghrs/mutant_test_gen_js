/**
 * Unit tests for MutationResult entity
 */

const MutationResult = require('../../lib/core/entities/mutation-result');
const SourceFile = require('../../lib/core/entities/source-file');
const TestFile = require('../../lib/core/entities/test-file');
const { sampleSourceCode, sampleTestCode, sampleMutationResults } = require('../fixtures/sample-data');

describe('MutationResult Entity', () => {
  let sourceFile;
  let testFile;

  beforeEach(() => {
    sourceFile = new SourceFile('/src/calculator.js', sampleSourceCode);
    testFile = new TestFile('/tests/calculator.test.js', sampleTestCode);
  });

  describe('Constructor', () => {
    test('should create a MutationResult with required properties', () => {
      const result = new MutationResult(sourceFile, testFile);

      expect(result.id).toBeDefined();
      expect(result.id).toMatch(/^mut_/);
      expect(result.sourceFile).toBe(sourceFile);
      expect(result.testFile).toBe(testFile);
      expect(result.mutationScore).toBe(0);
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.status).toBe('pending');
    });

    test('should accept initial mutation score', () => {
      const result = new MutationResult(sourceFile, testFile, 85.5);

      expect(result.mutationScore).toBe(85.5);
    });

    test('should accept raw results', () => {
      const rawResults = { framework: 'stryker', version: '6.0' };
      const result = new MutationResult(sourceFile, testFile, 0, rawResults);

      expect(result.rawResults).toEqual(rawResults);
    });

    test('should initialize empty mutant arrays', () => {
      const result = new MutationResult(sourceFile, testFile);

      expect(result.killedMutants).toEqual([]);
      expect(result.survivedMutants).toEqual([]);
      expect(result.timeoutMutants).toEqual([]);
      expect(result.noCoverageMutants).toEqual([]);
    });
  });

  describe('setResults', () => {
    test('should update mutation results', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      const results = {
        mutationScore: 75.5,
        totalMutants: 20,
        killedMutants: [{ id: 1 }, { id: 2 }],
        survivedMutants: [{ id: 3 }],
        timeoutMutants: [],
        noCoverageMutants: [],
        executionTime: 5000
      };

      result.setResults(results);

      expect(result.mutationScore).toBe(75.5);
      expect(result.totalMutants).toBe(20);
      expect(result.killedMutants).toHaveLength(2);
      expect(result.survivedMutants).toHaveLength(1);
      expect(result.executionTime).toBe(5000);
      expect(result.status).toBe('completed');
    });

    test('should handle partial results', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      result.setResults({ mutationScore: 80 });

      expect(result.mutationScore).toBe(80);
      expect(result.totalMutants).toBe(0);
      expect(result.killedMutants).toEqual([]);
    });
  });

  describe('hasReachedTarget', () => {
    test('should return true when target is reached', () => {
      const result = new MutationResult(sourceFile, testFile, 85);

      expect(result.hasReachedTarget(80)).toBe(true);
      expect(result.hasReachedTarget(85)).toBe(true);
    });

    test('should return false when target is not reached', () => {
      const result = new MutationResult(sourceFile, testFile, 75);

      expect(result.hasReachedTarget(80)).toBe(false);
      expect(result.hasReachedTarget(90)).toBe(false);
    });

    test('should handle edge case of exact match', () => {
      const result = new MutationResult(sourceFile, testFile, 80);

      expect(result.hasReachedTarget(80)).toBe(true);
    });
  });

  describe('getScoreCategory', () => {
    test('should return "excellent" for scores >= 90', () => {
      const result1 = new MutationResult(sourceFile, testFile, 90);
      const result2 = new MutationResult(sourceFile, testFile, 95);
      const result3 = new MutationResult(sourceFile, testFile, 100);

      expect(result1.getScoreCategory()).toBe('excellent');
      expect(result2.getScoreCategory()).toBe('excellent');
      expect(result3.getScoreCategory()).toBe('excellent');
    });

    test('should return "good" for scores 80-89', () => {
      const result1 = new MutationResult(sourceFile, testFile, 80);
      const result2 = new MutationResult(sourceFile, testFile, 85);
      const result3 = new MutationResult(sourceFile, testFile, 89);

      expect(result1.getScoreCategory()).toBe('good');
      expect(result2.getScoreCategory()).toBe('good');
      expect(result3.getScoreCategory()).toBe('good');
    });

    test('should return "fair" for scores 60-79', () => {
      const result1 = new MutationResult(sourceFile, testFile, 60);
      const result2 = new MutationResult(sourceFile, testFile, 70);
      const result3 = new MutationResult(sourceFile, testFile, 79);

      expect(result1.getScoreCategory()).toBe('fair');
      expect(result2.getScoreCategory()).toBe('fair');
      expect(result3.getScoreCategory()).toBe('fair');
    });

    test('should return "poor" for scores < 60', () => {
      const result1 = new MutationResult(sourceFile, testFile, 0);
      const result2 = new MutationResult(sourceFile, testFile, 30);
      const result3 = new MutationResult(sourceFile, testFile, 59);

      expect(result1.getScoreCategory()).toBe('poor');
      expect(result2.getScoreCategory()).toBe('poor');
      expect(result3.getScoreCategory()).toBe('poor');
    });
  });

  describe('getMutantsByType', () => {
    test('should filter mutants by type', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      result.setResults({
        killedMutants: [
          { id: 1, mutatorName: 'ArithmeticOperator' },
          { id: 2, mutatorName: 'ConditionalExpression' }
        ],
        survivedMutants: [
          { id: 3, mutatorName: 'ArithmeticOperator' },
          { id: 4, mutatorName: 'BlockStatement' }
        ]
      });

      const arithmeticMutants = result.getMutantsByType('ArithmeticOperator');

      expect(arithmeticMutants).toHaveLength(2);
      expect(arithmeticMutants.every(m => m.mutatorName === 'ArithmeticOperator')).toBe(true);
    });

    test('should return empty array when no mutants match', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      result.setResults({
        killedMutants: [{ id: 1, mutatorName: 'ArithmeticOperator' }]
      });

      const stringMutants = result.getMutantsByType('StringLiteral');

      expect(stringMutants).toEqual([]);
    });
  });

  describe('getProblematicMutators', () => {
    test('should identify mutators with high survival rates', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      result.setResults({
        killedMutants: [
          { id: 1, mutatorName: 'TypeA' }
        ],
        survivedMutants: [
          { id: 2, mutatorName: 'TypeA' },
          { id: 3, mutatorName: 'TypeA' },
          { id: 4, mutatorName: 'TypeB' }
        ]
      });

      const problematic = result.getProblematicMutators(2);

      expect(problematic).toHaveLength(2);
      expect(problematic[0].mutator).toBe('TypeB'); // 100% survival
      expect(problematic[0].survivalRate).toBe(100);
      expect(problematic[1].mutator).toBe('TypeA'); // 66.67% survival
      expect(problematic[1].survivalRate).toBeCloseTo(66.67, 1);
    });

    test('should limit results based on limit parameter', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      result.setResults({
        survivedMutants: [
          { id: 1, mutatorName: 'Type1' },
          { id: 2, mutatorName: 'Type2' },
          { id: 3, mutatorName: 'Type3' },
          { id: 4, mutatorName: 'Type4' }
        ]
      });

      const problematic = result.getProblematicMutators(2);

      expect(problematic).toHaveLength(2);
    });

    test('should return empty array when no mutants exist', () => {
      const result = new MutationResult(sourceFile, testFile);

      const problematic = result.getProblematicMutators();

      expect(problematic).toEqual([]);
    });
  });

  describe('getCoverageGaps', () => {
    test('should identify coverage gaps from survived mutants', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      result.setResults({
        survivedMutants: [
          {
            id: 1,
            mutatorName: 'TypeA',
            location: { start: { line: 10, column: 5 }, end: { line: 10, column: 15 } }
          },
          {
            id: 2,
            mutatorName: 'TypeB',
            location: { start: { line: 10, column: 5 }, end: { line: 10, column: 15 } }
          },
          {
            id: 3,
            mutatorName: 'TypeC',
            location: { start: { line: 20, column: 3 }, end: { line: 20, column: 10 } }
          }
        ]
      });

      const gaps = result.getCoverageGaps();

      expect(gaps).toHaveLength(2);
      expect(gaps[0].line).toBe(10);
      expect(gaps[0].mutantCount).toBe(2);
      expect(gaps[0].severity).toBe('high');
      expect(gaps[1].line).toBe(20);
      expect(gaps[1].mutantCount).toBe(1);
      expect(gaps[1].severity).toBe('medium');
    });

    test('should sort gaps by mutant count', () => {
      const result = new MutationResult(sourceFile, testFile);
      
      result.setResults({
        survivedMutants: [
          { id: 1, mutatorName: 'T1', location: { start: { line: 10, column: 1 } } },
          { id: 2, mutatorName: 'T2', location: { start: { line: 20, column: 1 } } },
          { id: 3, mutatorName: 'T3', location: { start: { line: 20, column: 1 } } },
          { id: 4, mutatorName: 'T4', location: { start: { line: 20, column: 1 } } }
        ]
      });

      const gaps = result.getCoverageGaps();

      expect(gaps[0].mutantCount).toBeGreaterThan(gaps[1].mutantCount);
    });
  });

  describe('getImprovementSuggestions', () => {
    test('should suggest comprehensive tests for low scores', () => {
      const result = new MutationResult(sourceFile, testFile, 40);

      const suggestions = result.getImprovementSuggestions();

      expect(suggestions).toContain(
        'Consider adding more comprehensive test cases covering basic functionality'
      );
    });

    test('should suggest edge case testing for many survived mutants', () => {
      const result = new MutationResult(sourceFile, testFile, 60);
      
      const survivedMutants = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        mutatorName: 'Generic'
      }));
      result.setResults({ survivedMutants });

      const suggestions = result.getImprovementSuggestions();

      expect(suggestions).toContain(
        'Focus on testing edge cases and boundary conditions'
      );
    });

    test('should suggest arithmetic tests for arithmetic mutants', () => {
      const result = new MutationResult(sourceFile, testFile, 70);
      
      result.setResults({
        survivedMutants: [
          { id: 1, mutatorName: 'ArithmeticOperator' },
          { id: 2, mutatorName: 'ArithmeticOperator' }
        ]
      });

      const suggestions = result.getImprovementSuggestions();

      expect(suggestions).toContain(
        'Add tests for different arithmetic operations and edge values'
      );
    });

    test('should suggest conditional tests for conditional mutants', () => {
      const result = new MutationResult(sourceFile, testFile, 70);
      
      result.setResults({
        survivedMutants: [
          { id: 1, mutatorName: 'ConditionalExpression' }
        ]
      });

      const suggestions = result.getImprovementSuggestions();

      expect(suggestions).toContain(
        'Test boundary conditions and different comparison scenarios'
      );
    });

    test('should suggest coverage improvement for no-coverage mutants', () => {
      const result = new MutationResult(sourceFile, testFile, 80);
      
      result.setResults({
        noCoverageMutants: [{ id: 1 }, { id: 2 }]
      });

      const suggestions = result.getImprovementSuggestions();

      expect(suggestions).toContain(
        'Improve test coverage - some code paths are not being tested'
      );
    });
  });

  describe('compareWith', () => {
    test('should compare with previous result', () => {
      const previous = new MutationResult(sourceFile, testFile);
      previous.setResults({
        mutationScore: 70,
        killedMutants: [{ id: 1 }, { id: 2 }],
        survivedMutants: [{ id: 3 }]
      });

      const current = new MutationResult(sourceFile, testFile);
      current.setResults({
        mutationScore: 85,
        killedMutants: [{ id: 1 }, { id: 2 }, { id: 3 }],
        survivedMutants: []
      });

      const comparison = current.compareWith(previous);

      expect(comparison.scoreImprovement).toBe(15);
      expect(comparison.newlyKilledMutants).toBe(1);
      expect(comparison.newSurvivedMutants).toBe(-1);
      expect(comparison.isImprovement).toBe(true);
    });

    test('should detect score degradation', () => {
      const previous = new MutationResult(sourceFile, testFile);
      previous.setResults({ mutationScore: 80 });
      
      const current = new MutationResult(sourceFile, testFile);
      current.setResults({ mutationScore: 70 });

      const comparison = current.compareWith(previous);

      expect(comparison.scoreImprovement).toBe(-10);
      expect(comparison.isImprovement).toBe(false);
    });
  });

  describe('toJSON', () => {
    test('should convert to JSON representation', () => {
      const result = new MutationResult(sourceFile, testFile);
      result.setResults({
        mutationScore: 75,
        totalMutants: 20,
        killedMutants: [{ id: 1 }],
        survivedMutants: [{ id: 2, mutatorName: 'Test', location: { start: { line: 1, column: 1 } } }],
        timeoutMutants: [],
        noCoverageMutants: [],
        executionTime: 3000
      });

      const json = result.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('sourceFile');
      expect(json).toHaveProperty('testFile');
      expect(json).toHaveProperty('mutationScore', 75);
      expect(json).toHaveProperty('scoreCategory', 'fair');
      expect(json).toHaveProperty('totalMutants', 20);
      expect(json).toHaveProperty('killedCount', 1);
      expect(json).toHaveProperty('survivedCount', 1);
      expect(json).toHaveProperty('executionTime', 3000);
      expect(json).toHaveProperty('problematicMutators');
      expect(json).toHaveProperty('coverageGaps');
      expect(json).toHaveProperty('suggestions');
    });

    test('should be serializable to JSON string', () => {
      const result = new MutationResult(sourceFile, testFile, 80);

      expect(() => JSON.stringify(result.toJSON())).not.toThrow();
    });
  });

  describe('_generateId', () => {
    test('should generate unique IDs', () => {
      const result1 = new MutationResult(sourceFile, testFile);
      const result2 = new MutationResult(sourceFile, testFile);

      expect(result1.id).not.toBe(result2.id);
    });

    test('should generate IDs with correct prefix', () => {
      const result = new MutationResult(sourceFile, testFile);

      expect(result.id).toMatch(/^mut_\d+_[a-z0-9]+$/);
    });
  });
});
