# .NET Support - Quick Summary

## 🎯 TL;DR

**Timeline:** 11-16 weeks (3-4 months)  
**Effort:** ~500-700 hours development  
**Team:** 1-2 developers + 1 .NET consultant  
**Complexity:** Medium-High

---

## 📊 What You Need to Know

### Architecture Approach: Multi-Language Support

```
Current (JavaScript only) → Future (Multi-language)

lib/                              lib/
├── adapters/                     ├── adapters/
│   ├── llm/                      │   ├── llm/
│   ├── mutation/                 │   ├── mutation/
│   │   └── stryker-adapter       │   │   ├── stryker-js-adapter
│   │                             │   │   └── stryker-dotnet-adapter ✨
│   └── storage/                  │   ├── parser/ ✨
│                                 │   │   ├── javascript-parser
│                                 │   │   └── csharp-parser ✨
│                                 │   └── storage/
├── core/                         ├── core/
│   ├── entities/                 │   ├── entities/
│   ├── services/                 │   ├── services/
│   └── use-cases/                │   ├── use-cases/
│                                 │   └── language-providers/ ✨
│                                 │       ├── javascript-provider
│                                 │       └── csharp-provider ✨
```

---

## 🔑 Key Technical Decisions

### 1. C# Parser: **Roslyn (Microsoft.CodeAnalysis)** ✅
**Why?**
- Official Microsoft compiler platform
- Complete semantic analysis
- Battle-tested (used by Visual Studio)
- NuGet package available

**How?**
- Create C# helper tool (dotnet console app)
- Node.js spawns it as child process
- Communicates via JSON

```javascript
// JavaScript side
const parser = spawn('dotnet', ['parser-helper.dll', 'parse', 'Calculator.cs']);
// Returns JSON with AST, methods, complexity, etc.
```

```csharp
// C# helper tool
var tree = CSharpSyntaxTree.ParseText(code);
var analysis = ExtractClasses(tree);
Console.WriteLine(JsonSerializer.Serialize(analysis));
```

---

### 2. Test Framework: **xUnit** (Primary), NUnit, MSTest (Later)
**Why xUnit?**
- Modern, most popular in .NET community
- Clean syntax
- Great for TDD/BDD

**Example Output:**
```csharp
using Xunit;

public class CalculatorTests 
{
    [Fact]
    public void Add_TwoPositiveNumbers_ReturnsSum() 
    {
        // Arrange
        var calc = new Calculator();
        
        // Act
        var result = calc.Add(2, 3);
        
        // Assert
        Assert.Equal(5, result);
    }
    
    [Theory]
    [InlineData(1, 2, 3)]
    [InlineData(-1, 1, 0)]
    public void Add_MultipleScenarios_ReturnsCorrectSum(int a, int b, int expected) 
    {
        var calc = new Calculator();
        Assert.Equal(expected, calc.Add(a, b));
    }
}
```

---

### 3. Mutation Testing: **Stryker.NET** ✅
**Why?**
- Official .NET port of Stryker
- Active development
- Supports xUnit, NUnit, MSTest
- Free and open source

**Integration:**
```javascript
// JavaScript adapter
spawn('dotnet', ['stryker', '--config-file', 'stryker-config.json']);
// Parse JSON report from StrykerOutput/
```

---

## 📅 Phases Breakdown

### Phase 1: Research (1-2 weeks)
- Study Roslyn API
- Test Stryker.NET
- Create proof of concept
- **Deliverable:** Technical spec + PoC demo

### Phase 2: Architecture (1 week)
- Design language provider interface
- Update configuration schema
- Plan migration strategy
- **Deliverable:** Architecture document

### Phase 3: Parser (2-3 weeks)
- Build C# helper tool with Roslyn
- Create JavaScript wrapper
- Implement complexity analysis
- **Deliverable:** Working C# parser

### Phase 4: Test Generator (2-3 weeks)
- Engineer C# prompts for LLM
- Build xUnit template generator
- Format test output
- **Deliverable:** xUnit test generation

### Phase 5: Mutation Testing (2-3 weeks)
- Integrate Stryker.NET
- Parse mutation reports
- Handle .csproj files
- **Deliverable:** Mutation testing working

### Phase 6: Integration (1-2 weeks)
- Update CLI with language detection
- Unified application interface
- E2E testing
- **Deliverable:** Full workflow working

