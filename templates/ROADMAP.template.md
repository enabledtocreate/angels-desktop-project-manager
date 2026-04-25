# ROADMAP Template

> Template Contract. Keep filename `ROADMAP.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template ROADMAP.template.md.

## 1. Template Contract Metadata

- Template Name: `ROADMAP.template.md`
- Template Version: `2.5`
- Last Updated: `2026-04-25`
- Template Kind: `document`
- Owning Module: `Roadmap`
- Generated Artifact: `ROADMAP.md`

## 2. Template Fill-In Slots

- `{{PROJECT_NAME}}`
- `{{PHASE_CODE}}`
- `{{PHASE_NAME}}`
- `{{PHASE_GOAL}}`
- `{{PHASE_STATUS}}`
- `{{PHASE_TARGET_DATE}}`
- `{{PHASE_SUMMARY}}`
- `{{FEATURE_ID}}`
- `{{FEATURE_TITLE}}`
- `{{FEATURE_STATUS}}`
- `{{EXECUTIVE_SUMMARY}}`
- `{{TASK_TITLE}}`
- `{{TASK_STATUS}}`

## 3. Actual Template

```md
# ROADMAP.md: {{PROJECT_NAME}}

> Managed document. Must comply with template ROADMAP.template.md.
```

## 4. Version / Migration Notes

- Version `2.5` converts the template into a fill-in contract and moves construction guidance into the paired module AI file.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
