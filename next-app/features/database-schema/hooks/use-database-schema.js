'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';
import { useFragmentFileWatcher } from '@/hooks/use-fragment-file-watcher';

export function useDatabaseSchema(project, enabled = true) {
  const [databaseSchema, setDatabaseSchema] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [fragmentPaths, setFragmentPaths] = useState(null);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadDatabaseSchema() {
      if (!enabled || !project || !project.id) {
        setDatabaseSchema(null);
        setFragments([]);
        setFragmentPaths(null);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [payload, fragmentPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/database-schema`),
          fetchJson(`/api/projects/${project.id}/database-schema/fragments`),
        ]);
        if (cancelled) return;
        setDatabaseSchema(payload);
        setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
        setFragmentPaths(fragmentPayload?.paths || null);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadDatabaseSchema();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const [payload, fragmentPayload] = await Promise.all([
      fetchJson(`/api/projects/${project.id}/database-schema`),
      fetchJson(`/api/projects/${project.id}/database-schema/fragments`),
    ]);
    setDatabaseSchema(payload);
    setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
    setFragmentPaths(fragmentPayload?.paths || null);
    setStatus('ready');
    return payload;
  }

  async function saveDatabaseSchema(editorState, mermaid = null, dbml = null) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/database-schema`, {
        method: 'PUT',
        body: JSON.stringify({
          editorState,
          ...(mermaid ? { mermaid } : {}),
          ...(dbml ? { dbml } : {}),
        }),
      });
      setDatabaseSchema(payload);
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function importDatabaseSchemaFragment(fileName, markdown) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/database-schema/import-fragment`, {
        method: 'POST',
        body: JSON.stringify({ fileName, markdown }),
      });
      setDatabaseSchema(payload);
      await refresh();
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function consumeDatabaseSchemaFragment(fragmentOrFileName) {
    const fragment = typeof fragmentOrFileName === 'string'
      ? { fileName: fragmentOrFileName, sourceScope: 'project' }
      : (fragmentOrFileName || {});
    if (!enabled || !project || !project.id || (!fragment.fileName && !fragment.markdown)) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/database-schema/fragments/consume`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: fragment.fileName || '',
          sourceScope: fragment.sourceScope || 'project',
          markdown: fragment.markdown || '',
        }),
      });
      setDatabaseSchema(payload);
      await refresh();
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function runDatabaseSchemaSyncAction(action) {
    if (!enabled || !project || !project.id || !action) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/database-schema/sync-actions`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setDatabaseSchema(payload);
      await refresh();
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  useFragmentFileWatcher({
    projectId: project?.id || '',
    enabled: Boolean(enabled && project?.id),
    onChange: () => {
      refresh().catch(() => {});
    },
  });

  return {
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
  };
}
