# BUGS.md: {{PROJECT_NAME}}

> Managed document. Must comply with template BUGS.template.md.

<!-- APM:DATA
{
  "docType": "bugs",
  "version": {{DOC_VERSION:1}},
  "bugs": {{BUGS_JSON:0..N}},
  "mermaid": "{{MERMAID_BODY:0..1}}"
}
-->

## 1. Bug Workflow

### 1.1 Lifecycle States

- Active Lifecycle Values: `open`, `triaged`, `in_progress`, `blocked`, `fixed`, `verifying`, `regressed`
- Archived Lifecycle Values: `resolved`, `closed`

### 1.2 Active And Archived Rules

{{ACTIVE_ARCHIVE_RULES}}

## 2. Active Bugs

<!-- REPEAT {{BUG_BLOCK:0..N}} -->
### {{BUG_CODE}}: {{BUG_TITLE}}

- Lifecycle Status: {{BUG_STATUS:open|triaged|in_progress|blocked|fixed|verifying|regressed}}
- Planning Bucket: {{PLANNING_BUCKET:considered|planned|phase}}
- Severity: {{BUG_SEVERITY:low|medium|high|critical}}
- Roadmap Phase: {{ROADMAP_PHASE_ID:0..1}}
- Linked Task: {{TASK_ID:0..1}}
- Affected Modules: {{AFFECTED_MODULES:0..N}}
- Association Hints: {{ASSOCIATION_HINTS:0..N}}

#### Current Behavior

{{CURRENT_BEHAVIOR}}

#### Expected Behavior

{{EXPECTED_BEHAVIOR}}
<!-- END REPEAT BUG_BLOCK -->

## 3. Mermaid

```mermaid
{{MERMAID_BODY}}
```
