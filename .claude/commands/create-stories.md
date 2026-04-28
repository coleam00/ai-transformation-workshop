---
description: Generate Jira user stories from a PRD
argument-hint: <path-to-prd> [--project PROJECT_KEY] [--epic EPIC_KEY]
---

# Create Jira Stories from PRD

Generate structured user stories from a Product Requirements Document. When Jira MCP is configured, automatically creates the stories in Jira.

**Input**: $ARGUMENTS

---

## Phase 1: LOAD

Read the PRD file provided as input. If no path given, look for:
1. `.agents/PRDs/*.prd.md` files
2. `PRD.md` at project root
3. Ask the user which PRD to use

Extract:
- User stories already defined in the PRD
- Acceptance criteria from success criteria and requirements
- Implementation phases and their deliverables
- Technical constraints and dependencies

Parse optional flags from arguments:
- `--project` or `-p`: Jira project key (e.g., `RH`, `PROJ`)
- `--epic` or `-e`: Existing epic key to link stories to (e.g., `RH-42`)

---

## Phase 2: ANALYZE

### Break Down into Stories

For each feature or requirement in the PRD:

1. **Create a user story** in the format:
   ```
   As a [user type], I want to [action], so that [benefit]
   ```

2. **Define acceptance criteria** (3-5 per story):
   ```
   Given [context], when [action], then [expected result]
   ```

3. **Estimate complexity**: Small / Medium / Large
   - Small: Single file change, clear implementation
   - Medium: Multiple files, some design decisions
   - Large: Cross-cutting concerns, architecture changes

4. **Identify dependencies** between stories

### Story Categories

Group stories by type:
- **Feature**: New functionality (Jira type: Story)
- **Enhancement**: Improvement to existing functionality (Jira type: Story)
- **Bug**: Fix for known issues (Jira type: Bug)
- **Technical**: Infrastructure, refactoring, tooling (Jira type: Task)
- **Spike**: Research or investigation needed (Jira type: Task)

---

## Phase 3: STRUCTURE

### For Each Story, Create

```markdown
## [STORY-ID] Story Title

**Type**: Feature | Enhancement | Technical | Spike
**Jira Type**: Story | Task | Bug
**Priority**: High | Medium | Low
**Complexity**: Small | Medium | Large
**Phase**: (from PRD implementation phases)
**Labels**: (relevant labels like `frontend`, `backend`, `api`, `database`)

### Description
As a [user type], I want to [action], so that [benefit].

### Acceptance Criteria
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]
- [ ] Given [context], when [action], then [result]

### Technical Notes
- Key implementation details
- Files likely to be modified
- Patterns to follow (reference CLAUDE.md or project conventions)

### Dependencies
- Blocked by: [other story IDs]
- Blocks: [other story IDs]
```

### Ordering

Order stories by:
1. Phase (from PRD implementation phases)
2. Dependencies (blocked stories come after their blockers)
3. Priority (High first within each phase)

---

## Phase 4: VALIDATE

Before output, verify:
- [ ] Every PRD requirement maps to at least one story
- [ ] No story is too large (break down if > 1 day of work)
- [ ] Acceptance criteria are testable and specific
- [ ] Dependencies form a valid DAG (no circular dependencies)
- [ ] Stories cover the full SDLC: types, validation, services, routes, UI, tests
- [ ] Each story can be independently reviewed and merged

---

## Phase 5: OUTPUT

Create the directory if it doesn't exist: `mkdir -p .agents/stories`

Save the stories to `.agents/stories/` directory as a markdown file.

---

## Phase 6: JIRA INTEGRATION (when MCP is available)

**Check if the Atlassian MCP server is available.** Look for tools prefixed with `mcp__atlassian__` (e.g., `mcp__atlassian__createJiraIssue`, `mcp__atlassian__searchJiraIssuesUsingJql`). If available, offer to push stories directly to Jira.

### If Atlassian MCP IS available:

1. **Resolve the Cloud ID** by calling `mcp__atlassian__getAccessibleAtlassianResources` to get the site's `cloudId`. You will need this for every subsequent Jira API call.

2. **Validate the project and epic** before creating issues:
   - Call `mcp__atlassian__getJiraIssue` with the epic key (e.g., `RH-1`) to confirm it exists and is an Epic type
   - Call `mcp__atlassian__getJiraProjectIssueTypesMetadata` with the project key to confirm available issue types (typically: Story, Task, Bug, Subtask)

3. **Ask the user** before creating issues:
   ```
   I've generated {count} stories. Would you like me to create these in Jira?
   - Project: {PROJECT_KEY} (or ask if not provided via --project)
   - Epic: {EPIC_KEY} (or ask if not provided via --epic)
   ```

4. **If user confirms**, create issues in Jira using `mcp__atlassian__createJiraIssue` for each story with these parameters:
   - `cloudId`: The Cloud ID from step 1
   - `projectKey`: The project key (e.g., `RH`)
   - `issueTypeName`: Map from story category — use exactly `"Story"`, `"Task"`, or `"Bug"` (these are the available types at hierarchy level 0)
   - `summary`: Story title
   - `description`: Full description + acceptance criteria
   - `contentFormat`: `"markdown"` (so the description can use markdown formatting)
   - `parent`: The epic key (e.g., `"RH-1"`) — this links the issue under the epic as a child. In team-managed Jira projects, epics are parents of stories/tasks/bugs.
   - `additional_fields`: Use this for priority and labels, e.g.:
     ```json
     {
       "priority": { "name": "High" },
       "labels": ["frontend", "api"]
     }
     ```

5. **Add technical notes** as a comment on each created issue using `mcp__atlassian__addCommentToJiraIssue`:
   - `cloudId`: The Cloud ID
   - `issueIdOrKey`: The key of the newly created issue (e.g., `RH-5`)
   - `commentBody`: The technical notes content
   - `contentFormat`: `"markdown"`

6. **Create dependency links** between stories using `mcp__atlassian__createIssueLink`:
   - `cloudId`: The Cloud ID
   - `type`: `"Blocks"` (use `mcp__atlassian__getIssueLinkTypes` to confirm available link types)
   - `inwardIssue`: The blocking issue key
   - `outwardIssue`: The blocked issue key

7. **Report created issues**:
   ```markdown
   ## Jira Issues Created

   | Key | Title | Type | Priority |
   |-----|-------|------|----------|
   | RH-2 | Story title | Story | High |
   | RH-3 | Story title | Task | Medium |
   ...

   **Epic**: RH-1
   **Project**: RH
   **Board URL**: https://{site}.atlassian.net/jira/software/projects/{PROJECT_KEY}/board
   ```

### If Atlassian MCP is NOT available:

Output the stories as markdown only and note:
```
Atlassian MCP is not configured. To push stories to Jira automatically:
1. Get an API token from https://id.atlassian.com/manage/api-tokens
2. Configure .mcp.json with Atlassian MCP server credentials
3. Re-run this command
```

---

## Tips

- Keep stories small enough to complete in 1-2 days
- Acceptance criteria should be verifiable without asking the author
- Technical stories need acceptance criteria too (build passes, tests pass, etc.)
- Include a "definition of done" story if the team doesn't have one
- Reference the PRD section for each story so reviewers can trace back
- Use `contentFormat: "markdown"` on all create/comment calls so descriptions render properly in Jira
