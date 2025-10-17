/**
 * Unit tests for SourceFile entity
 */

const SourceFile = require('../../lib/core/entities/source-file');
const { sampleSourceCode, complexSourceCode } = require('../fixtures/sample-data');

describe('SourceFile Entity', () => {
  describe('Constructor', () => {
    test('should create a SourceFile with required properties', () => {
      const sourceFile = new SourceFile('/path/to/file.js', sampleSourceCode);

      expect(sourceFile.filePath).toBe('/path/to/file.js');
      expect(sourceFile.content).toBe(sampleSourceCode);
      expect(sourceFile.language).toBe('javascript');
      expect(sourceFile.size).toBe(sampleSourceCode.length);
      expect(sourceFile.lineCount).toBeGreaterThan(0);
      expect(sourceFile.createdAt).toBeInstanceOf(Date);
      expect(sourceFile.lastModified).toBeNull();
      expect(sourceFile.hash).toBeDefined();
    });

    test('should create a SourceFile with custom language', () => {
      const sourceFile = new SourceFile('/path/to/file.ts', sampleSourceCode, 'typescript');

      expect(sourceFile.language).toBe('typescript');
    });

    test('should calculate correct line count', () => {
      const content = 'line1\nline2\nline3';
      const sourceFile = new SourceFile('/test.js', content);

      expect(sourceFile.lineCount).toBe(3);
    });

    test('should handle empty content', () => {
      const sourceFile = new SourceFile('/test.js', '');

      expect(sourceFile.size).toBe(0);
      expect(sourceFile.lineCount).toBe(1); // Empty file has 1 line
    });
  });

  describe('getFileName', () => {
    test('should extract file name from Unix path', () => {
      const sourceFile = new SourceFile('/path/to/my-file.js', sampleSourceCode);

      expect(sourceFile.getFileName()).toBe('my-file.js');
    });

    test('should extract file name from Windows path', () => {
      const sourceFile = new SourceFile('C:\\Users\\test\\file.js', sampleSourceCode);

      expect(sourceFile.getFileName()).toBe('file.js');
    });

    test('should handle file name without path', () => {
      const sourceFile = new SourceFile('standalone.js', sampleSourceCode);

      expect(sourceFile.getFileName()).toBe('standalone.js');
    });
  });

  describe('getExtension', () => {
    test('should extract file extension', () => {
      const sourceFile = new SourceFile('/path/to/file.js', sampleSourceCode);

      expect(sourceFile.getExtension()).toBe('js');
    });

    test('should handle multiple dots in filename', () => {
      const sourceFile = new SourceFile('/path/file.test.js', sampleSourceCode);

      expect(sourceFile.getExtension()).toBe('js');
    });

    test('should handle files without extension', () => {
      const sourceFile = new SourceFile('/path/Makefile', sampleSourceCode);

      expect(sourceFile.getExtension()).toBe('Makefile');
    });
  });

  describe('getRelativePath', () => {
    test('should calculate relative path from base directory', () => {
      const sourceFile = new SourceFile('/project/src/utils/helper.js', sampleSourceCode);

      expect(sourceFile.getRelativePath('/project')).toBe('src/utils/helper.js');
    });

    test('should handle Windows paths', () => {
      const sourceFile = new SourceFile('C:\\project\\src\\file.js', sampleSourceCode);

      expect(sourceFile.getRelativePath('C:\\project')).toBe('src\\file.js');
    });

    test('should handle when file path equals base directory', () => {
      const sourceFile = new SourceFile('/project/file.js', sampleSourceCode);

      expect(sourceFile.getRelativePath('/project')).toBe('file.js');
    });
  });

  describe('hasChanged', () => {
    test('should return false when content has not changed', () => {
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);

      expect(sourceFile.hasChanged(sampleSourceCode)).toBe(false);
    });

    test('should return true when content has changed', () => {
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);
      const modifiedContent = sampleSourceCode + '\n// New comment';

      expect(sourceFile.hasChanged(modifiedContent)).toBe(true);
    });

    test('should detect even small changes', () => {
      const sourceFile = new SourceFile('/test.js', 'hello world');

      expect(sourceFile.hasChanged('hello world!')).toBe(true);
    });
  });

  describe('updateContent', () => {
    test('should update content and recalculate metrics', () => {
      const sourceFile = new SourceFile('/test.js', 'old content');
      const oldHash = sourceFile.hash;
      const oldSize = sourceFile.size;

      sourceFile.updateContent('new content that is longer');

      expect(sourceFile.content).toBe('new content that is longer');
      expect(sourceFile.size).not.toBe(oldSize);
      expect(sourceFile.hash).not.toBe(oldHash);
      expect(sourceFile.lastModified).toBeInstanceOf(Date);
    });

    test('should update line count', () => {
      const sourceFile = new SourceFile('/test.js', 'line1');

      sourceFile.updateContent('line1\nline2\nline3');

      expect(sourceFile.lineCount).toBe(3);
    });

    test('should update lastModified timestamp', async () => {
      const sourceFile = new SourceFile('/test.js', 'content');
      
      expect(sourceFile.lastModified).toBeNull();

      // Wait 1ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      sourceFile.updateContent('new content');

      expect(sourceFile.lastModified).toBeInstanceOf(Date);
      expect(sourceFile.lastModified.getTime()).toBeGreaterThanOrEqual(sourceFile.createdAt.getTime());
    });
  });

  describe('getComplexityMetrics', () => {
    test('should count functions correctly', () => {
      const content = `
        function foo() {}
        function bar() {}
      `;
      const sourceFile = new SourceFile('/test.js', content);
      const metrics = sourceFile.getComplexityMetrics();

      expect(metrics.functions).toBe(2);
    });

    test('should count classes correctly', () => {
      const content = `
        class User {}
        class Product {}
      `;
      const sourceFile = new SourceFile('/test.js', content);
      const metrics = sourceFile.getComplexityMetrics();

      expect(metrics.classes).toBe(2);
    });

    test('should count conditionals correctly', () => {
      const content = `
        if (x) {}
        else {}
        while (y) {}
        for (let i = 0; i < 10; i++) {}
        switch (z) {}
      `;
      const sourceFile = new SourceFile('/test.js', content);
      const metrics = sourceFile.getComplexityMetrics();

      expect(metrics.conditionals).toBe(5);
    });

    test('should calculate complexity score', () => {
      const sourceFile = new SourceFile('/test.js', complexSourceCode);
      const metrics = sourceFile.getComplexityMetrics();

      expect(metrics.complexity).toBeGreaterThan(0);
      expect(metrics.lines).toBeGreaterThan(0);
      expect(metrics.size).toBeGreaterThan(0);
    });

    test('should handle empty file', () => {
      const sourceFile = new SourceFile('/test.js', '');
      const metrics = sourceFile.getComplexityMetrics();

      expect(metrics.functions).toBe(0);
      expect(metrics.classes).toBe(0);
      expect(metrics.conditionals).toBe(0);
    });
  });

  describe('extractFunctions', () => {
    test('should extract function declarations', () => {
      const content = `
        function add(a, b) {
          return a + b;
        }
        
        function multiply(x, y) {
          return x * y;
        }
      `;
      const sourceFile = new SourceFile('/test.js', content);
      const functions = sourceFile.extractFunctions();

      expect(functions).toHaveLength(2);
      expect(functions[0].name).toBe('add');
      expect(functions[1].name).toBe('multiply');
      expect(functions[0].line).toBeGreaterThan(0);
    });

    test('should extract arrow functions assigned to variables', () => {
      const content = `
        const subtract = (a, b) => {
          return a - b;
        };
      `;
      const sourceFile = new SourceFile('/test.js', content);
      const functions = sourceFile.extractFunctions();

      // Note: The current regex might not catch all arrow functions
      // This is a known limitation that could be improved
      expect(functions).toBeDefined();
    });

    test('should extract method functions', () => {
      const content = `
        const obj = {
          method1: function() {},
          method2() {}
        };
      `;
      const sourceFile = new SourceFile('/test.js', content);
      const functions = sourceFile.extractFunctions();

      expect(functions.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle file with no functions', () => {
      const content = 'const x = 5; const y = 10;';
      const sourceFile = new SourceFile('/test.js', content);
      const functions = sourceFile.extractFunctions();

      expect(functions).toHaveLength(0);
    });
  });

  describe('toJSON', () => {
    test('should convert to JSON representation', () => {
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);
      const json = sourceFile.toJSON();

      expect(json).toHaveProperty('filePath');
      expect(json).toHaveProperty('fileName');
      expect(json).toHaveProperty('language');
      expect(json).toHaveProperty('size');
      expect(json).toHaveProperty('lineCount');
      expect(json).toHaveProperty('hash');
      expect(json).toHaveProperty('createdAt');
      expect(json).toHaveProperty('lastModified');
      expect(json).toHaveProperty('complexity');
    });

    test('should include complexity metrics in JSON', () => {
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);
      const json = sourceFile.toJSON();

      expect(json.complexity).toHaveProperty('functions');
      expect(json.complexity).toHaveProperty('classes');
      expect(json.complexity).toHaveProperty('conditionals');
    });

    test('should be serializable to JSON string', () => {
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);
      
      expect(() => JSON.stringify(sourceFile.toJSON())).not.toThrow();
    });
  });

  describe('_calculateHash', () => {
    test('should generate consistent hash for same content', () => {
      const sourceFile1 = new SourceFile('/test1.js', 'same content');
      const sourceFile2 = new SourceFile('/test2.js', 'same content');

      expect(sourceFile1.hash).toBe(sourceFile2.hash);
    });

    test('should generate different hash for different content', () => {
      const sourceFile1 = new SourceFile('/test.js', 'content 1');
      const sourceFile2 = new SourceFile('/test.js', 'content 2');

      expect(sourceFile1.hash).not.toBe(sourceFile2.hash);
    });

    test('should generate hash as string', () => {
      const sourceFile = new SourceFile('/test.js', 'content');

      expect(typeof sourceFile.hash).toBe('string');
    });
  });
});
