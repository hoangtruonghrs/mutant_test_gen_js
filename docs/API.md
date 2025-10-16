# API Documentation

## Main API

### MutantTestGenJS

The main class that orchestrates test generation with mutation testing feedback.

#### Constructor

```javascript
const MutantTestGenJS = require('./src/index');
const config = require('./config/default.config');

const mutantTestGen = new MutantTestGenJS(config);
```

**Parameters:**
- `config` (Object): Configuration object with settings for LLM, mutation testing, etc.

#### Methods

##### `run(files)`

Run the test generation system on specified files.

```javascript
const result = await mutantTestGen.run(['src/calculator.js']);
```

**Parameters:**
- `files` (string | Array<string>): File path(s) or glob pattern(s)

**Returns:** `Promise<Object>`
```javascript
{
  success: true,
  summary: {
    totalFiles: 1,
    successful: 1,
    failed: 0,
    targetReached: 1,
    averageMutationScore: '85.40',
    totalIterations: 3,
    timestamp: '2024-01-01T00:00:00.000Z'
  },
  results: [
    {
      sourceFile: '/path/to/calculator.js',
      success: true,
      testFilePath: '/path/to/tests/calculator.test.js',
      testCode: '...',
      iterations: 3,
      mutationScore: 85.40,
      results: { /* mutation results */ },
      targetReached: true
    }
  ]
}
```

## Test Generator

### TestGenerator

Manages the feedback loop between test generation and mutation testing.

#### Constructor

```javascript
const TestGenerator = require('./src/core/test-generator');

const testGen = new TestGenerator(llmClient, mutationEngine, config, logger);
```

**Parameters:**
- `llmClient`: Instance of LLM client (e.g., OpenAIClient)
- `mutationEngine`: Instance of MutationEngine
- `config`: Configuration object
- `logger`: Logger instance

#### Methods

##### `generateTestsWithFeedback(sourceFilePath)`

Generate tests for a file with iterative improvement.

```javascript
const result = await testGen.generateTestsWithFeedback('src/calculator.js');
```

**Returns:** `Promise<Object>`
```javascript
{
  testFilePath: '/path/to/tests/calculator.test.js',
  testCode: '...',
  iterations: 3,
  mutationScore: 85.40,
  results: { /* mutation results */ },
  targetReached: true
}
```

##### `generateTestsForMultipleFiles(sourceFiles)`

Generate tests for multiple files.

```javascript
const results = await testGen.generateTestsForMultipleFiles([
  'src/calculator.js',
  'src/string-utils.js'
]);
```

**Returns:** `Promise<Array<Object>>`

## LLM Client

### OpenAIClient

Interface with OpenAI's API for test generation.

#### Constructor

```javascript
const OpenAIClient = require('./src/llm/openai-client');

const client = new OpenAIClient(config.llm, logger);
```

**Parameters:**
- `config`: LLM configuration (model, API key, etc.)
- `logger`: Logger instance

#### Methods

##### `generateTests(sourceCode, fileName, context)`

Generate initial tests for source code.

```javascript
const tests = await client.generateTests(sourceCode, 'calculator.js', {
  existingTests: '...' // optional
});
```

**Parameters:**
- `sourceCode` (string): Source code to generate tests for
- `fileName` (string): Name of the source file
- `context` (Object): Additional context (optional)
  - `existingTests` (string): Existing test code

**Returns:** `Promise<string>` - Generated test code

##### `improveTests(sourceCode, existingTests, survivedMutants)`

Generate improved tests based on mutation feedback.

```javascript
const improvedTests = await client.improveTests(
  sourceCode,
  existingTests,
  survivedMutants
);
```

**Parameters:**
- `sourceCode` (string): Source code
- `existingTests` (string): Current test code
- `survivedMutants` (Array): List of mutants that survived

**Returns:** `Promise<string>` - Improved test code

## Mutation Engine

### MutationEngine

Execute mutation testing using Stryker.

#### Constructor

```javascript
const MutationEngine = require('./src/core/mutation-engine');

const engine = new MutationEngine(config.mutationTesting, logger);
```

#### Methods

##### `runMutationTests(sourceFile, testFile)`

Run mutation testing on files.

```javascript
const results = await engine.runMutationTests(
  'src/calculator.js',
  'tests/calculator.test.js'
);
```

**Returns:** `Promise<Object>`
```javascript
{
  mutationScore: 85.40,
  survivedMutants: [
    {
      fileName: 'calculator.js',
      mutatorName: 'ArithmeticOperator',
      replacement: '-',
      location: { start: { line: 10, column: 5 }, end: { ... } },
      status: 'Survived'
    }
  ],
  killedMutants: [ /* ... */ ],
  totalMutants: 40,
  rawResults: { /* Stryker results */ }
}
```

