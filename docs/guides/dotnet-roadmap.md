# .NET Support Implementation Plan

## 🎯 Goal
Extend mutant-test-gen to support .NET/C# projects with the same quality as JavaScript support.

---

## 📊 Phase Overview

| Phase | Duration | Deliverable | Risk |
|-------|----------|-------------|------|
| Phase 1: Research | 1-2 weeks | Technical spec | Low |
| Phase 2: Architecture | 1 week | Design document | Medium |
| Phase 3: Parser & AST | 2-3 weeks | C# parser | High |
| Phase 4: Test Generator | 2-3 weeks | xUnit/NUnit generator | Medium |
| Phase 5: Mutation Testing | 2-3 weeks | Stryker.NET integration | Medium |
| Phase 6: Integration | 1-2 weeks | End-to-end workflow | High |
| Phase 7: Testing & Polish | 2 weeks | Production ready | Low |
| **TOTAL** | **11-16 weeks** | **Full .NET support** | |

---

## Phase 1: Research & Analysis (1-2 weeks)

### 1.1 Technology Stack Research

**C# Parsing Options:**
```
Option A: Roslyn (Microsoft.CodeAnalysis) ✅ RECOMMENDED
- Official Microsoft compiler platform
- Complete semantic analysis
- Used by Visual Studio
- NuGet: Microsoft.CodeAnalysis.CSharp

Option B: External tools (CodeDOM, etc.)
- Less complete
- Harder to maintain
```

**Test Frameworks:**
```
✅ xUnit (Most popular, modern)
✅ NUnit (Classic, widely used)
✅ MSTest (Microsoft official)
⚠️ Start with xUnit, add others later
```

**Mutation Testing:**
```
✅ Stryker.NET (https://stryker-mutator.io/)
- .NET port of Stryker
- Active development
- Good documentation
- Supports xUnit, NUnit, MSTest
```

### 1.2 Key Differences JS → C#

| Aspect | JavaScript | C# |
|--------|-----------|-----|
| **Type System** | Dynamic | Static (strong typing) |
| **Syntax** | Loose | Strict |
| **Import/Export** | CommonJS/ES6 | `using` statements |
| **Test Pattern** | Jest/Mocha | xUnit/NUnit attributes |
| **Async** | Promises | async/await + Task |
| **DI** | Manual | Built-in (IServiceProvider) |

### 1.3 Sample C# Code to Support

```csharp
// Simple case - Pure logic
public class Calculator 
{
    public int Add(int a, int b) => a + b;
    public int Subtract(int a, int b) => a - b;
}

// Medium case - Class with dependencies
public class UserService 
{
    private readonly IUserRepository _repo;
    
    public UserService(IUserRepository repo) 
    {
        _repo = repo;
    }
    
    public async Task<User> GetUserAsync(int id) 
    {
        return await _repo.FindByIdAsync(id);
    }
}

// Complex case - Generic methods
public class Repository<T> where T : class 
{
    public async Task<T> GetByIdAsync(int id) { ... }
    public async Task<List<T>> GetAllAsync() { ... }
}
```

### 1.4 Expected Test Output (xUnit)

```csharp
using Xunit;

public class CalculatorTests 
{
    [Fact]
    public void Add_TwoPositiveNumbers_ReturnsSum() 
    {
        // Arrange
        var calculator = new Calculator();
        
        // Act
        var result = calculator.Add(2, 3);
        
        // Assert
        Assert.Equal(5, result);
    }
    
    [Theory]
    [InlineData(1, 2, 3)]
    [InlineData(-1, 1, 0)]
    [InlineData(0, 0, 0)]
    public void Add_VariousInputs_ReturnsCorrectSum(int a, int b, int expected) 
    {
        // Arrange
        var calculator = new Calculator();
        
        // Act
        var result = calculator.Add(a, b);
        
        // Assert
        Assert.Equal(expected, result);
    }
}
```

