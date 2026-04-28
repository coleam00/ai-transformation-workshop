---
description: Create a comprehensive Product Requirements Document from conversation context
argument-hint: [output-filename]
---

# Create PRD: Generate Product Requirements Document

## Overview

Generate a comprehensive Product Requirements Document (PRD) based on the current conversation context and requirements discussed. Use the structure and sections defined below to create a thorough, professional PRD.

**Output file name**: $ARGUMENTS (default filename: `PRD.md`)

## Output File

Write the PRD to the input filename. Save it in `.agents/PRDs/` directory.

## PRD Structure

Create a well-structured PRD with the following sections. Adapt depth and detail based on available information:

### Required Sections

**1. Executive Summary**
- Concise product overview (2-3 paragraphs)
- Core value proposition
- MVP goal statement

**2. Mission**
- Product mission statement
- Core principles (3-5 key principles)

**3. Target Users**
- Primary user personas
- Technical comfort level
- Key user needs and pain points

**4. MVP Scope**
- **In Scope:** Core functionality for MVP (use checkboxes)
- **Out of Scope:** Features deferred to future phases (use checkboxes)
- Group by categories (Core Functionality, Technical, Integration, Deployment)

**5. User Stories**
- Primary user stories (5-8 stories) in format: "As a [user], I want to [action], so that [benefit]"
- Include concrete examples for each story
- Add technical user stories if relevant

**6. Core Architecture & Patterns**
- High-level architecture approach
- Directory structure (if applicable)
- Key design patterns and principles
- Technology-specific patterns

**7. Tools/Features**
- Detailed feature specifications
- If building an agent: Tool designs with purpose, operations, and key features
- If building an app: Core feature breakdown

**8. Technology Stack**
- Backend/Frontend technologies with versions
- Dependencies and libraries
- Optional dependencies
- Third-party integrations

**9. Security & Configuration**
- Authentication/authorization approach
- Configuration management (environment variables, settings)
- Security scope (in-scope and out-of-scope)
- Deployment considerations

**10. API Specification** (if applicable)
- Endpoint definitions
- Request/response formats
- Authentication requirements
- Example payloads

**11. Success Criteria**
- MVP success definition
- Functional requirements (use checkboxes)
- Quality indicators
- User experience goals

**12. Implementation Phases**
- Break down into 3-4 phases
- Each phase includes: Goal, Deliverables (checkboxes), Validation criteria
- Realistic timeline estimates

**13. Future Considerations**
- Post-MVP enhancements
- Integration opportunities
- Advanced features for later phases

**14. Risks & Mitigations**
- 3-5 key risks with specific mitigation strategies

**15. Appendix** (if applicable)
- Related documents
- Key dependencies with links
- Repository/project structure

---

## Process

### Phase 1: EXTRACT

- Review the entire conversation history
- Identify explicit requirements and implicit needs
- Note technical constraints and preferences
- Capture user goals and success criteria

**If critical information is missing**, ask clarifying questions before generating.

**Wait for user response if questions are needed.**

---

### Phase 2: SYNTHESIZE

- Organize requirements into appropriate sections
- Fill in reasonable assumptions where details are missing
- Maintain consistency across sections
- Ensure technical feasibility

---

### Phase 3: GENERATE

Write the PRD using:
- Clear, professional language
- Concrete examples and specifics
- Markdown formatting (headings, lists, code blocks, checkboxes)
- Code snippets for technical sections where helpful
- Concise but comprehensive Executive Summary

---

### Phase 4: VALIDATE

Quality checks before output:
- All required sections present
- User stories have clear benefits
- MVP scope is realistic and well-defined
- Technology choices are justified
- Implementation phases are actionable
- Success criteria are measurable
- Consistent terminology throughout

---

## Phase 5: OUTPUT

After creating the PRD:

```markdown
## PRD Created

**File**: `{output-path}`

**Product**: {Product name}
**Problem**: {One line}
**Solution**: {One line}

### Sections Summary
- {Count} user stories defined
- {Count} MVP features in scope
- {Count} implementation phases
- {Count} risks identified

### Assumptions Made
{List any assumptions due to missing information, or "None"}

### Recommended Next Steps
1. Review and refine the PRD with stakeholders
2. Validate assumptions with target users
3. Create implementation plan: `/plan {prd-path}`
4. Begin Phase 1 implementation
```

---

## Style Guidelines

- **Tone:** Professional, clear, action-oriented
- **Format:** Use markdown extensively (headings, lists, code blocks, tables)
- **Specificity:** Prefer concrete examples over abstract descriptions
- **Length:** Comprehensive but scannable
- For highly technical products, emphasize architecture and technical stack
- For user-facing products, emphasize user stories and experience
