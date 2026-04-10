'use client';

import { useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { SectionShell } from '@/components/ui/section-shell';
import { SurfaceCard } from '@/components/ui/surface-card';

const FIELD_TYPE_OPTIONS = [
  'integer',
  'bigint',
  'real',
  'numeric',
  'decimal',
  'text',
  'varchar',
  'char',
  'boolean',
  'date',
  'datetime',
  'timestamp',
  'json',
  'blob',
  'uuid',
];

function SchemaTextField({ label, value, onChange, placeholder, compact = false }) {
  return (
    <label className="space-y-1 text-xs text-ink/75">
      <span className="font-medium text-ink">{label}</span>
      <input
        className={[
          'w-full rounded-lg border border-white/10 bg-white/5 text-ink outline-none focus:border-accent/60',
          compact ? 'px-2.5 py-2 text-sm' : 'px-3 py-2.5 text-sm',
        ].join(' ')}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </label>
  );
}

function SchemaSelectField({ label, value, onChange, children, compact = false }) {
  return (
    <label className="space-y-1 text-xs text-ink/75">
      <span className="font-medium text-ink">{label}</span>
      <select
        className={[
          'w-full rounded-lg border border-white/10 bg-slate text-ink outline-none focus:border-accent/60',
          compact ? 'px-2.5 py-2 text-sm' : 'px-3 py-2.5 text-sm',
        ].join(' ')}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </label>
  );
}

function SchemaTextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <label className="space-y-1 text-xs text-ink/75">
      <span className="font-medium text-ink">{label}</span>
      <textarea
        rows={rows}
        placeholder={placeholder}
        className="min-h-20 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-ink outline-none focus:border-accent/60"
        value={value}
        onChange={onChange}
      />
    </label>
  );
}

function FieldFlag({ children }) {
  return <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/70">{children}</span>;
}

function driftLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized === 'in_sync') return '';
  if (normalized === 'intended_only') return 'intended only';
  if (normalized === 'observed_only') return 'observed only';
  return normalized.replace(/_/g, ' ');
}

function relationshipLabel(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'one-to-one') return '1 to 1';
  if (normalized === 'many-to-many') return '* to *';
  if (normalized === 'many-to-one') return '* to 1';
  return '1 to *';
}

function fieldReferenceSummary(relationship, entitiesById) {
  const fromEntity = entitiesById.get(relationship.fromEntityId);
  const toEntity = entitiesById.get(relationship.toEntityId);
  const fromField = fromEntity?.fields?.find((field) => field.id === relationship.fromFieldId);
  const toField = toEntity?.fields?.find((field) => field.id === relationship.toFieldId);
  const fromLabel = `${fromEntity?.name || relationship.fromEntityId || 'Unknown'}.${fromField?.name || relationship.fromFieldId || '?'}`;
  const toLabel = `${toEntity?.name || relationship.toEntityId || 'Unknown'}.${toField?.name || relationship.toFieldId || '?'}`;
  return `${fromLabel} -> ${toLabel}`;
}

function EmptyInspector({ title, body }) {
  return (
    <SurfaceCard className="p-3" tone="muted">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-6 text-ink/72">{body}</p>
    </SurfaceCard>
  );
}