**Deliverables:**
- [ ] Technology stack decision document
- [ ] Sample C# files for testing
- [ ] Comparison matrix (JS vs C# features)
- [ ] Risk assessment

---

## Phase 2: Architecture Design (1 week)

### 2.1 Multi-Language Architecture

**Current Structure (JS only):**
```
lib/
├── adapters/
│   ├── llm/              # Language agnostic ✅
│   ├── mutation/         # Language specific ❌
│   └── storage/          # Language agnostic ✅
├── core/
│   ├── entities/         # Language specific ❌
│   └── services/         # Language specific ❌
```

**New Structure (Multi-language):**
```
lib/
├── adapters/
│   ├── llm/                    # Language agnostic ✅
│   ├── mutation/
│   │   ├── base-mutation-adapter.js
│   │   ├── stryker-js-adapter.js       # JavaScript
│   │   └── stryker-dotnet-adapter.js   # .NET (NEW)
│   ├── parser/                 # NEW
│   │   ├── base-parser.js
│   │   ├── javascript-parser.js
│   │   └── csharp-parser.js    # NEW
│   └── storage/                # Language agnostic ✅
├── core/
│   ├── entities/
│   │   ├── source-file.js      # Add language property
│   │   └── test-file.js        # Add framework property
│   ├── services/
│   │   ├── test-generation-service.js  # Language agnostic
│   │   └── mutation-analysis-service.js # Language agnostic
│   └── language-providers/     # NEW
│       ├── javascript-provider.js
│       └── csharp-provider.js  # NEW
```

### 2.2 Language Provider Interface

```javascript
// lib/core/language-providers/base-provider.js
class LanguageProvider {
  constructor(config) {
    this.language = config.language;
    this.testFramework = config.testFramework;
  }
  
  // Must implement
  async parseSourceFile(filePath) { throw new Error('Not implemented'); }
  async generateTests(sourceFile, context) { throw new Error('Not implemented'); }
  async runMutationTesting(sourceFile, testFile) { throw new Error('Not implemented'); }
  
  // Helper methods
  getFileExtensions() { throw new Error('Not implemented'); }
  getTestFileNamingPattern() { throw new Error('Not implemented'); }
  validateSyntax(code) { throw new Error('Not implemented'); }
}

// lib/core/language-providers/csharp-provider.js
class CSharpProvider extends LanguageProvider {
  constructor(config) {
    super({ language: 'csharp', ...config });
    this.parser = new CSharpParser();
    this.mutationAdapter = new StrykerDotNetAdapter();
  }
  
  async parseSourceFile(filePath) {
    // Use Roslyn via C# helper process
    const ast = await this.parser.parse(filePath);
    return new SourceFile(filePath, ast, 'csharp');
  }
  
  async generateTests(sourceFile, context) {
    // Use LLM with C#-specific prompts
    const prompt = this.buildCSharpPrompt(sourceFile, context);
    const tests = await this.llmAdapter.generateTests(prompt);
    return this.formatXUnitTests(tests);
  }
  
  getFileExtensions() { return ['.cs']; }
  getTestFileNamingPattern() { return '{name}Tests.cs'; }
}
```

### 2.3 Configuration Changes

```javascript
// config/default.config.js
module.exports = {
  // Language detection
  language: 'auto', // 'javascript' | 'csharp' | 'auto'
  
  // JavaScript config (existing)
  javascript: {
    testFramework: 'jest',
    mutationTool: 'stryker',
    parser: 'babel'
  },
  
  // C# config (new)
  csharp: {
    testFramework: 'xunit', // 'xunit' | 'nunit' | 'mstest'
    mutationTool: 'stryker-net',
    targetFramework: 'net8.0', // 'net6.0' | 'net7.0' | 'net8.0'
    projectFile: null, // Optional .csproj path
    usings: [ // Common using statements
      'System',
      'System.Collections.Generic',
      'System.Linq',
      'System.Threading.Tasks',
      'Xunit'
    ]
  },
  
  // LLM config
  llm: {
    provider: 'azure',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    // Language-specific instructions
    languageInstructions: {
      csharp: 'Generate xUnit tests following AAA pattern (Arrange-Act-Assert). Use [Fact] for single tests and [Theory] with [InlineData] for parameterized tests.'
    }
  }
};
```

**Deliverables:**
- [ ] Architecture design document
- [ ] Interface definitions
- [ ] Configuration schema
- [ ] Migration plan for existing code

---

## Phase 3: C# Parser Implementation (2-3 weeks)

### 3.1 Roslyn Integration Strategy

**Option A: Direct Node.js → C# interop** ✅ RECOMMENDED
```javascript
// lib/adapters/parser/csharp-parser.js
const { spawn } = require('child_process');
const path = require('path');

class CSharpParser {
  constructor() {
    this.helperPath = path.join(__dirname, '../../../dotnet-helper/CSharpParserHelper.dll');
  }
  
  async parse(filePath) {
    return new Promise((resolve, reject) => {
      const process = spawn('dotnet', [this.helperPath, 'parse', filePath]);
      
      let output = '';
      process.stdout.on('data', data => output += data);
      process.on('close', code => {
        if (code === 0) {
          resolve(JSON.parse(output));
        } else {
          reject(new Error('Parser failed'));
        }
      });
    });
  }
}
```

**C# Helper Tool:**
```csharp
// dotnet-helper/CSharpParserHelper/Program.cs
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using System.Text.Json;

class Program 
{
    static async Task Main(string[] args) 
    {
        if (args[0] == "parse") 
        {
            var filePath = args[1];
            var code = await File.ReadAllTextAsync(filePath);
            var tree = CSharpSyntaxTree.ParseText(code);
            var root = tree.GetRoot();
            
            var analysis = new {
                Classes = ExtractClasses(root),
                Methods = ExtractMethods(root),
                Properties = ExtractProperties(root),
                Complexity = CalculateComplexity(root),
                Dependencies = ExtractUsings(root)
            };
            
            Console.WriteLine(JsonSerializer.Serialize(analysis));
        }
    }
    
    static List<ClassInfo> ExtractClasses(SyntaxNode root) 
    {
        return root.DescendantNodes()
            .OfType<ClassDeclarationSyntax>()
            .Select(c => new ClassInfo {
                Name = c.Identifier.Text,
                IsPublic = c.Modifiers.Any(m => m.IsKind(SyntaxKind.PublicKeyword)),
                BaseTypes = c.BaseList?.Types.Select(t => t.ToString()).ToList(),
                Methods = ExtractMethodsFromClass(c)
            })
            .ToList();
    }
    
    // ... more extraction methods
}
```

### 3.2 Complexity Analysis for C#

```csharp
static ComplexityMetrics CalculateComplexity(SyntaxNode root) 
{
    var methods = root.DescendantNodes().OfType<MethodDeclarationSyntax>();
    var conditions = root.DescendantNodes().Where(n => 
        n is IfStatementSyntax || 
        n is SwitchStatementSyntax ||
        n is WhileStatementSyntax
    );
    
    return new ComplexityMetrics {
        TotalMethods = methods.Count(),
        TotalConditions = conditions.Count(),
        CyclomaticComplexity = CalculateCyclomaticComplexity(root),
        LinesOfCode = root.ToString().Split('\n').Length
    };
}
```

**Deliverables:**
- [ ] C# parser helper tool (.NET console app)
- [ ] JavaScript wrapper for parser
- [ ] AST to JSON serialization
- [ ] Complexity metrics calculator
- [ ] Unit tests for parser

---

## Phase 4: Test Generator for C# (2-3 weeks)

### 4.1 LLM Prompt Engineering for C#

```javascript
// lib/adapters/llm/csharp-prompt-builder.js
class CSharpPromptBuilder {
  buildInitialPrompt(sourceFile, context) {
    return `You are an expert C# developer writing comprehensive unit tests using xUnit.

**Source Code:**
\`\`\`csharp
${sourceFile.content}
\`\`\`

**Requirements:**
1. Use xUnit test framework
2. Follow AAA pattern (Arrange-Act-Assert)
3. Use [Fact] for single test cases
4. Use [Theory] with [InlineData] for parameterized tests
5. Test all public methods
6. Include edge cases: null inputs, empty collections, boundary values
7. Mock dependencies using Moq library
8. Use descriptive test method names: MethodName_Scenario_ExpectedBehavior
9. Add XML comments for complex tests

**Test File Structure:**
\`\`\`csharp
using Xunit;
using Moq;
using ${context.namespace};

namespace ${context.namespace}.Tests
{
    public class ${context.className}Tests
    {
        [Fact]
        public void MethodName_Scenario_ExpectedBehavior()
        {
            // Arrange
            
            // Act
            
            // Assert
        }
    }
}
\`\`\`

Generate complete, production-ready xUnit tests:`;
  }
  
  buildImprovementPrompt(sourceFile, testFile, survivedMutants) {
    return `The following mutants survived your tests. Generate additional test cases to kill them:

**Survived Mutants:**
${survivedMutants.map(m => `
- Line ${m.location.start.line}: ${m.mutatorName}
  Original: ${m.getOriginalLines()}
  Mutated: ${m.getMutatedLines()}
`).join('\n')}

**Current Test File:**
\`\`\`csharp
${testFile.content}
\`\`\`

Generate NEW test cases that will catch these mutations. Focus on:
1. Testing boundary conditions around line ${survivedMutants[0].location.start.line}
2. Verifying exact values, not just non-null
3. Testing both positive and negative cases

Return ONLY the new [Fact] or [Theory] methods to add:`;
  }
}
```

### 4.2 Test File Template

```javascript
// lib/templates/csharp-test-template.js
class CSharpTestTemplate {
  generate(sourceFile, tests, context) {
    const usings = [
      'using System;',
      'using System.Collections.Generic;',
      'using System.Linq;',
      'using System.Threading.Tasks;',
      'using Xunit;',
      'using Moq;',
      `using ${context.sourceNamespace};`,
      ...context.additionalUsings
    ];
    
    return `${usings.join('\n')}

namespace ${context.testNamespace}
{
    /// <summary>
    /// Unit tests for <see cref="${context.className}"/>
    /// Generated by mutant-test-gen on ${new Date().toISOString()}
    /// </summary>
    public class ${context.className}Tests
    {
${tests.map(test => this.formatTest(test)).join('\n\n')}
    }
}
`;
  }
  