##### `generateReport(results, outputPath)`

Generate mutation testing report.

```javascript
await engine.generateReport(results, 'reports/calculator-report.json');
```

## Logger

### Logger

Centralized logging utility.

#### Constructor

```javascript
const Logger = require('./src/utils/logger');

const logger = new Logger({
  level: 'info',
  file: 'logs/app.log',
  console: true
});
```

#### Methods

##### `info(message, meta)`

Log informational message.

```javascript
logger.info('Test generation started', { fileName: 'calculator.js' });
```

##### `error(message, meta)`

Log error message.

```javascript
logger.error('API request failed', { error: error.message });
```

##### `warn(message, meta)`

Log warning message.

```javascript
logger.warn('Low mutation score', { score: 45 });
```

##### `debug(message, meta)`

Log debug message.

```javascript
logger.debug('Processing mutant', { mutant: mutantData });
```

## Configuration

### Configuration Object Structure

```javascript
{
  // LLM Configuration
  llm: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    apiKey: process.env.OPENAI_API_KEY
  },

  // Mutation Testing Configuration
  mutationTesting: {
    framework: 'stryker',
    targetMutationScore: 80,
    maxIterations: 5,
    mutators: ['ArithmeticOperator', 'LogicalOperator', ...]
  },

  // Test Generation Configuration
  testGeneration: {
    framework: 'jest',
    testFilePattern: '**/*.test.js',
    sourceFilePattern: 'src/**/*.js',
    outputDir: 'tests',
    batchSize: 3
  },

  // Logging Configuration
  logging: {
    level: 'info',
    file: 'logs/mutation-testing.log',
    console: true
  },

  // Paths
  paths: {
    source: 'src',
    tests: 'tests',
    reports: 'reports'
  }
}
```

## CLI Commands

### generate

Generate tests for source files.

```bash
node cli.js generate <files...> [options]
```

**Arguments:**
- `files...`: Source file(s) or glob pattern(s)

**Options:**
- `-c, --config <path>`: Path to configuration file
- `-t, --target <score>`: Target mutation score (0-100)
- `-i, --iterations <count>`: Maximum feedback iterations
- `-m, --model <name>`: LLM model to use

**Examples:**
```bash
node cli.js generate src/calculator.js
node cli.js generate src/*.js --target 90
node cli.js generate "src/**/*.js" --config custom.config.js
```

### init

Initialize a configuration file.

```bash
node cli.js init [options]
```

**Options:**
- `-o, --output <path>`: Output path for config file

**Example:**
```bash
node cli.js init --output my-config.js
```

## Types

### MutationResult

```typescript
interface MutationResult {
  mutationScore: number;
  survivedMutants: Mutant[];
  killedMutants: Mutant[];
  totalMutants: number;
  rawResults: any;
}
```

### Mutant

```typescript
interface Mutant {
  fileName: string;
  mutatorName: string;
  replacement: string;
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
  status: 'Survived' | 'Killed' | 'Timeout' | 'NoCoverage';
}
```

### GenerationResult

```typescript
interface GenerationResult {
  sourceFile: string;
  success: boolean;
  testFilePath?: string;
  testCode?: string;
  iterations?: number;
  mutationScore?: number;
  results?: MutationResult;
  targetReached?: boolean;
  error?: string;
}
```

## Error Handling

All async methods may throw errors. Wrap in try-catch:

```javascript
try {
  const result = await mutantTestGen.run(['src/calculator.js']);
  console.log('Success:', result.summary);
} catch (error) {
  console.error('Error:', error.message);
}
```

Common errors:
- `Error: OpenAI API key is required` - Set OPENAI_API_KEY
- `Error: Stryker exited with code X` - Check test configuration
- `Error: No source files found` - Check file patterns

## Events and Hooks

Currently, the system doesn't emit events. Future versions may include:
- `beforeTestGeneration`
- `afterTestGeneration`
- `beforeMutationTest`
- `afterMutationTest`
- `iterationComplete`

## Best Practices

1. **Always set API key**: Validate before running
2. **Handle errors gracefully**: Wrap calls in try-catch
3. **Review generated tests**: Don't blindly trust LLM output
4. **Monitor API costs**: Track usage, especially with GPT-4
5. **Use appropriate timeouts**: Mutation testing can be slow
6. **Clean up reports**: Regular cleanup of old reports
