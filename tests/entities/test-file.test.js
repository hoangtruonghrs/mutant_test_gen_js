/**
 * Unit tests for TestFile entity
 */

const TestFile = require('../../lib/core/entities/test-file');
const SourceFile = require('../../lib/core/entities/source-file');
const { sampleTestCode, sampleSourceCode } = require('../fixtures/sample-data');

describe('TestFile Entity', () => {
  describe('Constructor', () => {
    test('should create a TestFile with required properties', () => {
      const testFile = new TestFile('/path/to/test.test.js', sampleTestCode);

      expect(testFile.filePath).toBe('/path/to/test.test.js');
      expect(testFile.content).toBe(sampleTestCode);
      expect(testFile.sourceFile).toBeNull();
      expect(testFile.createdAt).toBeInstanceOf(Date);
      expect(testFile.lastModified).toBeNull();
      expect(testFile.version).toBe(1);
      expect(testFile.generationMetadata).toBeDefined();
    });

    test('should create a TestFile with source file reference', () => {
      const sourceFile = new SourceFile('/path/to/source.js', sampleSourceCode);
      const testFile = new TestFile('/path/to/test.test.js', sampleTestCode, sourceFile);

      expect(testFile.sourceFile).toBe(sourceFile);
    });

    test('should initialize generation metadata', () => {
      const testFile = new TestFile('/test.test.js', '');

      expect(testFile.generationMetadata.iterations).toBe(0);
      expect(testFile.generationMetadata.lastImprovement).toBeNull();
      expect(testFile.generationMetadata.improvementHistory).toEqual([]);
    });
  });

  describe('getFileName', () => {
    test('should extract file name from path', () => {
      const testFile = new TestFile('/path/to/my-test.test.js', sampleTestCode);

      expect(testFile.getFileName()).toBe('my-test.test.js');
    });

    test('should handle Windows paths', () => {
      const testFile = new TestFile('C:\\Users\\test\\file.test.js', sampleTestCode);

      expect(testFile.getFileName()).toBe('file.test.js');
    });
  });

  describe('getSourceFileName', () => {
    test('should get source file name from sourceFile reference', () => {
      const sourceFile = new SourceFile('/path/to/calculator.js', sampleSourceCode);
      const testFile = new TestFile('/path/to/calculator.test.js', sampleTestCode, sourceFile);

      expect(testFile.getSourceFileName()).toBe('calculator.js');
    });

    test('should derive source file name from test file name', () => {
      const testFile = new TestFile('/path/to/utils.test.js', sampleTestCode);

      expect(testFile.getSourceFileName()).toBe('utils.js');
    });

    test('should handle file names without .test.js', () => {
      const testFile = new TestFile('/path/to/myfile.js', sampleTestCode);

      // If no .test.js pattern, returns original filename
      expect(testFile.getSourceFileName()).toBe('myfile.js');
    });
  });

  describe('updateContent', () => {
    test('should update content and increment version', () => {
      const testFile = new TestFile('/test.test.js', 'old content');
      const oldVersion = testFile.version;

      testFile.updateContent('new content', 'improvement');

      expect(testFile.content).toBe('new content');
      expect(testFile.version).toBe(oldVersion + 1);
      expect(testFile.lastModified).toBeInstanceOf(Date);
    });

    test('should record improvement history', () => {
      const testFile = new TestFile('/test.test.js', 'initial');

      testFile.updateContent('improved', 'mutation-feedback');

      expect(testFile.generationMetadata.improvementHistory).toHaveLength(1);
      expect(testFile.generationMetadata.improvementHistory[0]).toMatchObject({
        version: 2,
        reason: 'mutation-feedback',
        contentLength: 'improved'.length
      });
    });

    test('should track multiple updates', () => {
      const testFile = new TestFile('/test.test.js', 'v1');

      testFile.updateContent('v2', 'first improvement');
      testFile.updateContent('v3', 'second improvement');

      expect(testFile.version).toBe(3);
      expect(testFile.generationMetadata.improvementHistory).toHaveLength(2);
    });
  });

  describe('recordImprovement', () => {
    test('should increment iteration count', () => {
      const testFile = new TestFile('/test.test.js', sampleTestCode);
      const results = {
        mutationScore: 75,
        survivedMutants: [{ id: 1 }],
        killedMutants: [{ id: 2 }, { id: 3 }]
      };

      testFile.recordImprovement(results);

      expect(testFile.generationMetadata.iterations).toBe(1);
    });

    test('should record improvement metadata', () => {
      const testFile = new TestFile('/test.test.js', sampleTestCode);
      const results = {
        mutationScore: 80.5,
        survivedMutants: [{ id: 1 }],
        killedMutants: [{ id: 2 }, { id: 3 }, { id: 4 }]
      };

      testFile.recordImprovement(results);

      expect(testFile.generationMetadata.lastImprovement).toMatchObject({
        mutationScore: 80.5,
        survivedMutants: 1,
        killedMutants: 3
      });
      expect(testFile.generationMetadata.lastImprovement.timestamp).toBeInstanceOf(Date);
    });

    test('should handle missing mutants arrays', () => {
      const testFile = new TestFile('/test.test.js', sampleTestCode);
      const results = { mutationScore: 90 };

      testFile.recordImprovement(results);

      expect(testFile.generationMetadata.lastImprovement.survivedMutants).toBe(0);
      expect(testFile.generationMetadata.lastImprovement.killedMutants).toBe(0);
    });
  });

  describe('extractTestCases', () => {
    test('should extract test cases using "test" syntax', () => {
      const content = `
        test('should add numbers', () => {});
        test('should subtract numbers', () => {});
      `;
      const testFile = new TestFile('/test.test.js', content);
      const testCases = testFile.extractTestCases();

      expect(testCases).toHaveLength(2);
      expect(testCases[0].name).toBe('should add numbers');
      expect(testCases[1].name).toBe('should subtract numbers');
    });

    test('should extract test cases using "it" syntax', () => {
      const content = `
        it('adds two numbers', () => {});
        it('subtracts two numbers', () => {});
      `;
      const testFile = new TestFile('/test.test.js', content);
      const testCases = testFile.extractTestCases();

      expect(testCases).toHaveLength(2);
      expect(testCases[0].name).toBe('adds two numbers');
      expect(testCases[1].name).toBe('subtracts two numbers');
    });

    test('should handle mixed "test" and "it" syntax', () => {
      const content = `
        test('test case 1', () => {});
        it('test case 2', () => {});
      `;
      const testFile = new TestFile('/test.test.js', content);
      const testCases = testFile.extractTestCases();

      expect(testCases).toHaveLength(2);
    });

    test('should track line numbers', () => {
      const content = `
        describe('Suite', () => {
          test('first test', () => {});
          test('second test', () => {});
        });
      `;
      const testFile = new TestFile('/test.test.js', content);
      const testCases = testFile.extractTestCases();

      expect(testCases[0].line).toBeGreaterThan(0);
      expect(testCases[1].line).toBeGreaterThan(testCases[0].line);
    });

    test('should return empty array for no tests', () => {
      const content = 'const x = 5;';
      const testFile = new TestFile('/test.test.js', content);
      const testCases = testFile.extractTestCases();

      expect(testCases).toEqual([]);
    });
  });

  describe('extractDescribeBlocks', () => {
    test('should extract describe blocks', () => {
      const content = `
        describe('Calculator', () => {
          describe('addition', () => {});
        });
      `;
      const testFile = new TestFile('/test.test.js', content);
      const describes = testFile.extractDescribeBlocks();

      expect(describes).toHaveLength(2);
      expect(describes[0].name).toBe('Calculator');
      expect(describes[1].name).toBe('addition');
    });

    test('should handle nested describe blocks', () => {
      const content = `
        describe('Outer', () => {
          describe('Middle', () => {
            describe('Inner', () => {});
          });
        });
      `;
      const testFile = new TestFile('/test.test.js', content);
      const describes = testFile.extractDescribeBlocks();

      expect(describes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('getStatistics', () => {
    test('should calculate test statistics', () => {
      const content = `
        describe('Suite', () => {
          test('test 1', () => {});
          test('test 2', () => {});
          test('test 3', () => {});
        });
      `;
      const testFile = new TestFile('/test.test.js', content);
      const stats = testFile.getStatistics();

      expect(stats.testCases).toBe(3);
      expect(stats.describeBlocks).toBe(1);
      expect(stats.version).toBe(1);
      expect(stats.lines).toBeGreaterThan(0);
    });
  });

  describe('toJSON', () => {
    test('should convert to JSON representation', () => {
      const testFile = new TestFile('/test.test.js', sampleTestCode);
      const json = testFile.toJSON();

      expect(json).toHaveProperty('filePath');
      expect(json).toHaveProperty('fileName');
      expect(json).toHaveProperty('sourceFile');
      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('lastModified');
      expect(json).toHaveProperty('generationMetadata');
      expect(json).toHaveProperty('statistics');
      expect(json).toHaveProperty('coverageAreas');
    });

    test('should be serializable to JSON string', () => {
      const testFile = new TestFile('/test.test.js', sampleTestCode);
      
      expect(() => JSON.stringify(testFile.toJSON())).not.toThrow();
    });
  });

  describe('validateSyntax', () => {
    test('should return true for valid test syntax', () => {
      const content = `
        describe('Suite', () => {
          test('test 1', () => {
            expect(true).toBe(true);
          });
        });
      `;
      const testFile = new TestFile('/test.test.js', content);

      expect(testFile.validateSyntax()).toBe(true);
    });

    test('should return false for invalid test syntax', () => {
      const content = 'const x = 5;';
      const testFile = new TestFile('/test.test.js', content);

      expect(testFile.validateSyntax()).toBe(false);
    });
  });

  describe('getCoverageAreas', () => {
    test('should identify coverage areas', () => {
      const content = `
        describe('Test', () => {
          test('basic', () => {
            expect(value).toBe(5);
          });
          test('errors', () => {
            expect(() => fn()).toThrow();
          });
        });
      `;
      const testFile = new TestFile('/test.test.js', content);
      const areas = testFile.getCoverageAreas();

      expect(areas).toContain('basic_assertions');
      expect(areas).toContain('error_handling');
    });
  });
});
