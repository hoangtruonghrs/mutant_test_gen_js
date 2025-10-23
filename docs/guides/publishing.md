# Publishing Guide

## Before Publishing

### 1. Final Verification
```bash
# Check syntax
node -c cli.js
node -c index.js

# Run audit
npm audit --production

# Test pack
npm pack --dry-run

# Verify package contents
npm pack
tar -tzf mutant_test_gen_js-1.0.0.tgz | head -20
```

### 2. Version Check
- Ensure `package.json` version is correct
- Update `CHANGELOG.md` with release date
- Tag should match package version

### 3. Test Locally
```bash
# Link globally
npm link

# Test commands
mutant-test-gen --help
mutant-test-gen generate examples/calculator.js

# Unlink when done
npm unlink -g mutant_test_gen_js
```

## Publishing to NPM

### First Time Setup
```bash
# Login to npm (only needed once)
npm login
```

### Publish Process

1. **Dry Run**
   ```bash
   npm publish --dry-run
   ```

2. **Actually Publish**
   ```bash
   npm publish
   ```

3. **Verify**
   - Visit: https://www.npmjs.com/package/mutant_test_gen_js
   - Test install: `npm install -g mutant_test_gen_js`

## Publishing to Private Registry (Internal Use)

If using for internal team only:

### Option 1: NPM Private Packages
```bash
# Publish as private
npm publish --access restricted
```

### Option 2: GitHub Packages
```bash
# Configure registry
npm config set registry https://npm.pkg.github.com

# Publish
npm publish
```

### Option 3: Verdaccio (Self-hosted)
```bash
# Point to your registry
npm config set registry http://your-registry:4873

# Publish
npm publish
```

### Option 4: Direct Git Installation
```bash
# Users can install directly from git
npm install git+https://github.com/hoangtruonghrs/mutant_test_gen_js.git

# Or with tag
npm install git+https://github.com/hoangtruonghrs/mutant_test_gen_js.git#v1.0.0
```

## Creating GitHub Release

```bash
# Create and push tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Then create release on GitHub:
# 1. Go to: https://github.com/hoangtruonghrs/mutant_test_gen_js/releases/new
# 2. Select tag: v1.0.0
# 3. Title: v1.0.0 - Initial Release
# 4. Copy contents from CHANGELOG.md
# 5. Attach tarball (optional)
# 6. Publish release
```

## Post-Publishing

### 1. Verify Installation
```bash
# Install globally
npm install -g mutant_test_gen_js

# Check version
mutant-test-gen --version

# Test
mutant-test-gen --help
```

### 2. Update Documentation
- Update README.md if needed
- Add installation badge
- Update examples

### 3. Announce
- Post on team channels
- Update project wiki
- Send team email

## Updating After Initial Publish

### Patch Release (1.0.0 → 1.0.1)
```bash
npm version patch
git push && git push --tags
npm publish
```

### Minor Release (1.0.0 → 1.1.0)
```bash
npm version minor
git push && git push --tags
npm publish
```

### Major Release (1.0.0 → 2.0.0)
```bash
npm version major
git push && git push --tags
npm publish
```

## Troubleshooting

### "Package already exists"
- Version already published
- Bump version: `npm version patch`

### "No permission to publish"
- Check npm login: `npm whoami`
- Verify package name available
- Check organization permissions

### "Package name too similar"
- NPM may block if too similar to existing package
- Choose different name
- Add organization scope: `@yourorg/mutant-test-gen`

## Internal Distribution Only

If NOT publishing to public NPM:

1. **Share tarball**
   ```bash
   npm pack
   # Share mutant_test_gen_js-1.0.0.tgz with team
   ```

2. **Team installs from tarball**
   ```bash
   npm install -g mutant_test_gen_js-1.0.0.tgz
   ```

3. **Or install from git**
   ```bash
   npm install -g git+https://github.com/hoangtruonghrs/mutant_test_gen_js.git
   ```

## Security Notes

- Never commit `.npmrc` with auth tokens
- Use `NPM_TOKEN` environment variable in CI/CD
- Enable 2FA on npm account
- Review package contents before publishing
- Check `.npmignore` excludes sensitive files

## Checklist Before Publishing

- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] Tests passing (if applicable)
- [ ] No critical linting errors
- [ ] Documentation reviewed
- [ ] Examples tested
- [ ] README accurate
- [ ] Security audit clean
- [ ] Package size reasonable (<1MB ideally)
- [ ] All dependencies necessary
- [ ] License file included
- [ ] Author info correct

## Useful Commands

```bash
# View package info
npm view mutant_test_gen_js

# View all versions
npm view mutant_test_gen_js versions

# Unpublish (within 72 hours)
npm unpublish mutant_test_gen_js@1.0.0

# Deprecate version
npm deprecate mutant_test_gen_js@1.0.0 "Please upgrade to 1.0.1"

# Check who can publish
npm access ls-collaborators

# View download stats
npm view mutant_test_gen_js downloads
```
