# Architecture

This document describes the Clean Architecture implementation of Mutant Test Gen JS.

## Overview

Mutant Test Gen JS follows **Clean Architecture** principles with **Domain-Driven Design** (DDD), implementing a feedback loop between LLM-based test generation and mutation testing to automatically create high-quality unit tests.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     CLI / Public API                          │
│                     (index.js, cli.js)                        │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   Application Layer                           │
│                   (lib/application.js)                        │
│  - Dependency injection                                       │
│  - Component orchestration                                    │
│  - Configuration management                                   │
└──────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Use Cases      │  │   Use Cases      │  │   Use Cases      │
│   GenerateTests  │  │   ImproveTests   │  │   BatchProcess   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     Services Layer                            │
│  ┌──────────────────┐  ┌───────────────────┐  ┌────────────┐│
│  │ Test Generation  │  │ Mutation Analysis │  │  Feedback  ││
│  │    Service       │  │     Service       │  │    Loop    ││
│  └──────────────────┘  └───────────────────┘  └────────────┘│
└──────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Domain Entities │  │  Domain Entities │  │  Domain Entities │
│   SourceFile     │  │    TestFile      │  │ MutationResult   │
│                  │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   Adapters       │  │   Adapters       │  │   Adapters       │
│   LLM Providers  │  │ Mutation Engine  │  │    Storage       │
│ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │   OpenAI     │ │  │ │   Stryker    │ │  │ │  FileSystem  │ │
│ │ Azure OpenAI │ │  │ └──────────────┘ │  │ └──────────────┘ │
│ └──────────────┘ │  └──────────────────┘  └──────────────────┘
└──────────────────┘
```

## Layers

### 1. Domain Layer (`lib/core/entities/`)

**Purpose**: Core business logic and domain models

**Components**:
- `SourceFile`: Represents source code files
  - Properties: fileName, content, path, metadata
  - Methods: analyze(), extractFunctions(), validate()

- `TestFile`: Represents test files
  - Properties: fileName, content, testCases, version
  - Methods: extractTestCases(), addTestCase(), merge()

- `MutationResult`: Encapsulates mutation testing results
  - Properties: mutationScore, mutants, survivedMutants
  - Methods: hasReachedTarget(), getSurvivedMutants(), toJSON()

- `GenerationSession`: Tracks test generation sessions
  - Properties: id, startTime, iterations, results
  - Methods: addIteration(), complete(), getMetrics()

**Principles**:
- Pure business logic, no external dependencies
- Rich domain models with behavior
- Framework-independent

### 2. Service Layer (`lib/core/services/`)

**Purpose**: Orchestrate business workflows using domain entities and adapters

**Components**:
- `TestGenerationService`: Coordinates LLM-based test generation
  - `generateInitialTests(sourceFile)`: Create first test suite
  - `improveTests(sourceFile, testFile, mutants)`: Enhance existing tests

- `MutationAnalysisService`: Processes mutation testing results
  - `runMutationAnalysis(sourceFile, testFile)`: Execute mutation testing
  - `analyzeTrends(results)`: Analyze mutation patterns
  - `getRecommendations(result)`: Generate improvement suggestions

- `FeedbackLoopService`: Orchestrates iterative improvement
  - `executeFeedbackLoop(sourceFile, config)`: Run complete feedback cycle
  - `analyzePerformance(results)`: Analyze feedback loop effectiveness
  - `getOptimizationSuggestions(results)`: Suggest configuration improvements

**Principles**:
- Coordinate between entities and adapters
- Implement business workflows
- No knowledge of external frameworks

### 3. Use Cases Layer (`lib/core/use-cases/`)

**Purpose**: Application-specific business logic

**Components**:
- `GenerateTestsUseCase`: Single file test generation workflow
  - Input: sourcePath, outputPath, configuration
  - Output: Generated test file with results

- `ImproveTestsUseCase`: Test improvement workflow
  - Input: sourcePath, testPath, outputPath
  - Output: Improved test file with comparison metrics

- `BatchProcessUseCase`: Bulk file processing
  - Input: sourcePattern, outputDir, configuration
  - Output: Batch processing results

**Principles**:
- One use case per user action
- Orchestrates services to fulfill requests
- Independent and testable

### 4. Adapter Layer (`lib/adapters/`)

**Purpose**: External service integrations following adapter pattern

**Components**:

#### LLM Adapters (`lib/adapters/llm/`)
- `LLMProvider` (interface): Contract for LLM providers
- `OpenAIAdapter`: OpenAI GPT integration
- `AzureOpenAIAdapter`: Azure OpenAI integration
- `LLMAdapterFactory`: Creates appropriate adapter

#### Mutation Engine Adapters (`lib/adapters/mutation/`)
- `MutationEngine` (interface): Contract for mutation testing
- `StrykerAdapter`: Stryker CLI integration

#### Storage Adapters (`lib/adapters/storage/`)
- `StorageProvider` (interface): Contract for file operations
- `FileSystemStorage`: Local filesystem operations

**Principles**:
- Implement interface contracts
- Hide external dependencies
- Easy to swap implementations

### 5. Application Layer (`lib/application.js`)

**Purpose**: Bootstrap application and manage dependencies

**Responsibilities**:
- Dependency injection
- Component initialization
- Configuration management
- High-level API

**Key Class**: `MutantTestGenApplication`
```javascript
class MutantTestGenApplication {
  constructor(config)
  async generateTests(options)
  async improveTests(options)
  async batchProcess(options)
  async executeFeedbackLoop(options)
  getStatus()
  async cleanup()
}
```

## Key Design Patterns

### 1. Adapter Pattern
**Purpose**: Abstract external dependencies
```javascript
// Interface
class LLMProvider {
  async generateTests(prompt) { throw new Error('Not implemented'); }
}

