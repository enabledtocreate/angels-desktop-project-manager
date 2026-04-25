# DATABASE_SCHEMA Template

> Template Contract. Keep filename `DATABASE_SCHEMA.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template DATABASE_SCHEMA.template.md.

## 1. Template Contract Metadata

- Template Name: `DATABASE_SCHEMA.template.md`
- Template Version: `1.4`
- Last Updated: `2026-04-25`
- Template Kind: `document`
- Owning Module: `Database Schema`
- Generated Artifact: `DATABASE_SCHEMA.md`

## 2. Template Fill-In Slots

- `{{PROJECT_NAME}}`
- `{{SCHEMA_PURPOSE}}`
- `{{STORAGE_STRATEGY}}`
- `{{ENTITY_DESCRIPTION}}`

## 3. Actual Template

```md
# DATABASE_SCHEMA.md: {{PROJECT_NAME}}

> Managed document. Must comply with template DATABASE_SCHEMA.template.md.
```

## 4. Version / Migration Notes

- Version `1.4` converts the template into a fill-in contract and moves construction guidance into the paired module AI file.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
