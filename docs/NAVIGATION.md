# 📁 Documentation Structure - Quick Reference

All project documentation has been organized into the `docs/` directory.

## 📍 Main Entry Points

| Document | Location | Purpose |
|----------|----------|---------|
| **Project README** | [README.md](../README.md) | Start here - Overview, features, quick start |
| **Documentation Hub** | [docs/README.md](./README.md) | Index of all documentation |
| **Testing Hub** | [docs/testing/README.md](./testing/README.md) | Testing documentation center |
| **Architecture** | [docs/ARCHITECTURE.md](./ARCHITECTURE.md) | System design and patterns |
| **API Reference** | [docs/API.md](./API.md) | Complete API documentation |

## 🧪 Testing Documentation

All testing docs are in `docs/testing/`:

```
docs/testing/
├── README.md                    # Testing overview & quick start
├── PHASE1_PROGRESS.md           # Current status (171 tests, 20.66% coverage)
├── TESTING_PLAN.md              # Overall strategy & timeline
├── ENTITY_TESTS_SUMMARY.md      # Entity layer (98.63% coverage ✅)
└── SERVICE_LAYER_PROGRESS.md    # Service layer (19.29% coverage 🔄)
```

## 📊 Current Testing Status

```
✅ Entity Layer:     98.63% coverage (137 tests)
🔄 Service Layer:    19.29% coverage (34 tests, 1/3 complete)
⏳ Use Cases:        0% coverage (not started)
⏳ Adapters:         0% coverage (not started)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Overall:         20.66% coverage (171 tests)
```

## 🚀 Quick Navigation

**For Users:**
1. [README.md](../README.md) → [INSTALLATION.md](./INSTALLATION.md) → [Examples](../examples/)

**For Developers:**
1. [README.md](../README.md) → [ARCHITECTURE.md](./ARCHITECTURE.md) → [Testing Hub](./testing/README.md)

**For Contributors:**
1. [Testing Hub](./testing/README.md) → [Phase 1 Progress](./testing/PHASE1_PROGRESS.md) → Pick a task

## 📝 File Locations

All documentation files are now organized:

- ✅ Root level: Only `README.md` and `CHANGELOG.md`
- ✅ `docs/`: All other documentation
- ✅ `docs/testing/`: All testing-related docs
- ✅ No loose testing files in root

---

*Navigation tip: Start at [docs/README.md](./README.md) for full documentation index*
