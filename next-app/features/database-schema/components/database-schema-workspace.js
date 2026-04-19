'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { AiInstructionsPanel } from '@/components/ui/ai-instructions-panel';
import { DocumentFieldMeta } from '@/components/ui/document-field-meta';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { FragmentBrowserModal } from '@/components/ui/fragment-browser-modal';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { SchemaInspectorPanel } from '@/features/database-schema/components/schema-inspector-panel';
import { SchemaVisualizer } from '@/features/database-schema/components/schema-visualizer';
import { useDatabaseSchema } from '@/features/database-schema/hooks/use-database-schema';
import { useProjectWorkItemLookup } from '@/hooks/use-project-work-item-lookup';
import { countActiveFragments } from '@/lib/fragment-utils';

function createField() {
  return {
    id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    type: 'text',
    nullable: true,
    primaryKey: false,
    unique: false,
    defaultValue: '',
    referencesEntityId: '',
    referencesFieldId: '',
    status: 'draft',
    changeState: 'added',
    notes: '',
  };
}

function createEntity() {
  return {
    id: `entity-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    kind: 'table',
    status: 'draft',
    changeState: 'added',
    notes: '',
    fields: [createField()],
  };
}

function createRelationship() {
  return {
    id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fromEntityId: '',
    fromFieldId: '',
    toEntityId: '',
    toFieldId: '',
    cardinality: 'one-to-many',
    status: 'draft',
    changeState: 'added',
    notes: '',
  };
}

function createIndex() {
  return {
    id: `idx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entityId: '',
    name: '',
    fields: [],
    unique: false,
    status: 'draft',
    changeState: 'added',
    notes: '',
  };
}

