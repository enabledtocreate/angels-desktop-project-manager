# Change Log Template

> Template Contract. Keep filename `CHANGELOG.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template CHANGELOG.template.md.

## 1. Template Contract Metadata

- Template Name: `CHANGELOG.template.md`
- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Kind: `document`
- Owning Module: `Change Log`
- Generated Artifact: `CHANGELOG.md`

## 2. Template Fill-In Slots

- `{{PROJECT_NAME}}`

## 3. Actual Template

```md
# CHANGELOG.md: {{PROJECT_NAME}}

> Managed document. Must comply with template CHANGELOG.template.md.
```

## 4. Version / Migration Notes

- Version `1.4` converts the template into a fill-in contract and moves construction guidance into the paired module AI file.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
