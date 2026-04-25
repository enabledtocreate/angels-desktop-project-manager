# TECHNICAL_DESIGN_FRAGMENT.template.md

> Template Contract. Keep filename `TECHNICAL_DESIGN_FRAGMENT.template.md`; APM discovers and syncs templates by this name.
> Managed document. Must comply with template TECHNICAL_DESIGN_FRAGMENT.template.md.

## 1. Template Contract Metadata

- Template Name: `TECHNICAL_DESIGN_FRAGMENT.template.md`
- Template Version: `1.5`
- Last Updated: `2026-04-25`
- Template Kind: `fragment`
- Owning Module: `Technical Design`
- Generated Artifact: `TECHNICAL_DESIGN_FRAGMENT_*.md`

## 2. Template Fill-In Slots

- No uppercase mustache fill-in slots are currently defined in this template.

## 3. Actual Template

```json
[
  {
    "operation": "add",
    "targetSection": "open-questions",
    "item": {
      "title": "Example question",
      "description": "Replace this with a module-specific unresolved question."
    },
    "sourceRefs": ["FEAT-000"]
  }
]
```

## 4. Version / Migration Notes

- Version `1.5` converts the template into a fill-in contract and moves construction guidance into the paired module AI file.
- Fragment consumers must migrate older payload versions through explicit migrators before listing or consumption.
