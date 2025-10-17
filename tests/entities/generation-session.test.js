/**
 * Unit tests for GenerationSession entity
 */

const GenerationSession = require('../../lib/core/entities/generation-session');
const SourceFile = require('../../lib/core/entities/source-file');
const { sampleSourceCode, sampleConfig } = require('../fixtures/sample-data');

describe('GenerationSession Entity', () => {
  describe('Constructor', () => {
    test('should create a GenerationSession with required properties', () => {
      const session = new GenerationSession(sampleConfig);

      expect(session.id).toBeDefined();
      expect(session.id).toMatch(/^session_/);
      expect(session.config).toBe(sampleConfig);
      expect(session.startTime).toBeInstanceOf(Date);
      expect(session.endTime).toBeNull();
      expect(session.status).toBe('started');
      expect(session.sourceFiles).toEqual([]);
      expect(session.results).toEqual([]);
      expect(session.totalIterations).toBe(0);
      expect(session.errors).toEqual([]);
    });

    test('should initialize metadata from config', () => {
      const customConfig = {
        llm: {
          provider: 'azure',
          model: 'gpt-4-turbo'
        },
        mutationTesting: {
          targetMutationScore: 85,
          maxIterations: 7
        }
      };
      const session = new GenerationSession(customConfig);

      expect(session.metadata.llmProvider).toBe('azure');
      expect(session.metadata.model).toBe('gpt-4-turbo');
      expect(session.metadata.targetScore).toBe(85);
      expect(session.metadata.maxIterations).toBe(7);
    });

    test('should handle empty config', () => {
      const session = new GenerationSession();

      expect(session.metadata.llmProvider).toBe('unknown');
      expect(session.metadata.model).toBe('unknown');
      expect(session.metadata.targetScore).toBe(80);
      expect(session.metadata.maxIterations).toBe(5);
    });
  });

  describe('addSourceFile', () => {
    test('should add source file to session', () => {
      const session = new GenerationSession();
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);

      session.addSourceFile(sourceFile);

      expect(session.sourceFiles).toHaveLength(1);
      expect(session.sourceFiles[0]).toBe(sourceFile);
    });

    test('should add multiple source files', () => {
      const session = new GenerationSession();
      const file1 = new SourceFile('/test1.js', sampleSourceCode);
      const file2 = new SourceFile('/test2.js', sampleSourceCode);

      session.addSourceFile(file1);
      session.addSourceFile(file2);

      expect(session.sourceFiles).toHaveLength(2);
    });
  });

  describe('addResult', () => {
    test('should add result to session', () => {
      const session = new GenerationSession();
      const result = {
        success: true,
        mutationScore: 85,
        iterations: 2
      };

      session.addResult(result);

      expect(session.results).toHaveLength(1);
      expect(session.results[0]).toBe(result);
      expect(session.totalIterations).toBe(2);
    });

    test('should accumulate iterations', () => {
      const session = new GenerationSession();

      session.addResult({ success: true, iterations: 2 });
      session.addResult({ success: true, iterations: 3 });

      expect(session.totalIterations).toBe(5);
    });

    test('should handle results without iterations', () => {
      const session = new GenerationSession();

      session.addResult({ success: true, mutationScore: 80 });

      expect(session.totalIterations).toBe(0);
    });
  });

  describe('addError', () => {
    test('should add error to session', () => {
      const session = new GenerationSession();
      const error = new Error('Test error');

      session.addError(error, 'test-context');

      expect(session.errors).toHaveLength(1);
      expect(session.errors[0].message).toBe('Test error');
      expect(session.errors[0].context).toBe('test-context');
      expect(session.errors[0].timestamp).toBeInstanceOf(Date);
      expect(session.errors[0].stack).toBeDefined();
    });

    test('should handle error without context', () => {
      const session = new GenerationSession();
      const error = new Error('Test error');

      session.addError(error);

      expect(session.errors[0].context).toBe('unknown');
    });
  });

  describe('complete', () => {
    test('should complete session with default status', () => {
      const session = new GenerationSession();

      session.complete();

      expect(session.status).toBe('completed');
      expect(session.endTime).toBeInstanceOf(Date);
    });

    test('should complete session with custom status', () => {
      const session = new GenerationSession();

      session.complete('failed');

      expect(session.status).toBe('failed');
      expect(session.endTime).toBeInstanceOf(Date);
    });

    test('should set endTime', () => {
      const session = new GenerationSession();

      expect(session.endTime).toBeNull();

      session.complete();

      expect(session.endTime).not.toBeNull();
      expect(session.endTime.getTime()).toBeGreaterThanOrEqual(session.startTime.getTime());
    });
  });

  describe('getDuration', () => {
    test('should calculate duration for completed session', async () => {
      const session = new GenerationSession();

      await new Promise(resolve => setTimeout(resolve, 10));
      session.complete();

      const duration = session.getDuration();

      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be less than 1 second
    });

    test('should calculate duration for ongoing session', async () => {
      const session = new GenerationSession();

      await new Promise(resolve => setTimeout(resolve, 10));

      const duration = session.getDuration();

      expect(duration).toBeGreaterThan(0);
    });
  });

  describe('getHumanDuration', () => {
    test('should format duration in seconds', () => {
      const session = new GenerationSession();
      session.startTime = new Date(Date.now() - 5000); // 5 seconds ago

      const humanDuration = session.getHumanDuration();

      expect(humanDuration).toMatch(/^\d+s$/);
    });

    test('should format duration in minutes and seconds', () => {
      const session = new GenerationSession();
      session.startTime = new Date(Date.now() - 125000); // 125 seconds ago

      const humanDuration = session.getHumanDuration();

      expect(humanDuration).toMatch(/^\d+m\s\d+s$/);
    });

    test('should format duration in hours, minutes and seconds', () => {
      const session = new GenerationSession();
      session.startTime = new Date(Date.now() - 3665000); // 1 hour, 1 minute, 5 seconds ago

      const humanDuration = session.getHumanDuration();

      expect(humanDuration).toMatch(/^\d+h\s\d+m\s\d+s$/);
    });
  });

  describe('getSuccessRate', () => {
    test('should calculate success rate', () => {
      const session = new GenerationSession();

      session.addResult({ success: true });
      session.addResult({ success: true });
      session.addResult({ success: false });

      expect(session.getSuccessRate()).toBeCloseTo(66.67, 1);
    });

    test('should return 0 for no results', () => {
      const session = new GenerationSession();

      expect(session.getSuccessRate()).toBe(0);
    });

    test('should return 100 for all successful', () => {
      const session = new GenerationSession();

      session.addResult({ success: true });
      session.addResult({ success: true });

      expect(session.getSuccessRate()).toBe(100);
    });
  });

  describe('getAverageMutationScore', () => {
    test('should calculate average mutation score', () => {
      const session = new GenerationSession();

      session.addResult({ success: true, mutationScore: 80 });
      session.addResult({ success: true, mutationScore: 90 });
      session.addResult({ success: true, mutationScore: 70 });

      expect(session.getAverageMutationScore()).toBe(80);
    });

    test('should ignore failed results', () => {
      const session = new GenerationSession();

      session.addResult({ success: true, mutationScore: 80 });
      session.addResult({ success: false, mutationScore: 20 });

      expect(session.getAverageMutationScore()).toBe(80);
    });

    test('should return 0 for no successful results', () => {
      const session = new GenerationSession();

      expect(session.getAverageMutationScore()).toBe(0);
    });
  });

  describe('getFilesReachedTarget', () => {
    test('should count files that reached target', () => {
      const session = new GenerationSession();

      session.addResult({ targetReached: true });
      session.addResult({ targetReached: true });
      session.addResult({ targetReached: false });

      expect(session.getFilesReachedTarget()).toBe(2);
    });

    test('should return 0 when no files reached target', () => {
      const session = new GenerationSession();

      session.addResult({ targetReached: false });

      expect(session.getFilesReachedTarget()).toBe(0);
    });
  });

  describe('getPerformanceMetrics', () => {
    test('should calculate performance metrics', () => {
      const session = new GenerationSession();
      session.startTime = new Date(Date.now() - 10000); // 10 seconds ago

      session.addResult({ success: true, iterations: 2 });
      session.addResult({ success: true, iterations: 3 });

      const metrics = session.getPerformanceMetrics();

      expect(metrics).toHaveProperty('totalDuration');
      expect(metrics).toHaveProperty('humanDuration');
      expect(metrics).toHaveProperty('avgTimePerFile');
      expect(metrics).toHaveProperty('avgIterationsPerFile');
      expect(metrics).toHaveProperty('totalIterations', 5);
      expect(metrics).toHaveProperty('filesPerHour');
      expect(metrics.avgIterationsPerFile).toBe(2.5);
    });

    test('should handle empty results', () => {
      const session = new GenerationSession();

      const metrics = session.getPerformanceMetrics();

      expect(metrics.avgTimePerFile).toBe(0);
      expect(metrics.avgIterationsPerFile).toBe(0);
    });
  });

  describe('getSummary', () => {
    test('should generate session summary', () => {
      const session = new GenerationSession();
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);

      session.addSourceFile(sourceFile);
      session.addResult({ success: true, mutationScore: 85, targetReached: true });
      session.complete();

      const summary = session.getSummary();

      expect(summary).toHaveProperty('id');
      expect(summary).toHaveProperty('status', 'completed');
      expect(summary).toHaveProperty('duration');
      expect(summary).toHaveProperty('totalFiles', 1);
      expect(summary).toHaveProperty('processedFiles', 1);
      expect(summary).toHaveProperty('successful', 1);
      expect(summary).toHaveProperty('failed', 0);
      expect(summary).toHaveProperty('targetReached', 1);
      expect(summary).toHaveProperty('successRate');
      expect(summary).toHaveProperty('averageMutationScore');
      expect(summary).toHaveProperty('totalIterations');
      expect(summary).toHaveProperty('errors', 0);
      expect(summary).toHaveProperty('performance');
    });
  });

  describe('getDetailedReport', () => {
    test('should generate detailed report', () => {
      const session = new GenerationSession(sampleConfig);
      const sourceFile = new SourceFile('/test.js', sampleSourceCode);

      session.addSourceFile(sourceFile);
      session.addResult({ success: true });

      const report = session.getDetailedReport();

      expect(report).toHaveProperty('session');
      expect(report).toHaveProperty('metadata');
      expect(report).toHaveProperty('sourceFiles');
      expect(report).toHaveProperty('results');
      expect(report).toHaveProperty('errors');
      expect(report).toHaveProperty('config');
    });
  });

  describe('export', () => {
    test('should export as JSON string by default', () => {
      const session = new GenerationSession();

      const exported = session.export();

      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    test('should export as summary object', () => {
      const session = new GenerationSession();

      const exported = session.export('summary');

      expect(typeof exported).toBe('object');
      expect(exported).toHaveProperty('id');
      expect(exported).toHaveProperty('status');
    });

    test('should export as detailed report', () => {
      const session = new GenerationSession();

      const exported = session.export('detailed');

      expect(typeof exported).toBe('object');
      expect(exported).toHaveProperty('session');
      expect(exported).toHaveProperty('metadata');
    });
  });

  describe('isComplete', () => {
    test('should return false for started session', () => {
      const session = new GenerationSession();

      expect(session.isComplete()).toBe(false);
    });

    test('should return true for completed session', () => {
      const session = new GenerationSession();
      session.complete();

      expect(session.isComplete()).toBe(true);
    });

    test('should return true for failed session', () => {
      const session = new GenerationSession();
      session.complete('failed');

      expect(session.isComplete()).toBe(true);
    });

    test('should return true for cancelled session', () => {
      const session = new GenerationSession();
      session.complete('cancelled');

      expect(session.isComplete()).toBe(true);
    });
  });

  describe('isSuccessful', () => {
    test('should return true for completed session with successes', () => {
      const session = new GenerationSession();
      session.addResult({ success: true });
      session.complete();

      expect(session.isSuccessful()).toBe(true);
    });

    test('should return false for completed session with no successes', () => {
      const session = new GenerationSession();
      session.addResult({ success: false });
      session.complete();

      expect(session.isSuccessful()).toBe(false);
    });

    test('should return false for failed session', () => {
      const session = new GenerationSession();
      session.addResult({ success: true });
      session.complete('failed');

      expect(session.isSuccessful()).toBe(false);
    });

    test('should return false for incomplete session', () => {
      const session = new GenerationSession();
      session.addResult({ success: true });

      expect(session.isSuccessful()).toBe(false);
    });
  });

  describe('toJSON', () => {
    test('should convert to JSON representation', () => {
      const session = new GenerationSession();
      const json = session.toJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('status');
      expect(json).toHaveProperty('duration');
    });

    test('should be serializable to JSON string', () => {
      const session = new GenerationSession();

      expect(() => JSON.stringify(session.toJSON())).not.toThrow();
    });
  });

  describe('_generateId', () => {
    test('should generate unique IDs', () => {
      const session1 = new GenerationSession();
      const session2 = new GenerationSession();

      expect(session1.id).not.toBe(session2.id);
    });

    test('should generate IDs with correct prefix', () => {
      const session = new GenerationSession();

      expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });
});
