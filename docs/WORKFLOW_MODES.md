# Workflow Modes - Simple vs Feedback Loop

## 🔍 Tổng quan

Mutant Test Gen JS hỗ trợ **2 chế độ sinh test**:

1. **Simple Mode** (Mặc định) - Sinh test một lần
2. **Feedback Loop Mode** - Sinh test lặp lại với mutation-guided improvement

---

## 1️⃣ Simple Mode (Mặc định)

### Command:
```bash
mutant-test-gen generate examples/calculator.js -o test_example
```

### Quy trình:
```
┌─────────────────────────────────────────────────────────┐
│ 1. Load Source Code                                     │
│    └─> examples/calculator.js                           │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. LLM Generate Initial Tests                           │
│    └─> Azure GPT-4o/OpenAI tạo test suite đầu tiên     │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Save Test File                                       │
│    └─> test_example/calculator.test.js                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Run Mutation Analysis (Optional)                     │
│    └─> Đánh giá chất lượng test                        │
│    └─> Báo cáo mutation score                          │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
              ✅ DONE
```

### Đặc điểm:
- ⚡ **Nhanh** - Chỉ 1 lần gọi LLM
- 💰 **Tiết kiệm** - Chi phí API thấp
- ✅ **Đủ dùng** - Cho code đơn giản
- ❌ **Không tối ưu** - Test chưa được refine

### Khi nào dùng:
- Code đơn giản, ít logic phức tạp
- Cần test nhanh để bắt đầu
- Ngân sách API hạn chế
- Chấp nhận mutation score thấp (~50-70%)

---

## 2️⃣ Feedback Loop Mode

### Command:
```bash
mutant-test-gen generate examples/calculator.js -o test_example --feedback
# Hoặc -f
mutant-test-gen generate examples/calculator.js -o test_example -f
```

### Quy trình (4 Bước Bạn Đã Hỏi):

```
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 1: Sinh Test Ban Đầu                               │
│ ───────────────────────────────────────────────────────│
│ LLM tạo bộ test đầu tiên dựa trên source code          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 2: Đánh Giá Bằng Mutation Testing                  │
│ ───────────────────────────────────────────────────────│
│ Stryker tạo mutants và chạy tests                       │
│ Kết quả:                                                 │
│   - Killed mutants: 15  ✅                               │
│   - Survived mutants: 5 ❌ (Điểm yếu!)                   │
│   - Mutation Score: 75%                                  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 3: Dùng Survived Mutants Để Hướng Dẫn LLM          │
│ ───────────────────────────────────────────────────────│
│ Prompt gửi cho LLM:                                      │
│                                                          │
│ "Đây là code gốc:                                        │
│   function add(a, b) { return a + b; }                  │
│                                                          │
│  Đây là mutant SỐNG SÓT (chưa được test bắt):           │
│   function add(a, b) { return a - b; }  // Đổi + thành -│
│                                                          │
│  Hãy viết test case mới để phát hiện lỗi này!"          │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 4: LLM Sinh Test Mới + Lặp Lại                     │
│ ───────────────────────────────────────────────────────│
│ LLM tạo test case mới, mạnh hơn:                        │
│   test('should handle operator correctly', () => {      │
│     expect(add(5, 3)).toBe(8);  // Bắt được mutant!     │
│     expect(add(5, 3)).not.toBe(2);                      │
│   });                                                    │
│                                                          │
│ → Merge vào test suite                                  │
│ → Chạy lại mutation testing                             │
│ → Lặp lại cho đến khi:                                  │
│     ✅ Đạt target score (80%)                            │
│     ✅ Hoặc đạt max iterations (5)                       │
└─────────────────────────────────────────────────────────┘
                 │
                 ▼
              ✅ DONE
     Test Suite Chất Lượng Cao!
```

### Đặc điểm:
- 🎯 **Chất lượng cao** - Mutation score 80-95%
- 🔄 **Iterative** - Liên tục cải thiện
- 💎 **Mutation-guided** - Tập trung vào weaknesses
- 💰 **Tốn API** - Nhiều lần gọi LLM
- ⏱️ **Chậm hơn** - 3-5 iterations