// Implementations
class OpenAIAdapter extends LLMProvider { ... }
class AzureOpenAIAdapter extends LLMProvider { ... }
```

### 2. Factory Pattern
**Purpose**: Create adapters based on configuration
```javascript
class LLMAdapterFactory {
  createAdapter(config) {
    switch(config.provider) {
      case 'openai': return new OpenAIAdapter(config);
      case 'azure': return new AzureOpenAIAdapter(config);
    }
  }
}
```

### 3. Dependency Injection
**Purpose**: Loose coupling between components
```javascript
class TestGenerationService {
  constructor(llmAdapterFactory, logger) {
    this.llmAdapterFactory = llmAdapterFactory;
    this.logger = logger;
  }
}
```

### 4. Repository Pattern
**Purpose**: Abstract data persistence
```javascript
class FileSystemStorage {
  async readFile(path) { ... }
  async saveFile(path, content) { ... }
}
```

## Data Flow

### Test Generation Flow

```
1. User Request (CLI/API)
          ↓
2. Application Layer
   - Parse configuration
   - Initialize components
          ↓
3. Use Case (GenerateTestsUseCase)
   - Validate input
   - Load source file
          ↓
4. Service (TestGenerationService)
   - Create prompt
   - Call LLM adapter
          ↓
5. Adapter (OpenAI/Azure)
   - Make API request
   - Parse response
          ↓
6. Domain Entity (TestFile)
   - Validate test code
   - Extract test cases
          ↓
7. Storage Adapter
   - Save test file
          ↓
8. Return Result to User
```

### Feedback Loop Flow

```
Source File
    ↓
Generate Initial Tests (LLM)
    ↓
Run Mutation Testing (Stryker)
    ↓
Create MutationResult Entity
    ↓
Check Score ≥ Target?
    ↓ No (and iterations < max)
Analyze Survived Mutants
    ↓
Generate Improvement Prompt
    ↓
Generate Improved Tests (LLM)
    ↓
Merge with Existing Tests
    ↓
Save Updated TestFile
    ↓
Loop back to Mutation Testing
```

## Configuration

### Hierarchical Configuration
1. **Default**: `config/default.config.js`
2. **User File**: Custom config file
3. **Environment**: Environment variables
4. **CLI Args**: Command-line overrides

### Configuration Structure
```javascript
{
  llm: {
    provider: 'openai' | 'azure',
    model: 'gpt-4',
    apiKey: string,
    azure: { ... }
  },
  mutation: {
    testRunner: 'jest',
    timeout: 60000,
    mutators: [...]
  },
  targetMutationScore: 80,
  maxIterations: 5,
  useFeedbackLoop: boolean,
  concurrency: 3,
  storage: { type, encoding },
  logging: { level, file, console }
}
```

## Extension Points

### Adding New LLM Provider
```javascript
// 1. Create adapter
class NewLLMAdapter extends LLMProvider {
  async generateTests(prompt) { ... }
  async improveTests(prompt) { ... }
}

// 2. Register in factory
class LLMAdapterFactory {
  createAdapter(config) {
    if (config.provider === 'newllm') {
      return new NewLLMAdapter(config);
    }
  }
}
```

### Adding New Mutation Engine
```javascript
// 1. Implement interface
class NewMutationEngine extends MutationEngine {
  async runMutationTesting(sourceFile, testFile) { ... }
}

// 2. Use in application
const app = new MutantTestGenApplication({
  mutationEngine: new NewMutationEngine()
});
```

### Adding New Storage Provider
```javascript
// 1. Implement interface
class S3Storage extends StorageProvider {
  async readFile(path) { ... }
  async saveFile(path, content) { ... }
}

// 2. Configure in app
const app = new MutantTestGenApplication({
  storage: { type: 's3', ... }
});
```

## Testing Strategy

### Unit Tests
- **Entities**: Test business logic independently
- **Services**: Mock adapters, test workflows
- **Adapters**: Mock external services
- **Use Cases**: Mock services, test orchestration

### Integration Tests
- Test with real LLM providers (expensive)
- Test with real mutation engine
- Test complete workflows

### Example:
```javascript
// Unit test
describe('TestGenerationService', () => {
  it('should generate tests', async () => {
    const mockLLM = { generateTests: jest.fn() };
    const service = new TestGenerationService(mockLLM);
    await service.generateInitialTests(sourceFile);
    expect(mockLLM.generateTests).toHaveBeenCalled();
  });
});
```

## Benefits of This Architecture

1. **Testability**: Easy to mock dependencies and test in isolation
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Easy to swap implementations
4. **Scalability**: Add new features without breaking existing code
5. **Independence**: Core logic doesn't depend on frameworks
6. **Reusability**: Components can be reused in different contexts

## Future Enhancements

1. **Multi-Language Support**: Python, TypeScript, Java
2. **Local LLMs**: Llama, Mistral integration
3. **Advanced Analytics**: ML-based mutation prediction
4. **Web Dashboard**: Real-time monitoring UI
5. **Distributed Processing**: Cloud-native scaling
6. **Plugin System**: User-defined extensions