export function SchemaInspectorPanel({
  selectedEntity,
  selectedEntityIndex,
  selectedRelationship,
  selectedRelationshipIndex,
  entitiesById,
  entityOptions,
  fieldOptionsByEntity,
  indexes,
  constraints,
  updateEntity,
  updateField,
  updateRelationship,
  updateIndex,
  updateConstraint,
  addFieldToSelectedEntity,
  removeFieldFromSelectedEntity,
  removeSelectedEntity,
  removeSelectedRelationship,
  addIndex,
  addConstraint,
  markSelectedEntitySeen,
  markSelectedRelationshipSeen,
  onEntityEditStart,
  onEntityEditDone,
  onRelationshipEditStart,
  onRelationshipEditDone,
  onMetadataEditStart,
  onMetadataEditDone,
}) {
  const [entityEditMode, setEntityEditMode] = useState(false);
  const [relationshipEditMode, setRelationshipEditMode] = useState(false);
  const [metadataEditMode, setMetadataEditMode] = useState(false);

  const entityFacts = useMemo(() => ({
    columns: selectedEntity?.fields?.length || 0,
    primaryKeys: (selectedEntity?.fields || []).filter((field) => field.primaryKey).length,
    required: (selectedEntity?.fields || []).filter((field) => !field.nullable).length,
  }), [selectedEntity]);

  return (
    <div className="space-y-3">
      <SectionShell
        eyebrow={selectedEntity ? 'Table Inspector' : selectedRelationship ? 'Relationship Inspector' : 'Schema Inspector'}
        title={
          selectedEntity
            ? `${selectedEntity.name || selectedEntity.id}`
            : selectedRelationship
              ? 'Selected relationship'
              : 'Select a table or relationship'
        }
        description={
          selectedEntity
            ? 'Click Edit when you want to change the selected table.'
            : selectedRelationship
              ? 'Click Edit when you want to change the selected relationship.'
              : 'Select a table or edge in the diagram to inspect it here.'
        }
        actions={selectedEntity ? (
          <div className="flex flex-wrap gap-2">
            {selectedEntity.status === 'draft' ? (
              <ActionButton size="sm" variant="ghost" onClick={markSelectedEntitySeen}>
                Seen
              </ActionButton>
            ) : null}
            <ActionButton
              size="sm"
              variant={entityEditMode ? 'subtle' : 'ghost'}
              onClick={() => {
                if (entityEditMode) {
                  const allowClose = onEntityEditDone ? onEntityEditDone() : true;
                  if (allowClose !== false) setEntityEditMode(false);
                  return;
                }
                onEntityEditStart?.(selectedEntity);
                setEntityEditMode(true);
              }}
            >
              {entityEditMode ? 'Done Editing' : 'Edit'}
            </ActionButton>
          </div>
        ) : selectedRelationship ? (
          <div className="flex flex-wrap gap-2">
            {selectedRelationship.status === 'draft' ? (
              <ActionButton size="sm" variant="ghost" onClick={markSelectedRelationshipSeen}>
                Seen
              </ActionButton>
            ) : null}
            <ActionButton
              size="sm"
              variant={relationshipEditMode ? 'subtle' : 'ghost'}
              onClick={() => {
                if (relationshipEditMode) {
                  const allowClose = onRelationshipEditDone ? onRelationshipEditDone() : true;
                  if (allowClose !== false) setRelationshipEditMode(false);
                  return;
                }
                onRelationshipEditStart?.(selectedRelationship);
                setRelationshipEditMode(true);
              }}
            >
              {relationshipEditMode ? 'Done Editing' : 'Edit'}
            </ActionButton>
          </div>
        ) : null}
      >
        {selectedEntity ? (
          entityEditMode ? (
            <div className="space-y-2.5">
              <div className="grid gap-3 md:grid-cols-2">
                <SchemaTextField
                  label="Entity name"
                  value={selectedEntity.name}
                  placeholder="projects"
                  compact
                  onChange={(event) => updateEntity(selectedEntityIndex, { name: event.target.value })}
                />
                <SchemaTextField
                  label="Kind"
                  value={selectedEntity.kind}
                  placeholder="table"
                  compact
                  onChange={(event) => updateEntity(selectedEntityIndex, { kind: event.target.value })}
                />
              </div>
              <SchemaTextArea
                label="Notes"
                value={selectedEntity.notes}
                placeholder="Describe the purpose and lifecycle of this table."
                rows={3}
                onChange={(event) => updateEntity(selectedEntityIndex, { notes: event.target.value })}
              />
              <div className="space-y-2">
                {(selectedEntity.fields || []).map((field, fieldIndex) => (
                  <SurfaceCard key={field.id} className="p-2.5" tone="muted">
                    <div className="grid gap-2 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
                      <SchemaTextField
                        label="Column"
                        value={field.name}
                        placeholder="id"
                        compact
                        onChange={(event) => updateField(selectedEntityIndex, fieldIndex, { name: event.target.value })}
                      />
                      <SchemaSelectField
                        label="Type"
                        value={field.type}
                        compact
                        onChange={(event) => updateField(selectedEntityIndex, fieldIndex, { type: event.target.value })}
                      >
                        {FIELD_TYPE_OPTIONS.map((type) => <option key={type} value={type}>{type}</option>)}
                      </SchemaSelectField>
                      <SchemaTextField
                        label="Default"
                        value={field.defaultValue}
                        placeholder="CURRENT_TIMESTAMP"
                        compact
                        onChange={(event) => updateField(selectedEntityIndex, fieldIndex, { defaultValue: event.target.value })}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink/72">
                      <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={field.nullable} onChange={(event) => updateField(selectedEntityIndex, fieldIndex, { nullable: event.target.checked })} /> Nullable</label>
                      <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={field.primaryKey} onChange={(event) => updateField(selectedEntityIndex, fieldIndex, { primaryKey: event.target.checked })} /> Primary key</label>
                      <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={field.unique} onChange={(event) => updateField(selectedEntityIndex, fieldIndex, { unique: event.target.checked })} /> Unique</label>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <ActionButton size="sm" variant="subtle" onClick={() => removeFieldFromSelectedEntity(fieldIndex)}>
                        Remove
                      </ActionButton>
                    </div>
                  </SurfaceCard>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <ActionButton size="sm" variant="ghost" onClick={addFieldToSelectedEntity}>Add column</ActionButton>
                <ActionButton size="sm" variant="subtle" onClick={removeSelectedEntity}>Remove table</ActionButton>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <SurfaceCard className="p-2.5" tone="muted">
                <div className="flex flex-wrap gap-2">
                  <FieldFlag>{selectedEntity.kind || 'table'}</FieldFlag>
                  <FieldFlag>{entityFacts.columns} columns</FieldFlag>
                  <FieldFlag>{entityFacts.primaryKeys} pk</FieldFlag>
                  <FieldFlag>{entityFacts.required} required</FieldFlag>
                  {selectedEntity.status === 'draft' ? <FieldFlag>New</FieldFlag> : null}
                  {driftLabel(selectedEntity.driftStatus) ? <FieldFlag>{driftLabel(selectedEntity.driftStatus)}</FieldFlag> : null}
                </div>
                {selectedEntity.notes ? (
                  <p className="mt-2 text-sm leading-6 text-ink/74">{selectedEntity.notes}</p>
                ) : null}
              </SurfaceCard>
              <div className="space-y-2">
                {(selectedEntity.fields || []).map((field) => (
                  <SurfaceCard key={field.id} className="p-2.5" tone="muted">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold leading-5 text-ink">{field.name || field.id}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.14em] text-ink/62">{field.type || 'text'}</p>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {field.primaryKey ? <FieldFlag>PK</FieldFlag> : null}
                        {field.unique ? <FieldFlag>UK</FieldFlag> : null}
                        {!field.nullable ? <FieldFlag>NN</FieldFlag> : null}
                        {driftLabel(field.driftStatus) ? <FieldFlag>{driftLabel(field.driftStatus)}</FieldFlag> : null}
                      </div>
                    </div>
                    {field.defaultValue ? (
                      <p className="mt-2 text-xs text-ink/65">Default: {field.defaultValue}</p>
                    ) : null}
                  </SurfaceCard>
                ))}
              </div>
            </div>
          )
        ) : null}

        {selectedRelationship ? (
          relationshipEditMode ? (
            <div className="space-y-3">
              <SurfaceCard className="p-2.5" tone="muted">
                <p className="text-sm leading-6 text-ink">{fieldReferenceSummary(selectedRelationship, entitiesById)}</p>
              </SurfaceCard>
              <div className="grid gap-2 md:grid-cols-2">
                <SchemaSelectField
                  label="From table"
                  value={selectedRelationship.fromEntityId}
                  compact
                  onChange={(event) => updateRelationship(selectedRelationshipIndex, { fromEntityId: event.target.value, fromFieldId: '' })}
                >
                  <option value="">Select entity</option>
                  {entityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </SchemaSelectField>
                <SchemaSelectField
                  label="From column"
                  value={selectedRelationship.fromFieldId}
                  compact
                  onChange={(event) => updateRelationship(selectedRelationshipIndex, { fromFieldId: event.target.value })}
                >
                  <option value="">Select field</option>
                  {(fieldOptionsByEntity.get(selectedRelationship.fromEntityId) || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </SchemaSelectField>
                <SchemaSelectField
                  label="To table"
                  value={selectedRelationship.toEntityId}
                  compact
                  onChange={(event) => updateRelationship(selectedRelationshipIndex, { toEntityId: event.target.value, toFieldId: '' })}
                >
                  <option value="">Select entity</option>
                  {entityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </SchemaSelectField>
                <SchemaSelectField
                  label="To column"
                  value={selectedRelationship.toFieldId}
                  compact
                  onChange={(event) => updateRelationship(selectedRelationshipIndex, { toFieldId: event.target.value })}
                >
                  <option value="">Select field</option>
                  {(fieldOptionsByEntity.get(selectedRelationship.toEntityId) || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </SchemaSelectField>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <SchemaSelectField
                  label="Cardinality"
                  value={selectedRelationship.cardinality}
                  compact
                  onChange={(event) => updateRelationship(selectedRelationshipIndex, { cardinality: event.target.value })}
                >
                  <option value="one-to-one">one-to-one</option>
                  <option value="one-to-many">one-to-many</option>
                  <option value="many-to-one">many-to-one</option>
                  <option value="many-to-many">many-to-many</option>
                </SchemaSelectField>
                <ActionButton size="sm" variant="subtle" className="self-end" onClick={removeSelectedRelationship}>
                  Remove
                </ActionButton>
              </div>
              <SchemaTextArea
                label="Notes"
                value={selectedRelationship.notes}
                placeholder="Describe why this reference exists."
                rows={3}
                onChange={(event) => updateRelationship(selectedRelationshipIndex, { notes: event.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <SurfaceCard className="p-2.5" tone="muted">
                <div className="flex flex-wrap gap-2">
                  <FieldFlag>{relationshipLabel(selectedRelationship.cardinality)}</FieldFlag>
                  {selectedRelationship.status === 'draft' ? <FieldFlag>New</FieldFlag> : null}
                  {driftLabel(selectedRelationship.driftStatus) ? <FieldFlag>{driftLabel(selectedRelationship.driftStatus)}</FieldFlag> : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-ink">{fieldReferenceSummary(selectedRelationship, entitiesById)}</p>
                {selectedRelationship.notes ? (
                  <p className="mt-2 text-sm leading-6 text-ink/72">{selectedRelationship.notes}</p>
                ) : null}
              </SurfaceCard>
            </div>
          )
        ) : null}

        {!selectedEntity && !selectedRelationship ? (
          <EmptyInspector
            title="Start from the diagram"
            body="Select a table to inspect its columns, or click a relationship edge to inspect its reference endpoints and cardinality."
          />
        ) : null}
      </SectionShell>

      <SectionShell
        eyebrow="Indexes and Constraints"
        title="Supporting schema metadata"
        description="These stay part of the saved schema model and remain available below the diagram."
        actions={(
          <div className="flex flex-wrap gap-2">
            <ActionButton
              size="sm"
              variant={metadataEditMode ? 'subtle' : 'ghost'}
              onClick={() => {
                if (metadataEditMode) {
                  const allowClose = onMetadataEditDone ? onMetadataEditDone() : true;
                  if (allowClose !== false) setMetadataEditMode(false);
                  return;
                }
                onMetadataEditStart?.();
                setMetadataEditMode(true);
              }}
            >
              {metadataEditMode ? 'Done Editing' : 'Edit'}
            </ActionButton>
            {metadataEditMode ? (
              <>
                <ActionButton size="sm" variant="ghost" onClick={addIndex}>Add index</ActionButton>
                <ActionButton size="sm" variant="ghost" onClick={addConstraint}>Add constraint</ActionButton>
              </>
            ) : null}
          </div>
        )}
      >
        <div className="space-y-2">
          {indexes.map((item, index) => (
            metadataEditMode ? (
              <SurfaceCard key={item.id} className="p-2.5" tone="muted">
                <div className="grid gap-2 md:grid-cols-2">
                  <SchemaTextField
                    label="Index name"
                    value={item.name}
                    placeholder="idx_projects_name"
                    compact
                    onChange={(event) => updateIndex(index, { name: event.target.value })}
                  />
                  <SchemaSelectField
                    label="Table"
                    value={item.entityId}
                    compact
                    onChange={(event) => updateIndex(index, { entityId: event.target.value })}
                  >
                    <option value="">Select entity</option>
                    {entityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </SchemaSelectField>
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard key={item.id} className="p-2.5" tone="muted">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-5 text-ink">{item.name || item.id}</p>
                    <p className="mt-1 text-xs text-ink/65">
                      {entityOptions.find((option) => option.value === item.entityId)?.label || item.entityId || 'Unassigned table'}
                      {Array.isArray(item.fields) && item.fields.length ? ` | ${item.fields.join(', ')}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.unique ? <FieldFlag>Unique</FieldFlag> : null}
                    {item.status ? <FieldFlag>{item.status}</FieldFlag> : null}
                    {driftLabel(item.driftStatus) ? <FieldFlag>{driftLabel(item.driftStatus)}</FieldFlag> : null}
                  </div>
                </div>
              </SurfaceCard>
            )
          ))}
          {constraints.map((item, index) => (
            metadataEditMode ? (
              <SurfaceCard key={item.id} className="p-2.5" tone="muted">
                <div className="grid gap-2 md:grid-cols-2">
                  <SchemaTextField
                    label="Constraint name"
                    value={item.name}
                    placeholder="chk_status"
                    compact
                    onChange={(event) => updateConstraint(index, { name: event.target.value })}
                  />
                  <SchemaTextField
                    label="Type"
                    value={item.type}
                    placeholder="check"
                    compact
                    onChange={(event) => updateConstraint(index, { type: event.target.value })}
                  />
                </div>
                <div className="mt-2">
                  <SchemaTextArea
                    label="Definition"
                    value={item.definition}
                    rows={2}
                    onChange={(event) => updateConstraint(index, { definition: event.target.value })}
                  />
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard key={item.id} className="p-2.5" tone="muted">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-5 text-ink">{item.name || item.id}</p>
                    <p className="mt-1 text-xs text-ink/65">{item.type || 'constraint'}</p>
                    {item.definition ? (
                      <p className="mt-1 break-words text-xs leading-5 text-ink/72">{item.definition}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {item.status ? <FieldFlag>{item.status}</FieldFlag> : null}
                    {driftLabel(item.driftStatus) ? <FieldFlag>{driftLabel(item.driftStatus)}</FieldFlag> : null}
                  </div>
                </div>
              </SurfaceCard>
            )
          ))}
          {!indexes.length && !constraints.length ? (
            <EmptyInspector
              title="No supporting metadata yet"
              body="Add indexes or constraints after shaping the main table relationships in the diagram."
            />
          ) : null}
        </div>
      </SectionShell>
    </div>
  );
}