### Khi nào dùng:
- Code quan trọng, logic phức tạp
- Cần test suite chất lượng cao
- Sẵn sàng đợi và trả phí API
- Target mutation score cao (>80%)

---

## 📊 So Sánh Trực Tiếp

| Tiêu chí | Simple Mode | Feedback Loop |
|----------|-------------|---------------|
| **Thời gian** | 5-10 giây | 30-120 giây |
| **LLM calls** | 1 lần | 3-5 lần |
| **Chi phí API** | ~$0.01 | ~$0.05-0.10 |
| **Mutation Score** | 50-70% | 80-95% |
| **Test quality** | Cơ bản | Cao |
| **Use case** | Development | Production |

---

## 🎮 Ví Dụ Cụ Thể

### Simple Mode Output:
```javascript
// 10 test cases, mutation score: 65%
describe('Calculator', () => {
  test('add two numbers', () => {
    expect(calc.add(2, 3)).toBe(5);
  });
  // ... 9 more basic tests
});
```

### Feedback Loop Output (Sau 3 iterations):
```javascript
// 25 test cases, mutation score: 87%
describe('Calculator', () => {
  test('add two numbers', () => {
    expect(calc.add(2, 3)).toBe(5);
  });
  
  test('add handles negative numbers', () => {
    expect(calc.add(-2, -3)).toBe(-5);
  });
  
  test('add rejects when operator mutated', () => {
    expect(calc.add(5, 3)).toBe(8);
    expect(calc.add(5, 3)).not.toBe(2);  // Catches - mutant
    expect(calc.add(5, 3)).not.toBe(15); // Catches * mutant
  });
  
  // ... 22 more refined tests targeting specific mutants
});
```

---

## 🔧 Configuration Options

### Via CLI:
```bash
# Simple mode
mutant-test-gen generate file.js

# Feedback loop với custom settings
mutant-test-gen generate file.js \
  --feedback \
  --target 85 \
  --iterations 7 \
  --model gpt-4o
```

### Via Config File:
```javascript
// config/custom.config.js
module.exports = {
  useFeedbackLoop: true,
  targetMutationScore: 85,
  maxIterations: 7,
  llm: {
    model: 'gpt-4o',
    temperature: 0.7
  }
};
```

Then:
```bash
mutant-test-gen generate file.js --config config/custom.config.js
```

---

## 💡 Best Practices

### Khi chọn Simple Mode:
1. Dùng cho prototyping/experimentation
2. Review và manually improve tests sau
3. Chạy mutation analysis riêng để đánh giá
4. Combine với manual test writing

### Khi chọn Feedback Loop:
1. Đảm bảo mutation testing setup đúng (Jest, Stryker)
2. Set reasonable target score (80-90%, không phải 100%)
3. Monitor API usage và costs
4. Review final tests - vẫn có thể có redundancy

---

## 🚨 Lưu Ý Quan Trọng

### Hiện tại trong project của bạn:
- ✅ Simple Mode: **HOẠT ĐỘNG TÔT**
- ⚠️ Feedback Loop: **CHƯA HOẠT ĐỘNG** 
  - Lý do: Mutation testing có lỗi `spawn npx ENOENT`
  - Cần fix: Cài đặt Stryker và Jest runner

### Để enable Feedback Loop hoàn chỉnh:
```bash
# 1. Cài dependencies
npm install

# 2. Verify Jest hoạt động
npm test

# 3. Test với feedback mode
mutant-test-gen generate examples/calculator.js -o test_example --feedback
```

---

## 📚 Kết Luận

**Câu trả lời cho câu hỏi của bạn:**

> Với lệnh `mutant-test-gen generate examples/calculator.js -o test_example`

❌ **KHÔNG**, bạn KHÔNG đang chạy quy trình 4 bước feedback loop

✅ Bạn đang chạy **Simple Mode** - Chỉ sinh test một lần

Để chạy quy trình 4 bước (feedback loop), thêm flag:
```bash
mutant-test-gen generate examples/calculator.js -o test_example --feedback
```

**Nhưng hiện tại feedback loop chưa work do mutation testing setup chưa đầy đủ.**