### Phase 7: Polish (2 weeks)
- Unit tests (90%+ coverage)
- Documentation
- Example projects
- **Deliverable:** Production ready

---

## 💰 Cost Estimate

### Developer Time
```
Senior Developer (solo):    11-16 weeks × 40h = 440-640 hours
OR
2 Mid Developers:           8-12 weeks × 80h = 640-960 hours

.NET Expert (consultant):   20-30 hours (reviews, advice)
```

### Infrastructure
- ✅ .NET 8 SDK (free)
- ✅ Stryker.NET (free, open source)
- ✅ Roslyn (free, Microsoft official)
- ⚠️ LLM API costs: +10-20% (C# prompts larger than JS)

### Total Investment
- **Time:** ~500-700 hours
- **Money:** Developer salaries + ~$200-500 in LLM API testing

---

## 🚀 Quick Start (If Starting Now)

### Week 1: Proof of Concept
```bash
# 1. Setup
cd mutant_test_gen_js
mkdir dotnet-helper
cd dotnet-helper

# 2. Create C# parser
dotnet new console -n CSharpParserHelper
dotnet add package Microsoft.CodeAnalysis.CSharp

# 3. Implement basic parser
# ... (see full roadmap for code)

# 4. Test
cd ..
node cli.js generate examples/dotnet/Calculator.cs --language csharp
```

**Goal:** Parse 1 C# file, generate 1 test, prove concept works

---

## ⚠️ Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Roslyn learning curve | Medium | Hire .NET expert for consultation |
| Stryker.NET issues | High | Prototype early, test thoroughly |
| LLM prompt quality | Medium | Extensive prompt engineering + testing |
| Cross-platform bugs | Medium | Test Windows/Linux/Mac regularly |

---

## ✅ Success Criteria (MVP)

### Must Have:
- [ ] Parse C# classes and methods
- [ ] Generate xUnit tests via LLM
- [ ] Run Stryker.NET mutation testing
- [ ] Feedback loop working
- [ ] CLI: `mutant-test-gen generate Calculator.cs --language csharp`
- [ ] 80%+ test coverage of new code
- [ ] Full documentation

### Nice to Have:
- [ ] NUnit/MSTest support
- [ ] Async/await support
- [ ] Generic types support
- [ ] Moq dependency mocking

### Future:
- [ ] ASP.NET Core support
- [ ] Entity Framework support

---

## 📚 Resources

### Must Read:
- [Roslyn Overview](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/)
- [Stryker.NET Docs](https://stryker-mutator.io/docs/stryker-net/introduction/)
- [xUnit Documentation](https://xunit.net/)

### Internal Docs:
- **[Full Roadmap](dotnet-roadmap.md)** - Detailed 50+ page implementation guide
- **[Architecture](../ARCHITECTURE.md)** - Current system design
- **[API Reference](../API.md)** - For understanding extension points

---

## 🤔 FAQ

### Q: Why not TypeScript first?
**A:** TypeScript is closer to JavaScript, but .NET represents a bigger market opportunity (enterprise). Also demonstrates true multi-language capability.

### Q: Can we support both JS and C# in same project?
**A:** Yes! Architecture supports multiple languages. Detect by file extension:
```bash
mutant-test-gen generate src/**/*.{js,cs}
# Auto-detects and generates appropriate tests
```

### Q: What about Angular/React components?
**A:** That's Phase 2+ feature. Current focus is pure business logic (classes, services, utilities). Components need framework-specific test patterns.

### Q: Performance concerns with Roslyn?
**A:** Roslyn is fast enough. Bottleneck will be LLM API calls and Stryker.NET mutation testing, not parsing.

### Q: Can I help?
**A:** Yes! Check [CONTRIBUTING.md](../../CONTRIBUTING.md). We'll need:
- .NET developers for Phase 3-5
- Prompt engineers for C# test generation
- QA for testing on different .NET versions

---

## 🎯 Next Steps

1. **Review [Full Roadmap](dotnet-roadmap.md)**
2. **Decide on timeline** (when to start?)
3. **Allocate resources** (who will work on it?)
4. **Set up .NET environment** (install SDK, Stryker.NET)
5. **Create GitHub project board** (track phases)
6. **Start Phase 1** (research & PoC)

---

**Questions?** Open an issue: [GitHub Issues](https://github.com/hoangtruonghrs/mutant_test_gen_js/issues)

**Want to sponsor .NET development?** See [SUPPORT.md](support.md)