function createConstraint() {
  return {
    id: `cons-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    entityId: '',
    name: '',
    type: 'check',
    definition: '',
    status: 'draft',
    changeState: 'added',
    notes: '',
  };
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function nextChangeState(currentState, fallback = 'modified') {
  if (currentState === 'added' || currentState === 'deleted') return currentState;
  return fallback;
}

function normalizeField(field) {
  const base = field && typeof field === 'object' ? field : {};
  return {
    ...createField(),
    ...base,
    id: base.id || createField().id,
    changeState: base.changeState || (base.status === 'draft' ? 'added' : ''),
    fields: undefined,
  };
}

function normalizeEntity(entity) {
  const base = entity && typeof entity === 'object' ? entity : {};
  return {
    ...createEntity(),
    ...base,
    id: base.id || createEntity().id,
    changeState: base.changeState || (base.status === 'draft' ? 'added' : ''),
    position: base.position && Number.isFinite(Number(base.position.x)) && Number.isFinite(Number(base.position.y))
      ? { x: Number(base.position.x), y: Number(base.position.y) }
      : null,
    fields: Array.isArray(base.fields) && base.fields.length ? base.fields.map((field) => normalizeField(field)) : [createField()],
  };
}

function normalizeRelationship(item) {
  const base = item && typeof item === 'object' ? item : {};
  return { ...createRelationship(), ...base, id: base.id || createRelationship().id, changeState: base.changeState || (base.status === 'draft' ? 'added' : '') };
}

function normalizeIndex(item) {
  const base = item && typeof item === 'object' ? item : {};
  return {
    ...createIndex(),
    ...base,
    id: base.id || createIndex().id,
    changeState: base.changeState || (base.status === 'draft' ? 'added' : ''),
    fields: Array.isArray(base.fields) ? base.fields.filter(Boolean) : [],
  };
}

function normalizeConstraint(item) {
  const base = item && typeof item === 'object' ? item : {};
  return { ...createConstraint(), ...base, id: base.id || createConstraint().id, changeState: base.changeState || (base.status === 'draft' ? 'added' : '') };
}

function formatSyncLabel(value, fallback = 'Unknown') {
  const labels = {
    in_sync: 'In Sync',
    intended_ahead: 'Intended Ahead',
    observed_ahead: 'Observed Ahead',
    version_match_content_mismatch: 'Version Match, Content Mismatch',
    partial_mismatch: 'Partial Mismatch',
    unverified: 'Unverified',
    none: 'No Action Required',
    comparison_required: 'Comparison Required',
    migration_required: 'Migration Required',
    documentation_update_required: 'Documentation Update Required',
    manual_reconciliation_required: 'Manual Reconciliation Required',
    observation_required: 'Observed Capture Required',
    documentation_required: 'Intended Documentation Required',
    capture_or_compare: 'Capture or Compare',
    capture_runtime_schema: 'Capture Runtime Schema',
    define_intended_schema: 'Define Intended Schema',
    apply_intended_to_runtime: 'Apply Intended to Runtime',
    reconcile_runtime_to_intended: 'Reconcile Runtime to Intended',
    review_drift_and_reconcile: 'Review Drift and Reconcile',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    intended_edit: 'Intended Edit',
    observed_import: 'Observed Import',
    migration_applied: 'Migration Applied',
    unknown: 'Unknown',
  };
  return labels[String(value || '')] || String(value || fallback).replace(/_/g, ' ');
}

function syncToneForStatus(syncStatus, driftSeverity) {
  if (syncStatus === 'in_sync') return 'foundation';
  if (driftSeverity === 'high' || driftSeverity === 'critical' || syncStatus === 'version_match_content_mismatch' || syncStatus === 'partial_mismatch') {
    return 'caution';
  }
  return 'migration';
}

function saveToneForStatus(saveStatus) {
  if (saveStatus === 'error') return 'caution';
  if (saveStatus === 'saved') return 'foundation';
  return 'migration';
}

function finalizeSchemaModelChanges(state) {
  const next = normalizeEditorState(state);
  next.schemaModel.entities = next.schemaModel.entities
    .filter((entity) => entity.changeState !== 'deleted')
    .map((entity) => ({
      ...entity,
      fields: (entity.fields || []).filter((field) => field.changeState !== 'deleted'),
    }));
  next.schemaModel.relationships = next.schemaModel.relationships.filter((item) => item.changeState !== 'deleted');
  next.schemaModel.indexes = next.schemaModel.indexes.filter((item) => item.changeState !== 'deleted');
  next.schemaModel.constraints = next.schemaModel.constraints.filter((item) => item.changeState !== 'deleted');
  return next;
}

function appendSchemaChangeLog(state, title, changeLines) {
  const next = normalizeEditorState(state);
  const now = new Date().toISOString();
  const description = changeLines.filter(Boolean).join('\n');
  const detailEntry = {
    title,
    description,
    versionDate: now,
  };
  next.migrations = [...(Array.isArray(next.migrations) ? next.migrations : []), detailEntry];
  next.schemaModel.migrationNotes = [
    ...(Array.isArray(next.schemaModel.migrationNotes) ? next.schemaModel.migrationNotes : []),
    {
      title,
      description,
      status: 'confirmed',
    },
  ];
  return next;
}

function normalizeEditorState(editorState) {
  const base = editorState && typeof editorState === 'object' ? editorState : {};
  const schemaModel = base.schemaModel && typeof base.schemaModel === 'object' ? base.schemaModel : {};
  const syncTracking = base.syncTracking && typeof base.syncTracking === 'object' ? base.syncTracking : {};
  return {
    ...base,
    overview: {
      purpose: base.overview?.purpose || '',
      storageStrategy: base.overview?.storageStrategy || '',
      itemIds: {
        purpose: base.overview?.itemIds?.purpose || '',
        storageStrategy: base.overview?.itemIds?.storageStrategy || '',
      },
      itemSourceRefs: {
        purpose: Array.isArray(base.overview?.itemSourceRefs?.purpose) ? base.overview.itemSourceRefs.purpose : [],
        storageStrategy: Array.isArray(base.overview?.itemSourceRefs?.storageStrategy) ? base.overview.itemSourceRefs.storageStrategy : [],
      },
      versionDate: base.overview?.versionDate || new Date().toISOString(),
    },
    importSource: base.importSource || null,
    observedSchemaModel: base.observedSchemaModel && typeof base.observedSchemaModel === 'object' ? base.observedSchemaModel : null,
    syncTracking: {
      intendedVersion: Number.isFinite(Number(syncTracking.intendedVersion)) ? Number(syncTracking.intendedVersion) : 0,
      observedVersion: Number.isFinite(Number(syncTracking.observedVersion)) ? Number(syncTracking.observedVersion) : 0,
      intendedHash: String(syncTracking.intendedHash || ''),
      observedHash: String(syncTracking.observedHash || ''),
      syncStatus: String(syncTracking.syncStatus || 'unverified'),
      driftSeverity: String(syncTracking.driftSeverity || 'low'),
      changeSource: String(syncTracking.changeSource || 'unknown'),
      pendingMigrationStatus: String(syncTracking.pendingMigrationStatus || 'comparison_required'),
      recommendedAction: String(syncTracking.recommendedAction || 'capture_or_compare'),
      actionSummary: String(syncTracking.actionSummary || 'Capture an observed schema or define the intended schema to begin tracking drift.'),
      lastComparedAt: String(syncTracking.lastComparedAt || ''),
      intendedUpdatedAt: String(syncTracking.intendedUpdatedAt || ''),
      observedCapturedAt: String(syncTracking.observedCapturedAt || ''),
      driftSummary: String(syncTracking.driftSummary || 'No schema comparison has been recorded yet.'),
      driftDetails: {
        entities: Array.isArray(syncTracking.driftDetails?.entities) ? syncTracking.driftDetails.entities : [],
        relationships: Array.isArray(syncTracking.driftDetails?.relationships) ? syncTracking.driftDetails.relationships : [],
        indexes: Array.isArray(syncTracking.driftDetails?.indexes) ? syncTracking.driftDetails.indexes : [],
        constraints: Array.isArray(syncTracking.driftDetails?.constraints) ? syncTracking.driftDetails.constraints : [],
      },
      actionItems: Array.isArray(syncTracking.actionItems) ? syncTracking.actionItems : [],
      auditHistory: Array.isArray(syncTracking.auditHistory) ? syncTracking.auditHistory : [],
    },
    entities: Array.isArray(base.entities) ? base.entities : [],
    relationships: Array.isArray(base.relationships) ? base.relationships : [],
    constraints: Array.isArray(base.constraints) ? base.constraints : [],
    indexes: Array.isArray(base.indexes) ? base.indexes : [],
    migrations: Array.isArray(base.migrations) ? base.migrations : [],
    synchronizationRules: Array.isArray(base.synchronizationRules) ? base.synchronizationRules : [],
    openQuestions: Array.isArray(base.openQuestions) ? base.openQuestions : [],
    dbml: String(base.dbml || ''),
    schemaModel: {
      source: schemaModel.source || {},
      summary: String(schemaModel.summary || ''),
      entities: Array.isArray(schemaModel.entities) ? schemaModel.entities.map((entity) => normalizeEntity(entity)) : [],
      relationships: Array.isArray(schemaModel.relationships) ? schemaModel.relationships.map((item) => normalizeRelationship(item)) : [],
      indexes: Array.isArray(schemaModel.indexes) ? schemaModel.indexes.map((item) => normalizeIndex(item)) : [],
      constraints: Array.isArray(schemaModel.constraints) ? schemaModel.constraints.map((item) => normalizeConstraint(item)) : [],
      migrationNotes: Array.isArray(schemaModel.migrationNotes) ? schemaModel.migrationNotes : [],
      openQuestions: Array.isArray(schemaModel.openQuestions) ? schemaModel.openQuestions : [],
      mermaid: String(schemaModel.mermaid || ''),
    },
  };
}

function buildEditorState(state) {
  const normalized = normalizeEditorState(state);
  return {
    ...normalized,
    schemaModel: {
      ...normalized.schemaModel,
      entities: normalized.schemaModel.entities,
      relationships: normalized.schemaModel.relationships,
      indexes: normalized.schemaModel.indexes,
      constraints: normalized.schemaModel.constraints,
    },
  };
}

export function DatabaseSchemaWorkspace({ project }) {
  const fileInputRef = useRef(null);
  const {
    databaseSchema,
    fragments,
    fragmentPaths,
    status,
    error,
    saveStatus,
    refresh,
    saveDatabaseSchema,
    importDatabaseSchemaFragment,
    consumeDatabaseSchemaFragment,
    runDatabaseSchemaSyncAction,
  } = useDatabaseSchema(project, project.type === 'folder');
  const { byCode: workItemLookup } = useProjectWorkItemLookup(project, project?.type === 'folder');
  const [editorState, setEditorState] = useState(() => normalizeEditorState(null));
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState(null);
  const [fragmentsOpen, setFragmentsOpen] = useState(false);
  const [schemaWarning, setSchemaWarning] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const activeFragmentCount = useMemo(() => countActiveFragments(fragments), [fragments]);
  const entityBaselineRef = useRef(null);
  const relationshipBaselineRef = useRef(null);
  const metadataBaselineRef = useRef(null);

  useEffect(() => {
    if (databaseSchema && databaseSchema.editorState) {
      const nextState = normalizeEditorState(databaseSchema.editorState);
      setEditorState(nextState);
      setSelectedEntityId(nextState.schemaModel.entities[0]?.id || null);
      setSelectedRelationshipId(null);
      setSchemaWarning('');
    }
  }, [databaseSchema]);

  const schemaModel = editorState.schemaModel || { entities: [], relationships: [], indexes: [], constraints: [] };
  const syncTracking = editorState.syncTracking || {};
  const driftDetails = syncTracking.driftDetails || { entities: [], relationships: [], indexes: [], constraints: [] };
  const actionItems = Array.isArray(syncTracking.actionItems) ? syncTracking.actionItems : [];
  const auditHistory = Array.isArray(syncTracking.auditHistory) ? syncTracking.auditHistory : [];
  const observedSchemaModel = editorState.observedSchemaModel || { entities: [], relationships: [], indexes: [], constraints: [] };
  const entities = schemaModel.entities || [];
  const relationships = schemaModel.relationships || [];
  const indexes = schemaModel.indexes || [];
  const constraints = schemaModel.constraints || [];
  const observedEntities = observedSchemaModel.entities || [];
  const observedRelationships = observedSchemaModel.relationships || [];
  const observedIndexes = observedSchemaModel.indexes || [];
  const observedConstraints = observedSchemaModel.constraints || [];
  const entitiesById = useMemo(() => new Map(entities.map((entity) => [entity.id, entity])), [entities]);
  const entityDriftMap = useMemo(() => new Map((driftDetails.entities || []).map((entry) => [entry.id, entry])), [driftDetails.entities]);
  const relationshipDriftMap = useMemo(() => new Map((driftDetails.relationships || []).map((entry) => [entry.id, entry])), [driftDetails.relationships]);
  const indexDriftMap = useMemo(() => new Map((driftDetails.indexes || []).map((entry) => [entry.id, entry])), [driftDetails.indexes]);
  const constraintDriftMap = useMemo(() => new Map((driftDetails.constraints || []).map((entry) => [entry.id, entry])), [driftDetails.constraints]);

  const displayEntities = useMemo(
    () => entities.map((entity) => {
      const drift = entityDriftMap.get(entity.id);
      const fieldDriftMap = new Map((drift?.fields || []).map((field) => [field.id, field]));
      return {
        ...entity,
        driftStatus: drift?.driftStatus || 'in_sync',
        fields: (entity.fields || []).map((field) => ({
          ...field,
          driftStatus: fieldDriftMap.get(field.id)?.driftStatus || 'in_sync',
        })),
      };
    }),
    [entities, entityDriftMap]
  );

  const displayRelationships = useMemo(
    () => relationships.map((relationship) => ({
      ...relationship,
      driftStatus: relationshipDriftMap.get(relationship.id)?.driftStatus || 'in_sync',
    })),
    [relationships, relationshipDriftMap]
  );

  const displayIndexes = useMemo(
    () => indexes.map((item) => ({
      ...item,
      driftStatus: indexDriftMap.get(item.id)?.driftStatus || 'in_sync',
    })),
    [indexes, indexDriftMap]
  );

  const displayConstraints = useMemo(
    () => constraints.map((item) => ({
      ...item,
      driftStatus: constraintDriftMap.get(item.id)?.driftStatus || 'in_sync',
    })),
    [constraints, constraintDriftMap]
  );

  useEffect(() => {
    if (selectedEntityId && !entities.some((entity) => entity.id === selectedEntityId)) {
      setSelectedEntityId(null);
    }
    if (selectedRelationshipId && !relationships.some((relationship) => relationship.id === selectedRelationshipId)) {
      setSelectedRelationshipId(null);
    }
  }, [entities, relationships, selectedEntityId, selectedRelationshipId]);

  const selectedEntityIndex = useMemo(
    () => entities.findIndex((entity) => entity.id === selectedEntityId),
    [entities, selectedEntityId]
  );
  const selectedRelationshipIndex = useMemo(
    () => relationships.findIndex((relationship) => relationship.id === selectedRelationshipId),
    [relationships, selectedRelationshipId]
  );
  const selectedEntity = selectedEntityIndex >= 0 ? displayEntities[selectedEntityIndex] : null;
  const selectedRelationship = selectedRelationshipIndex >= 0 ? displayRelationships[selectedRelationshipIndex] : null;
  const entityOptions = useMemo(
    () => displayEntities.map((entity) => ({ value: entity.id, label: entity.name || entity.id })),
    [displayEntities]
  );
  const fieldOptionsByEntity = useMemo(() => {
    const lookup = new Map();
    displayEntities.forEach((entity) => {
      lookup.set(entity.id, (entity.fields || []).map((field) => ({ value: field.id, label: field.name || field.id })));
    });
    return lookup;
  }, [displayEntities]);

  const driftCounts = useMemo(() => ({
    entities: (driftDetails.entities || []).filter((entry) => entry.driftStatus && entry.driftStatus !== 'in_sync').length,
    relationships: (driftDetails.relationships || []).filter((entry) => entry.driftStatus && entry.driftStatus !== 'in_sync').length,
    indexes: (driftDetails.indexes || []).filter((entry) => entry.driftStatus && entry.driftStatus !== 'in_sync').length,
    constraints: (driftDetails.constraints || []).filter((entry) => entry.driftStatus && entry.driftStatus !== 'in_sync').length,
  }), [driftDetails]);
  const totalDriftCount = driftCounts.entities + driftCounts.relationships + driftCounts.indexes + driftCounts.constraints;
  const syncStatusLabel = formatSyncLabel(syncTracking.syncStatus, 'Unverified');
  const recommendedActionLabel = formatSyncLabel(syncTracking.recommendedAction, 'Capture or Compare');
  const pendingMigrationLabel = formatSyncLabel(syncTracking.pendingMigrationStatus, 'Comparison Required');
  const driftSeverityLabel = formatSyncLabel(syncTracking.driftSeverity, 'Low');
  const changeSourceLabel = formatSyncLabel(syncTracking.changeSource, 'Unknown');
  const syncBadgeTone = syncToneForStatus(syncTracking.syncStatus, syncTracking.driftSeverity);
  const saveBadgeTone = saveToneForStatus(saveStatus);
  const canCaptureRuntime = true;
  const canMarkRuntimeUpdated = ['apply_intended_to_runtime'].includes(String(syncTracking.recommendedAction || ''));
  const canAdoptObserved = ['reconcile_runtime_to_intended', 'define_intended_schema', 'review_drift_and_reconcile'].includes(String(syncTracking.recommendedAction || ''));

  async function handleSave() {
    await saveDatabaseSchema(buildEditorState(editorState), databaseSchema?.mermaid || null, databaseSchema?.dbml || editorState.dbml || null);
  }

  async function handlePersistState(nextState) {
    setEditorState(nextState);
    try {
      await saveDatabaseSchema(
        buildEditorState(nextState),
        databaseSchema?.mermaid || null,
        databaseSchema?.dbml || nextState.dbml || null
      );
    } catch (persistError) {
      console.error('Failed to persist schema state:', persistError);
    }
  }

  async function handleFragmentUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const markdown = await file.text();
      const payload = await importDatabaseSchemaFragment(file.name, markdown);
      if (payload?.editorState) {
        const nextState = normalizeEditorState(payload.editorState);
        setEditorState(nextState);
        setSelectedEntityId(nextState.schemaModel.entities[0]?.id || null);
        setSelectedRelationshipId(null);
      }
    } catch (uploadError) {
      console.error('Failed to upload schema fragment:', uploadError);
    } finally {
      event.target.value = '';
    }
  }

  function selectEntity(entityId) {
    setSelectedEntityId(entityId);
    setSelectedRelationshipId(null);
    setSchemaWarning('');
  }

  function selectRelationship(relationshipId) {
    setSelectedRelationshipId(relationshipId);
    setSelectedEntityId(null);
    setSchemaWarning('');
  }

  function updateEntity(entityIndex, patch) {
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.entities[entityIndex] = {
        ...next.schemaModel.entities[entityIndex],
        changeState: nextChangeState(next.schemaModel.entities[entityIndex].changeState),
        ...patch,
      };
      return next;
    });
  }

  function updateField(entityIndex, fieldIndex, patch) {
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.entities[entityIndex].fields[fieldIndex] = {
        ...next.schemaModel.entities[entityIndex].fields[fieldIndex],
        changeState: nextChangeState(next.schemaModel.entities[entityIndex].fields[fieldIndex].changeState),
        ...patch,
      };
      return next;
    });
  }

  function updateRelationship(index, patch) {
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.relationships[index] = {
        ...next.schemaModel.relationships[index],
        changeState: nextChangeState(next.schemaModel.relationships[index].changeState),
        ...patch,
      };
      return next;
    });
  }

  function updateIndex(index, patch) {
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.indexes[index] = {
        ...next.schemaModel.indexes[index],
        changeState: nextChangeState(next.schemaModel.indexes[index].changeState),
        ...patch,
      };
      return next;
    });
  }

  function updateConstraint(index, patch) {
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.constraints[index] = {
        ...next.schemaModel.constraints[index],
        changeState: nextChangeState(next.schemaModel.constraints[index].changeState),
        ...patch,
      };
      return next;
    });
  }

  async function handleSyncAction(action) {
    await runDatabaseSchemaSyncAction(action);
  }

  async function markSelectedEntitySeen() {
    if (selectedEntityIndex < 0) return;
    const nextState = normalizeEditorState(editorState);
    nextState.schemaModel.entities[selectedEntityIndex] = {
      ...nextState.schemaModel.entities[selectedEntityIndex],
      status: 'active',
    };
    await handlePersistState(nextState);
  }

  async function markSelectedRelationshipSeen() {
    if (selectedRelationshipIndex < 0) return;
    const nextState = normalizeEditorState(editorState);
    nextState.schemaModel.relationships[selectedRelationshipIndex] = {
      ...nextState.schemaModel.relationships[selectedRelationshipIndex],
      status: 'active',
    };
    await handlePersistState(nextState);
  }

  function handleAddEntity() {
    const entity = createEntity();
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.entities.push(entity);
      return next;
    });
    setSelectedEntityId(entity.id);
    setSelectedRelationshipId(null);
  }

  function handleAddRelationship() {
    const relationship = createRelationship();
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.relationships.push(relationship);
      return next;
    });
    setSelectedRelationshipId(relationship.id);
    setSelectedEntityId(null);
  }

  function addFieldToSelectedEntity() {
    if (selectedEntityIndex < 0) return;
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.entities[selectedEntityIndex].fields.push(createField());
      return next;
    });
  }

  function removeFieldFromSelectedEntity(fieldIndex) {
    if (selectedEntityIndex < 0) return;
    const field = selectedEntity?.fields?.[fieldIndex];
    if (!field) return;
    const impactedRelationships = relationships.filter((relationship) =>
      relationship.changeState !== 'deleted' &&
      ((relationship.fromEntityId === selectedEntity.id && relationship.fromFieldId === field.id) ||
       (relationship.toEntityId === selectedEntity.id && relationship.toFieldId === field.id))
    );
    if (impactedRelationships.length) {
      setSchemaWarning(`Cannot remove column "${field.name || field.id}" while ${impactedRelationships.length} relationship${impactedRelationships.length === 1 ? '' : 's'} still reference it.`);
      return;
    }
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.entities[selectedEntityIndex].fields[fieldIndex] = {
        ...next.schemaModel.entities[selectedEntityIndex].fields[fieldIndex],
        changeState: 'deleted',
      };
      if (!(next.schemaModel.entities[selectedEntityIndex].fields || []).some((item) => item.changeState !== 'deleted')) {
        next.schemaModel.entities[selectedEntityIndex].fields.push(createField());
      }
      return next;
    });
  }

  function removeSelectedEntity() {
    if (selectedEntityIndex < 0) return;
    const impactedRelationships = relationships.filter((relationship) =>
      relationship.changeState !== 'deleted' &&
      (relationship.fromEntityId === selectedEntity.id || relationship.toEntityId === selectedEntity.id)
    );
    if (impactedRelationships.length) {
      setSchemaWarning(`Cannot remove table "${selectedEntity.name || selectedEntity.id}" while ${impactedRelationships.length} relationship${impactedRelationships.length === 1 ? '' : 's'} still reference it.`);
      return;
    }
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.entities[selectedEntityIndex] = {
        ...next.schemaModel.entities[selectedEntityIndex],
        changeState: 'deleted',
      };
      return next;
    });
  }

  function removeSelectedRelationship() {
    if (selectedRelationshipIndex < 0) return;
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.relationships[selectedRelationshipIndex] = {
        ...next.schemaModel.relationships[selectedRelationshipIndex],
        changeState: 'deleted',
      };
      return next;
    });
  }

  function addIndex() {
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.indexes.push(createIndex());
      return next;
    });
  }

  function addConstraint() {
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.constraints.push(createConstraint());
      return next;
    });
  }

  function handleNodePositionChange(entityId, position) {
    const nextState = normalizeEditorState(editorState);
    const entityIndex = nextState.schemaModel.entities.findIndex((entity) => entity.id === entityId);
    if (entityIndex < 0) return;
    nextState.schemaModel.entities[entityIndex] = {
      ...nextState.schemaModel.entities[entityIndex],
      position,
    };
    handlePersistState(nextState);
  }

  function buildEntityChangeLines(currentEntity, baselineEntity) {
    const lines = [];
    if (!baselineEntity) return lines;
    if (currentEntity.name !== baselineEntity.name) lines.push(`Table name: ${baselineEntity.name || baselineEntity.id} -> ${currentEntity.name || currentEntity.id}`);
    if (currentEntity.kind !== baselineEntity.kind) lines.push(`Table kind: ${baselineEntity.kind || 'table'} -> ${currentEntity.kind || 'table'}`);
    const baselineFields = new Map((baselineEntity.fields || []).map((field) => [field.id, field]));
    for (const field of currentEntity.fields || []) {
      if (field.changeState === 'added') lines.push(`Added column ${field.name || field.id} (${field.type || 'text'})`);
      else if (field.changeState === 'deleted') lines.push(`Removed column ${field.name || field.id}`);
      else if (field.changeState === 'modified') lines.push(`Changed column ${(baselineFields.get(field.id)?.name) || field.name || field.id}`);
    }
    return lines;
  }

  function buildRelationshipChangeLines(currentRelationship, baselineRelationship) {
    const lines = [];
    if (!baselineRelationship) return lines;
    if (currentRelationship.changeState === 'deleted') {
      lines.push('Removed relationship');
      return lines;
    }
    if (
      currentRelationship.fromEntityId !== baselineRelationship.fromEntityId ||
      currentRelationship.fromFieldId !== baselineRelationship.fromFieldId ||
      currentRelationship.toEntityId !== baselineRelationship.toEntityId ||
      currentRelationship.toFieldId !== baselineRelationship.toFieldId
    ) {
      lines.push('Changed relationship endpoints');
    }
    if (currentRelationship.cardinality !== baselineRelationship.cardinality) {
      lines.push(`Changed cardinality: ${baselineRelationship.cardinality} -> ${currentRelationship.cardinality}`);
    }
    return lines;
  }

  function restoreEntityBaseline() {
    if (!entityBaselineRef.current) return;
    const baseline = entityBaselineRef.current;
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      const index = next.schemaModel.entities.findIndex((entity) => entity.id === baseline.id);
      if (index >= 0) next.schemaModel.entities[index] = normalizeEntity(baseline);
      return next;
    });
  }

  function restoreRelationshipBaseline() {
    if (!relationshipBaselineRef.current) return;
    const baseline = relationshipBaselineRef.current;
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      const index = next.schemaModel.relationships.findIndex((relationship) => relationship.id === baseline.id);
      if (index >= 0) next.schemaModel.relationships[index] = normalizeRelationship(baseline);
      return next;
    });
  }

  function restoreMetadataBaseline() {
    if (!metadataBaselineRef.current) return;
    const baseline = metadataBaselineRef.current;
    setEditorState((current) => {
      const next = normalizeEditorState(current);
      next.schemaModel.indexes = (baseline.indexes || []).map((item) => normalizeIndex(item));
      next.schemaModel.constraints = (baseline.constraints || []).map((item) => normalizeConstraint(item));
      return next;
    });
  }

  function requestEntityCommit() {
    if (!selectedEntity) return true;
    const baseline = entityBaselineRef.current;
    if (!baseline) return true;
    const currentEntity = cloneData(selectedEntity);
    if (JSON.stringify(currentEntity) === JSON.stringify(baseline)) return true;
    const changeLines = buildEntityChangeLines(currentEntity, baseline);
    setPendingConfirm({
      title: `Apply changes to ${currentEntity.name || currentEntity.id}?`,
      description: 'Schema edits affect generated DBML, markdown, and downstream AI instructions. Confirm before applying them.',
      lines: changeLines,
      onConfirm: async () => {
        const finalized = appendSchemaChangeLog(
          finalizeSchemaModelChanges(editorState),
          `Confirmed schema changes for ${currentEntity.name || currentEntity.id}`,
          changeLines
        );
        entityBaselineRef.current = cloneData(currentEntity);
        setPendingConfirm(null);
        await handlePersistState(finalized);
      },
      onCancel: () => {
        restoreEntityBaseline();
        setPendingConfirm(null);
      },
    });
    return false;
  }

  function requestRelationshipCommit() {
    if (!selectedRelationship) return true;
    const baseline = relationshipBaselineRef.current;
    if (!baseline) return true;
    const currentRelationship = cloneData(selectedRelationship);
    if (JSON.stringify(currentRelationship) === JSON.stringify(baseline)) return true;
    const changeLines = buildRelationshipChangeLines(currentRelationship, baseline);
    setPendingConfirm({
      title: 'Apply relationship changes?',
      description: 'Relationship edits can invalidate foreign-key assumptions. Confirm before applying these endpoint or cardinality updates.',
      lines: changeLines,
      onConfirm: async () => {
        const finalized = appendSchemaChangeLog(
          finalizeSchemaModelChanges(editorState),
          'Confirmed relationship changes',
          changeLines
        );
        relationshipBaselineRef.current = cloneData(currentRelationship);
        setPendingConfirm(null);
        await handlePersistState(finalized);
      },
      onCancel: () => {
        restoreRelationshipBaseline();
        setPendingConfirm(null);
      },
    });
    return false;
  }

  function requestMetadataCommit() {
    const baseline = metadataBaselineRef.current;
    if (!baseline) return true;
    const current = { indexes: cloneData(indexes), constraints: cloneData(constraints) };
    if (JSON.stringify(current) === JSON.stringify(baseline)) return true;
    const changeLines = [
      `${indexes.filter((item) => item.changeState === 'added').length} new index entries`,
      `${constraints.filter((item) => item.changeState === 'added').length} new constraint entries`,
      `${indexes.filter((item) => item.changeState === 'modified').length + constraints.filter((item) => item.changeState === 'modified').length} modified metadata entries`,
    ];
    setPendingConfirm({
      title: 'Apply supporting schema metadata changes?',
      description: 'Indexes and constraints also change generated schema outputs, so they should be confirmed before saving.',
      lines: changeLines,
      onConfirm: async () => {
        const finalized = appendSchemaChangeLog(
          finalizeSchemaModelChanges(editorState),
          'Confirmed index and constraint changes',
          changeLines
        );
        metadataBaselineRef.current = cloneData(current);
        setPendingConfirm(null);
        await handlePersistState(finalized);
      },
      onCancel: () => {
        restoreMetadataBaseline();
        setPendingConfirm(null);
      },
    });
    return false;
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Database Schema" title="Loading database schema..." description="Fetching schema state from the current backend." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Database Schema" title="Database schema load failed" description={error ? error.message : 'Unknown database schema error'} />;
  }

  return (
    <div id={`database-schema-workspace-${project.id}`} className="database-schema-workspace space-y-5">
      <SectionShell
        id="database-schema-overview"
        className="database-schema-overview"
        eyebrow="Database Schema"
        title="Database Schema workspace"
        description="This migrated schema editor works against the live structured schema model from the current backend. It focuses on entities, fields, relationships, indexes, and constraints first."
        actions={(
          <>
            <StatusBadge tone="foundation">{project.name}</StatusBadge>
            <StatusBadge tone={syncBadgeTone}>{syncStatusLabel}</StatusBadge>
            <StatusBadge tone={saveBadgeTone}>{saveStatus === 'saving' ? 'Saving' : saveStatus === 'saved' ? 'Saved' : saveStatus === 'error' ? 'Save Failed' : 'Ready'}</StatusBadge>
            <ActionButton variant="subtle" onClick={refresh}>Refresh schema</ActionButton>
            <ActionButton variant="ghost" onClick={() => setFragmentsOpen(true)}>
              {`Load Fragments${activeFragmentCount ? ` (${activeFragmentCount})` : ''}`}
            </ActionButton>
            <ActionButton variant="ghost" onClick={() => fileInputRef.current?.click()}>Upload fragment</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save schema'}
            </ActionButton>
          </>
        )}
      >
        <input ref={fileInputRef} type="file" accept=".md,.txt" className="hidden" onChange={handleFragmentUpload} />
        <StatisticsDisclosure>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Intended Version" title={`${syncTracking.intendedVersion || 0}`} body="Design-side schema revision tracked by the document workflow." />
            <InfoTile eyebrow="Observed Version" title={`${syncTracking.observedVersion || 0}`} body="Runtime-side schema revision captured from observed imports." />
            <InfoTile eyebrow="Sync Status" title={syncStatusLabel} body={syncTracking.driftSummary || 'No schema comparison has been recorded yet.'} />
            <InfoTile eyebrow="Next Action" title={recommendedActionLabel} body={syncTracking.actionSummary || 'Capture an observed schema or define the intended schema to begin tracking drift.'} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Drift Severity" title={driftSeverityLabel} body="Higher severity means the intended and observed schemas are farther apart or more risky." />
            <InfoTile eyebrow="Change Source" title={changeSourceLabel} body="Best-effort guess for which side changed first." />
            <InfoTile eyebrow="Entities" title={`${schemaModel.entities.length}`} body="Editable entity cards now live in React." />
            <InfoTile eyebrow="Observed Snapshot" title={`${observedEntities.length}`} body={`Observed runtime snapshot currently tracks ${observedRelationships.length} relationships, ${observedIndexes.length} indexes, and ${observedConstraints.length} constraints.`} />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Relationships" title={`${schemaModel.relationships.length}`} body="Relationship editing is backed by the same schema model the backend persists." />
            <InfoTile eyebrow="Indexes" title={`${schemaModel.indexes.length}`} body="Index metadata remains part of the source-of-truth schema document state." />
            <InfoTile eyebrow="Constraints" title={`${schemaModel.constraints.length}`} body={`Constraint definitions stay tied to the persisted schema model. ${activeFragmentCount} schema fragments are pending.`} />
            <InfoTile eyebrow="Pending Migration" title={pendingMigrationLabel} body={syncTracking.lastComparedAt || 'No comparison recorded yet.'} />
          </div>
        </StatisticsDisclosure>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-ink/80">
            <span className="font-medium text-ink">Schema Purpose</span>
            <textarea
              rows={3}
              className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-ink outline-none focus:border-accent/60"
              value={editorState.overview.purpose}
              onChange={(event) => setEditorState((current) => ({
                ...current,
                overview: {
                  ...current.overview,
                  purpose: event.target.value,
                },
              }))}
            />
            <DocumentFieldMeta
              stableId={editorState.overview.itemIds?.purpose}
              sourceRefs={editorState.overview.itemSourceRefs?.purpose}
              workItemLookup={workItemLookup}
            />
          </label>
          <label className="space-y-2 text-sm text-ink/80">
            <span className="font-medium text-ink">Storage Strategy</span>
            <textarea
              rows={3}
              className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-ink outline-none focus:border-accent/60"
              value={editorState.overview.storageStrategy}
              onChange={(event) => setEditorState((current) => ({
                ...current,
                overview: {
                  ...current.overview,
                  storageStrategy: event.target.value,
                },
              }))}
            />
            <DocumentFieldMeta
              stableId={editorState.overview.itemIds?.storageStrategy}
              sourceRefs={editorState.overview.itemSourceRefs?.storageStrategy}
              workItemLookup={workItemLookup}
            />
          </label>
        </div>
        <SurfaceCard className="mt-4 p-4" tone="muted">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Migration Guidance</p>
          <p className="mt-2 text-sm leading-6 text-ink/80">{syncTracking.actionSummary || 'Capture an observed schema or define the intended schema to begin tracking drift.'}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-ink/78">
            <p><span className="font-semibold text-ink">Recommended Action:</span> {recommendedActionLabel}</p>
            <p><span className="font-semibold text-ink">Pending Migration Status:</span> {pendingMigrationLabel}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionButton variant="ghost" onClick={() => handleSyncAction('refresh_comparison')} disabled={saveStatus === 'saving'}>
              Refresh comparison
            </ActionButton>
            <ActionButton
              variant="ghost"
              onClick={() => handleSyncAction('capture_runtime_schema')}
              disabled={saveStatus === 'saving' || !canCaptureRuntime}
            >
              Capture runtime schema
            </ActionButton>
            <ActionButton
              variant="ghost"
              onClick={() => handleSyncAction('mark_runtime_updated')}
              disabled={saveStatus === 'saving' || !canMarkRuntimeUpdated}
            >
              Mark runtime updated
            </ActionButton>
            <ActionButton
              variant="ghost"
              onClick={() => handleSyncAction('adopt_observed_as_intended')}
              disabled={saveStatus === 'saving' || !canAdoptObserved}
            >
              Adopt observed as intended
            </ActionButton>
          </div>
        </SurfaceCard>
        <SurfaceCard className="mt-4 p-4" tone="muted">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Observed Runtime Snapshot</p>
          <p className="mt-2 text-sm leading-6 text-ink/80">
            {observedEntities.length
              ? `The last observed runtime capture contains ${observedEntities.length} entities and ${observedRelationships.length} relationships. Use this as the persistence-side reference when reconciling drift.`
              : 'No observed runtime snapshot has been captured yet. Import a schema fragment from the live database to establish the observed side.'}
          </p>
        </SurfaceCard>
        <SurfaceCard className="mt-4 p-4" tone="muted">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Drift Breakdown</p>
          <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm text-ink/80">
            <p><span className="font-semibold text-ink">Entities:</span> {driftCounts.entities}</p>
            <p><span className="font-semibold text-ink">Relationships:</span> {driftCounts.relationships}</p>
            <p><span className="font-semibold text-ink">Indexes:</span> {driftCounts.indexes}</p>
            <p><span className="font-semibold text-ink">Constraints:</span> {driftCounts.constraints}</p>
          </div>
          <p className="mt-3 text-sm leading-6 text-ink/72">
            {totalDriftCount
              ? `${totalDriftCount} schema object${totalDriftCount === 1 ? '' : 's'} currently need attention across the intended and observed models.`
              : 'No object-level drift is currently detected.'}
          </p>
        </SurfaceCard>
        <SurfaceCard className="mt-4 p-4" tone="muted">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Generated Work Items</p>
          {actionItems.length ? (
            <ul className="mt-3 space-y-3 text-sm leading-6 text-ink/80">
              {actionItems.map((item) => (
                <li key={item.id} className="rounded-2xl bg-white/5 px-3 py-2">
                  <p className="font-semibold text-ink">{item.title}</p>
                  <p className="text-ink/70">{item.summary || 'No summary provided.'}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-ink/55">
                    {`${String(item.category || 'reconciliation').replace(/_/g, ' ')} • ${String(item.priority || 'medium')}`}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6 text-ink/75">No generated schema work items right now. The intended and observed schema are either aligned or need a fresh comparison first.</p>
          )}
        </SurfaceCard>
        <SurfaceCard className="mt-4 p-4" tone="muted">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Sync History</p>
          {auditHistory.length ? (
            <ul className="mt-3 space-y-3 text-sm leading-6 text-ink/80">
              {auditHistory.slice(0, 8).map((entry) => (
                <li key={entry.id || `${entry.timestamp}-${entry.action}`} className="rounded-2xl bg-white/5 px-3 py-2">
                  <p className="font-semibold text-ink">{entry.summary || entry.action || 'Schema sync event'}</p>
                  <p className="text-xs uppercase tracking-[0.12em] text-ink/55">
                    {[entry.timestamp, entry.changeSource, `${entry.fromSyncStatus || 'unknown'} -> ${entry.toSyncStatus || 'unknown'}`].filter(Boolean).join(' • ')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6 text-ink/75">No sync history recorded yet.</p>
          )}
        </SurfaceCard>
        {fragmentPaths ? (
          <div id="database-schema-fragment-search-paths" className="database-schema-fragment-search-paths mt-4 rounded-2xl bg-white/5 p-3">
            <p className="database-schema-fragment-search-paths-label text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Fragment Search Paths</p>
            <div className="database-schema-fragment-search-paths-body mt-2 space-y-2 text-xs leading-6 text-ink/75">
              <p id="database-schema-fragment-path-project"><span className="font-semibold text-ink">Project:</span> {fragmentPaths.projectFragmentsDir || 'Unavailable'}</p>
              <p id="database-schema-fragment-path-shared"><span className="font-semibold text-ink">Shared:</span> {fragmentPaths.sharedFragmentsDir || 'Unavailable'}</p>
              <p id="database-schema-fragment-path-legacy"><span className="font-semibold text-ink">Legacy docs fallback:</span> {fragmentPaths.legacyProjectDocsDir || 'Unavailable'}</p>
            </div>
          </div>
        ) : null}
        <div id="database-schema-fragment-debug" className="database-schema-fragment-debug mt-4 rounded-2xl bg-white/5 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Loaded Fragments</p>
          <div className="mt-2 space-y-2 text-xs leading-6 text-ink/75">
            <p id="database-schema-fragment-debug-count">
              <span className="font-semibold text-ink">Pending:</span> {activeFragmentCount}
            </p>
            {fragments.length ? (
              <div id="database-schema-fragment-debug-list" className="flex flex-wrap gap-2">
                {fragments.map((fragment) => (
                  <button
                    key={fragment.id || fragment.code}
                    type="button"
                    className="rounded-full bg-white/8 px-2.5 py-1 text-xs text-ink/80 transition hover:bg-white/12"
                    onClick={() => setFragmentsOpen(true)}
                    title={[fragment.title, fragment.sourceScope, fragment.parseWarning].filter(Boolean).join(' | ')}
                  >
                    {fragment.code || fragment.fileName || fragment.id}
                  </button>
                ))}
              </div>
            ) : (
              <p id="database-schema-fragment-debug-empty">No fragments are currently loaded into the UI state.</p>
            )}
          </div>
        </div>
      </SectionShell>

      <AiInstructionsPanel
        title="Database Schema AI Instructions"
        instructions={[
          'Use database schema fragments for proposed schema changes instead of editing the canonical schema document directly.',
          `Place project schema fragments in ${fragmentPaths?.projectFragmentsDir || 'data/projects/<project-id>/fragments/'}.`,
          `Place shared schema fragments in ${fragmentPaths?.sharedFragmentsDir || 'data/projects/shared/fragments/'}.`,
          'Treat the schema model as the source of truth for DBML, Mermaid, and narrative schema output.',
          'Mark observed facts separately from inferred structure when importing or drafting schema fragments.',
        ]}
      />

      {schemaWarning ? (
        <SurfaceCard className="p-3" tone="muted">
          <p className="text-sm leading-6 text-amber-100">{schemaWarning}</p>
        </SurfaceCard>
      ) : null}

      <div className="database-schema-main-layout grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
        <SectionShell
          id="database-schema-visualizer-section"
          className="database-schema-visualizer-section"
          eyebrow="Schema Visualizer"
          title="Table and relationship diagram"
          description="Tables render as containers with columns and types. Click a table or edge to inspect and edit details on the right."
          actions={(
            <>
              <ActionButton variant="ghost" onClick={handleAddEntity}>Add entity</ActionButton>
              <ActionButton variant="ghost" onClick={handleAddRelationship}>Add relationship</ActionButton>
            </>
          )}
        >
          <SchemaVisualizer
            entities={displayEntities}
            relationships={displayRelationships}
            selectedEntityId={selectedEntityId}
            selectedRelationshipId={selectedRelationshipId}
            onSelectEntity={selectEntity}
            onSelectRelationship={selectRelationship}
            onNodePositionChange={handleNodePositionChange}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <SurfaceCard className="p-4" tone="muted">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/55">Table nodes</p>
              <p className="mt-2 text-sm leading-6 text-sky-100/75">Each row shows the column name on the left and the type on the right.</p>
            </SurfaceCard>
            <SurfaceCard className="p-4" tone="muted">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/55">Relationship edges</p>
              <p className="mt-2 text-sm leading-6 text-sky-100/75">Edges point toward the referenced side and use 1 or * markers for cardinality.</p>
            </SurfaceCard>
            <SurfaceCard className="p-4" tone="muted">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/55">Inspector</p>
              <p className="mt-2 text-sm leading-6 text-sky-100/75">Selecting a table or edge opens the matching details without leaving the diagram.</p>
            </SurfaceCard>
          </div>
        </SectionShell>

        <SchemaInspectorPanel
          selectedEntity={selectedEntity}
          selectedEntityIndex={selectedEntityIndex}
          selectedRelationship={selectedRelationship}
          selectedRelationshipIndex={selectedRelationshipIndex}
          entitiesById={new Map(displayEntities.map((entity) => [entity.id, entity]))}
          entityOptions={entityOptions}
          fieldOptionsByEntity={fieldOptionsByEntity}
          indexes={displayIndexes}
          constraints={displayConstraints}
          databaseSchema={databaseSchema}
          editorState={editorState}
          updateEntity={updateEntity}
          updateField={updateField}
          updateRelationship={updateRelationship}
          updateIndex={updateIndex}
          updateConstraint={updateConstraint}
          addFieldToSelectedEntity={addFieldToSelectedEntity}
          removeFieldFromSelectedEntity={removeFieldFromSelectedEntity}
          removeSelectedEntity={removeSelectedEntity}
          removeSelectedRelationship={removeSelectedRelationship}
          addIndex={addIndex}
          addConstraint={addConstraint}
          markSelectedEntitySeen={markSelectedEntitySeen}
          markSelectedRelationshipSeen={markSelectedRelationshipSeen}
          onEntityEditStart={(entity) => {
            entityBaselineRef.current = cloneData(entity);
            setSchemaWarning('');
          }}
          onEntityEditDone={requestEntityCommit}
          onRelationshipEditStart={(relationship) => {
            relationshipBaselineRef.current = cloneData(relationship);
            setSchemaWarning('');
          }}
          onRelationshipEditDone={requestRelationshipCommit}
          onMetadataEditStart={() => {
            metadataBaselineRef.current = cloneData({ indexes, constraints });
            setSchemaWarning('');
          }}
          onMetadataEditDone={requestMetadataCommit}
        />
      </div>

      <FragmentBrowserModal
        eyebrow="Database Schema Fragments"
        title="Database Schema fragments"
        isOpen={fragmentsOpen}
        fragments={fragments}
        storageKey={`database-schema-${project.id}`}
        onClose={() => setFragmentsOpen(false)}
        onIntegrate={(fragment) => consumeDatabaseSchemaFragment(fragment)}
      />

      {pendingConfirm ? (
        <div className="fixed inset-0 z-[1250] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
          <div className="absolute inset-0" aria-hidden="true" onClick={pendingConfirm.onCancel} />
          <DialogFrame
            eyebrow="Confirm Schema Change"
            title={pendingConfirm.title}
            description={pendingConfirm.description}
            className="relative z-[1251] w-full max-w-3xl"
          >
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/5 p-4">
                <ul className="space-y-2 text-sm leading-6 text-ink/80">
                  {(pendingConfirm.lines || []).filter(Boolean).map((line) => (
                    <li key={line}>- {line}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <ActionButton variant="ghost" onClick={pendingConfirm.onCancel}>Cancel</ActionButton>
                <ActionButton variant="accent" onClick={pendingConfirm.onConfirm}>Apply change</ActionButton>
              </div>
            </div>
          </DialogFrame>
        </div>
      ) : null}
    </div>
  );
}
