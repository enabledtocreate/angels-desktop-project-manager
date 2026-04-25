# FEATURES Template

> Template Contract. Keep filename `FEATURES.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template FEATURES.template.md.

## 1. Template Contract Metadata

- Template Name: `FEATURES.template.md`
- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Kind: `document`
- Owning Module: `Features`
- Generated Artifact: `FEATURES.md`

## 2. Template Fill-In Slots

- `{{PROJECT_NAME}}`

## 3. Actual Template

```md
# FEATURES.md: {{PROJECT_NAME}}

> Managed document. Must comply with template FEATURES.template.md.
```

## 4. Version / Migration Notes

- Version `1.4` converts the template into a fill-in contract and moves construction guidance into the paired module AI file.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
