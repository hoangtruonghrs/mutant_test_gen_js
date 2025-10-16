# Architecture

This document describes the architecture of the Mutant Test Gen JS system.

## Overview

The system implements a feedback loop between LLM-based test generation and mutation testing to automatically create high-quality unit tests.

```
┌─────────────────────────────────────────────────────────────┐
│                    Mutant Test Gen JS                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
           ┌──────────────────────────────────────┐
           │     Main Orchestrator (index.js)     │
           │  - File resolution                    │
           │  - Workflow coordination              │
           │  - Report generation                  │
           └──────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │      Test Generator (test-generator.js)     │
        │  - Feedback loop management                 │
        │  - Test file I/O                            │
        │  - Test merging                             │
        └─────────────────────────────────────────────┘
                    │                    │
         ┌──────────┴──────────┐        │
         ▼                     ▼         ▼
┌─────────────────┐   ┌──────────────────────────┐
│  LLM Client     │   │  Mutation Engine         │
│  (OpenAI)       │   │  (Stryker)               │
│                 │   │                          │
│ - GPT-4/3.5     │   │ - Mutation generation    │
│ - Prompt mgmt   │   │ - Test execution         │
│ - Test gen      │   │ - Score calculation      │
│ - Test improve  │   │ - Mutant tracking        │
└─────────────────┘   └──────────────────────────┘
```

## Components

### 1. Main Orchestrator (`src/index.js`)

**Purpose**: Entry point and coordinator for the entire system.

**Responsibilities**:
- Resolve file paths from glob patterns
- Initialize all components
- Coordinate test generation workflow
- Generate summary reports

**Key Methods**:
- `run(files)`: Main entry point for test generation
- `_resolveFiles(patterns)`: Convert patterns to file paths
- `_generateSummary(results)`: Create summary statistics

### 2. Test Generator (`src/core/test-generator.js`)

**Purpose**: Manages the feedback loop between test generation and mutation testing.

**Responsibilities**:
- Coordinate LLM and mutation engine
- Implement feedback loop logic
- Manage test file I/O
- Merge improved tests with existing ones

**Key Methods**:
- `generateTestsWithFeedback(sourceFile)`: Main feedback loop
- `generateTestsForMultipleFiles(sourceFiles)`: Batch processing
- `_mergeTests(existing, improved)`: Intelligent test merging

**Feedback Loop**:
```
1. Generate initial tests (LLM)
2. Run mutation testing
3. Check mutation score
4. If score < target and iterations < max:
   a. Analyze survived mutants
   b. Generate improved tests (LLM)
   c. Merge with existing tests
   d. Go to step 2
5. Done
```

### 3. LLM Client (`src/llm/openai-client.js`)

**Purpose**: Interface with OpenAI's API for test generation.

**Responsibilities**:
- Manage OpenAI API communication
- Build effective prompts
- Extract code from responses
- Handle API errors and retries

**Key Methods**:
- `generateTests(sourceCode, fileName, context)`: Initial test generation
- `improveTests(sourceCode, existingTests, survivedMutants)`: Improvement based on feedback
- `_buildPrompt()`: Construct prompts for initial generation
- `_buildImprovementPrompt()`: Construct prompts for improvement

## Data Flow

### Feedback Loop Flow

```
Test File
    ↓
Run Mutation Testing (Stryker)
    ↓
Mutation Results
    ↓
Calculate Score
    ↓
Score ≥ Target? ──Yes──→ Done
    ↓
   No
    ↓
Extract Survived Mutants
    ↓
LLM Client (improveTests)
    ↓
Improved Test Code
    ↓
Merge with Existing Tests
    ↓
Update Test File
    ↓
(Loop back to Run Mutation Testing)
```

## Key Design Decisions

### 1. Stryker CLI vs API
We use Stryker's CLI instead of programmatic API because:
- ESM compatibility issues with newer Stryker versions
- CLI is more stable and well-documented
- Easier to debug and configure

### 2. Configuration Management
Hierarchical configuration:
1. Default config (config/default.config.js)
2. User config file (--config flag)
3. CLI arguments (highest priority)

### 3. Error Handling
Graceful degradation:
- Continue processing other files if one fails
- Log errors but don't stop execution
- Provide partial results when possible

## Future Enhancements

1. **Python Support**: Extend to Python with pytest
2. **Local LLMs**: Support local models (Llama, Mistral)
3. **Web UI**: Dashboard for monitoring and configuration
4. **AST-based Merging**: Smarter test deduplication
5. **Parallel Processing**: Process multiple files concurrently