  formatTest(test) {
    return `        ${test.attributes.join('\n        ')}
        public ${test.returnType} ${test.name}(${test.parameters})
        {
${test.body}
        }`;
  }
}
```

**Deliverables:**
- [ ] C# prompt builder
- [ ] Test file template generator
- [ ] xUnit test formatter
- [ ] NUnit/MSTest templates (optional)

---

## Phase 5: Stryker.NET Integration (2-3 weeks)

### 5.1 Stryker.NET Adapter

```javascript
// lib/adapters/mutation/stryker-dotnet-adapter.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

class StrykerDotNetAdapter {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
  }
  
  async runMutationAnalysis(sourceFile, testFile) {
    // 1. Create temporary .csproj if needed
    const projectFile = await this.ensureProjectFile(sourceFile, testFile);
    
    // 2. Create stryker-config.json
    const configPath = await this.createStrykerConfig(sourceFile, testFile);
    
    // 3. Run Stryker.NET
    const result = await this.runStryker(projectFile, configPath);
    
    // 4. Parse results
    return this.parseResults(result);
  }
  
  async ensureProjectFile(sourceFile, testFile) {
    const projectDir = path.dirname(testFile.filePath);
    const csprojPath = path.join(projectDir, 'TestProject.csproj');
    
    if (!await this.fileExists(csprojPath)) {
      // Generate minimal .csproj
      const csproj = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>${this.config.targetFramework || 'net8.0'}</TargetFramework>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  
  <ItemGroup>
    <PackageReference Include="xunit" Version="2.4.2" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.4.5" />
    <PackageReference Include="Moq" Version="4.18.4" />
  </ItemGroup>
  
  <ItemGroup>
    <Compile Include="${path.relative(projectDir, sourceFile.filePath)}" />
  </ItemGroup>
</Project>`;
      
      await fs.writeFile(csprojPath, csproj);
    }
    
    return csprojPath;
  }
  
  async createStrykerConfig(sourceFile, testFile) {
    const config = {
      "stryker-config": {
        "project": path.dirname(testFile.filePath),
        "test-runner": "xunit",
        "reporters": ["json", "html", "progress"],
        "mutate": [path.relative(process.cwd(), sourceFile.filePath)],
        "test-projects": [path.dirname(testFile.filePath)],
        "thresholds": {
          "high": 80,
          "low": 60,
          "break": 0
        }
      }
    };
    
    const configPath = path.join(process.cwd(), 'stryker-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    return configPath;
  }
  
  async runStryker(projectFile, configPath) {
    return new Promise((resolve, reject) => {
      const stryker = spawn('dotnet', [
        'stryker',
        '--config-file', configPath,
        '--project', projectFile
      ], {
        cwd: path.dirname(projectFile),
        shell: true
      });
      
      let output = '';
      stryker.stdout.on('data', data => {
        output += data.toString();
        this.logger.info(data.toString().trim());
      });
      
      stryker.on('close', code => {
        if (code === 0 || code === 1) { // 1 = mutants survived
          resolve(output);
        } else {
          reject(new Error(`Stryker.NET failed with code ${code}`));
        }
      });
    });
  }
  
  async parseResults(output) {
    // Parse JSON report from StrykerOutput folder
    const reportPath = path.join(process.cwd(), 'StrykerOutput', 'reports', 'mutation-report.json');
    const report = JSON.parse(await fs.readFile(reportPath, 'utf8'));
    
    return {
      mutationScore: report.summary.mutationScore,
      totalMutants: report.summary.totalMutants,
      killed: report.summary.killed,
      survived: report.summary.survived,
      timeout: report.summary.timeout,
      noCoverage: report.summary.noCoverage,
      survivedMutants: this.extractSurvivedMutants(report)
    };
  }
}

module.exports = StrykerDotNetAdapter;
```

**Deliverables:**
- [ ] Stryker.NET adapter
- [ ] .csproj generator
- [ ] Configuration builder
- [ ] Result parser

---

## Phase 6: End-to-End Integration (1-2 weeks)

### 6.1 CLI Updates

```javascript
// cli.js updates
program
  .command('generate')
  .option('-l, --language <type>', 'Language: javascript, csharp, auto', 'auto')
  .option('-f, --framework <name>', 'Test framework: jest, xunit, nunit', 'auto')
  .option('--target-framework <version>', '.NET target framework', 'net8.0')
  // ... existing options
  .action(async (sourcePath, options) => {
    // Auto-detect language
    const language = options.language === 'auto' 
      ? detectLanguage(sourcePath)
      : options.language;
    
    const app = await createApplication({ language });
    // ... rest of implementation
  });

function detectLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap = {
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.cjs': 'javascript',
    '.ts': 'typescript',
    '.cs': 'csharp',
    '.vb': 'vbnet'
  };
  return languageMap[ext] || 'javascript';
}
```

### 6.2 Unified Application Interface

```javascript
// lib/application.js updates
class MutantTestGenApplication {
  constructor(config) {
    this.config = config;
    this.language = config.language || 'javascript';
    
    // Initialize language-specific provider
    this.languageProvider = this.createLanguageProvider();
    
    // Initialize shared services
    this.llmAdapterFactory = new LLMAdapterFactory();
    this.storageProvider = new FileSystemStorage(config.storage, logger);
  }
  
  createLanguageProvider() {
    const providers = {
      javascript: () => new JavaScriptProvider(this.config.javascript),
      csharp: () => new CSharpProvider(this.config.csharp),
      // Future: python, typescript, etc.
    };
    
    const provider = providers[this.language];
    if (!provider) {
      throw new Error(`Unsupported language: ${this.language}`);
    }
    
    return provider();
  }
  
  async generateTests(options) {
    // Delegate to language provider
    return this.languageProvider.generateTests(options);
  }
}
```

**Deliverables:**
- [ ] Updated CLI with language detection
- [ ] Unified application interface
- [ ] Language provider factory
- [ ] Integration tests

---

## Phase 7: Testing & Documentation (2 weeks)

### 7.1 Testing Strategy

```
Test Coverage Goals:
├── C# Parser: 90%+ coverage
├── Stryker.NET Adapter: 85%+ coverage
├── C# Provider: 85%+ coverage
├── Integration Tests: Key workflows
└── E2E Tests: Sample .NET projects
```

### 7.2 Example Projects

Create sample .NET projects:
```
examples/
├── dotnet/
│   ├── Calculator/
│   │   ├── Calculator.cs
│   │   └── Calculator.csproj
│   ├── UserService/
│   │   ├── UserService.cs
│   │   ├── IUserRepository.cs
│   │   └── UserService.csproj
│   └── Advanced/
│       ├── GenericRepository.cs
│       └── Advanced.csproj
```

### 7.3 Documentation

```
docs/
├── languages/
│   ├── javascript.md (existing)
│   └── csharp.md (new)
├── guides/
│   ├── dotnet-setup.md
│   ├── dotnet-migration.md
│   └── multi-language-projects.md
└── examples/
    └── dotnet-examples.md
```

**Deliverables:**
- [ ] Unit tests for all new code
- [ ] Integration tests
- [ ] Example .NET projects
- [ ] Documentation
- [ ] Migration guide

---

## 🎯 Success Criteria

### Must Have (MVP):
- [ ] Parse C# classes and methods
- [ ] Generate xUnit tests via LLM
- [ ] Run Stryker.NET mutation testing
- [ ] Feedback loop working
- [ ] CLI supports `--language csharp`
- [ ] 80%+ test coverage
- [ ] Documentation complete

### Nice to Have:
- [ ] NUnit/MSTest support
- [ ] Async/await pattern support
- [ ] Generic type support
- [ ] Dependency injection mocking
- [ ] .NET 6/7/8 support

### Future:
- [ ] ASP.NET Core support
- [ ] Entity Framework support
- [ ] Blazor component support

---

## 💰 Resource Estimate

### Development Time:
- **1 Senior Developer:** 11-16 weeks (full-time)
- **OR 2 Mid-level Developers:** 8-12 weeks (full-time)
- **+ 1 .NET Expert (part-time):** Review & consultation

### Infrastructure:
- .NET 8 SDK
- Stryker.NET license (free, open source)
- Additional LLM API costs (C# prompts slightly larger)

### Total Effort:
- **~400-600 hours** of development
- **~100 hours** of testing
- **~50 hours** of documentation

---

## 🚀 Quick Start Path (If you want to start NOW)

### Week 1-2: Proof of Concept
```bash
# 1. Create dotnet-helper tool
cd mutant_test_gen_js
mkdir dotnet-helper
cd dotnet-helper
dotnet new console -n CSharpParserHelper
# ... implement basic parser

# 2. Test manual workflow
node cli.js generate examples/dotnet/Calculator.cs --language csharp
```

**Deliverables:**
- [ ] Basic C# parser working
- [ ] One simple test generated
- [ ] Proof of concept demo

---

## 📊 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Roslyn learning curve | High | Medium | Hire .NET expert consultant |
| Stryker.NET integration | Medium | High | Prototype early, test thoroughly |
| LLM prompt quality | Medium | Medium | Extensive prompt engineering |
| Cross-platform issues | Low | Medium | Test on Windows/Linux/Mac |
| Performance (Roslyn) | Low | Low | Optimize later, measure first |

---

## ✅ Checklist for Starting

Before starting Phase 1:
- [ ] Allocate dedicated developer time
- [ ] Set up .NET 8 development environment
- [ ] Install Stryker.NET globally
- [ ] Create example C# projects
- [ ] Review Roslyn documentation
- [ ] Budget for LLM API costs (C# tests = more tokens)

---

**Questions? See [docs/guides/support.md](../guides/support.md)**
