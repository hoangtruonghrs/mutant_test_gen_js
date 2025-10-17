/**
 * Main entry point for Mutant Test Gen JS
 * Clean Architecture implementation
 */

// Main application
const { createApplication, MutantTestGenApplication } = require('./lib/application');

// Core entities
const SourceFile = require('./lib/core/entities/source-file');
const TestFile = require('./lib/core/entities/test-file');
const MutationResult = require('./lib/core/entities/mutation-result');
const GenerationSession = require('./lib/core/entities/generation-session');

// Use cases
const { 
  GenerateTestsUseCase, 
  ImproveTestsUseCase, 
  BatchProcessUseCase 
} = require('./lib/core/use-cases');

// Services
const TestGenerationService = require('./lib/core/services/test-generation-service');
const MutationAnalysisService = require('./lib/core/services/mutation-analysis-service');
const FeedbackLoopService = require('./lib/core/services/feedback-loop-service');

// Adapters
const LLMAdapterFactory = require('./lib/adapters/llm/llm-adapter-factory');
const OpenAIAdapter = require('./lib/adapters/llm/openai-adapter');
const AzureOpenAIAdapter = require('./lib/adapters/llm/azure-adapter');
const StrykerAdapter = require('./lib/adapters/mutation/stryker-adapter');
const FileSystemStorage = require('./lib/adapters/storage/fs-storage');

module.exports = {
  // Main application factory
  createApplication,
  MutantTestGenApplication,

  // Core entities
  SourceFile,
  TestFile,
  MutationResult,
  GenerationSession,

  // Use cases
  GenerateTestsUseCase,
  ImproveTestsUseCase,
  BatchProcessUseCase,

  // Services
  TestGenerationService,
  MutationAnalysisService,
  FeedbackLoopService,

  // Adapters
  LLMAdapterFactory,
  OpenAIAdapter,
  AzureOpenAIAdapter,
  StrykerAdapter,
  FileSystemStorage
};