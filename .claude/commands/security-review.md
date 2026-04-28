---
description: Security review of code changes
argument-hint: [file-or-directory]
---

# Security Review

Perform a security-focused code review on the specified files, directory, or staged changes.

**Input**: $ARGUMENTS (defaults to staged git changes if no path provided)

---

## Phase 1: SCOPE

Determine what to review:

1. If a file path is given, review that file
2. If a directory is given, review all source files in it
3. If no input, review staged git changes: `git diff --cached --name-only`
4. If nothing staged, review unstaged changes: `git diff --name-only`

Identify the file types and frameworks involved to focus the review.

---

## Phase 2: ANALYZE

### Check Each Category

Review the code against these security categories, focusing on what's actually relevant to the changes:

#### 1. Injection Vulnerabilities
- **SQL Injection**: Raw SQL queries with string concatenation or template literals
- **Command Injection**: `exec()`, `spawn()`, or `child_process` with user input
- **XSS**: Unescaped user input in HTML/JSX, `dangerouslySetInnerHTML`
- **NoSQL Injection**: Unsanitized query objects passed to MongoDB/similar
- **Path Traversal**: User input in file paths without sanitization

#### 2. Authentication & Authorization
- Missing auth checks on protected routes
- Hardcoded credentials, tokens, or API keys
- Insecure session management
- Missing CSRF protection on state-changing endpoints
- Overly permissive CORS configuration

#### 3. Data Exposure
- Sensitive data in logs (passwords, tokens, PII)
- API responses leaking internal data (stack traces, DB schemas)
- Secrets in source code or config files
- Missing input validation on API boundaries

#### 4. Dependency & Configuration
- Known vulnerable dependencies (check package.json versions)
- Insecure default configurations
- Missing security headers
- Debug mode enabled in production configs

#### 5. Cryptography
- Weak hashing algorithms (MD5, SHA1 for passwords)
- Hardcoded encryption keys
- Insecure random number generation for security-sensitive values
- Missing HTTPS enforcement

#### 6. Error Handling
- Verbose error messages exposing internals
- Unhandled promise rejections that could crash the server
- Missing error boundaries
- Catch blocks that swallow errors silently

---

## Phase 3: REPORT

For each finding, report:

```markdown
### [SEVERITY] Finding Title

**Category**: Injection | Auth | Data Exposure | Dependency | Crypto | Error Handling
**Severity**: Critical | High | Medium | Low | Info
**File**: `path/to/file.ts:LINE`

**Issue**: What the problem is (1-2 sentences)

**Risk**: What could go wrong (1-2 sentences)

**Fix**:
```language
// Suggested fix
```

**Reference**: Link to OWASP or relevant security guidance
```

### Severity Definitions

| Severity | Meaning | Action |
|----------|---------|--------|
| Critical | Exploitable vulnerability, data breach risk | Block merge, fix immediately |
| High | Significant security weakness | Fix before merge |
| Medium | Defense-in-depth issue | Fix soon, OK to merge with tracking |
| Low | Best practice deviation | Address when convenient |
| Info | Observation, no immediate risk | Consider for future improvement |

---

## Phase 4: SUMMARY

```markdown
## Security Review Complete

**Scope**: {files reviewed}
**Findings**: {total count}

| Severity | Count |
|----------|-------|
| Critical | {n} |
| High     | {n} |
| Medium   | {n} |
| Low      | {n} |
| Info     | {n} |

### Verdict
{PASS | PASS WITH NOTES | FAIL}

### Action Items
1. {Most important fix}
2. {Second most important}
3. ...

### What Looks Good
- {Positive security patterns observed}
```

---

## Tips

- Focus on the actual changes, not pre-existing issues (unless they're Critical)
- Be specific: include file paths and line numbers
- Suggest fixes, don't just flag problems
- Consider the context: internal tool vs public-facing API changes the risk
- When reviewing dependencies, check for known CVEs
- Flag patterns that could become problems at scale even if safe now
