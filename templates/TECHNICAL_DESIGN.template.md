# Technical Design

> Template Contract. Keep filename `TECHNICAL_DESIGN.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template TECHNICAL_DESIGN.template.md.

## 1. Template Contract Metadata

- Template Name: `TECHNICAL_DESIGN.template.md`
- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Kind: `document`
- Owning Module: `Technical Design`
- Generated Artifact: `TECHNICAL_DESIGN.md`

## 2. Template Fill-In Slots

- `{{PROJECT_NAME}}`

## 3. Actual Template

```md
# TECHNICAL_DESIGN.md: {{PROJECT_NAME}}

> Managed document. Must comply with template TECHNICAL_DESIGN.template.md.
```

## 4. Version / Migration Notes

- Version `1.4` converts the template into a fill-in contract and moves construction guidance into the paired module AI file.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
