'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';
import { useFragmentFileWatcher } from '@/hooks/use-fragment-file-watcher';

export function useModuleDocument(project, moduleKey, enabled = true) {
  const [documentState, setDocumentState] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!enabled || !project?.id || !moduleKey) {
        setDocumentState(null);
        setFragments([]);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [payload, fragmentPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/module-documents/${moduleKey}`),
          fetchJson(`/api/projects/${project.id}/module-documents/${moduleKey}/fragments`),
        ]);
        if (cancelled) return;
        setDocumentState(payload);
        setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, project?.id, moduleKey]);

  async function refresh() {
    if (!enabled || !project?.id || !moduleKey) return null;
    const [payload, fragmentPayload] = await Promise.all([
      fetchJson(`/api/projects/${project.id}/module-documents/${moduleKey}`),
      fetchJson(`/api/projects/${project.id}/module-documents/${moduleKey}/fragments`),
    ]);
    setDocumentState(payload);
    setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
    setStatus('ready');
    return payload;
  }

  async function saveModuleDocument(editorState, mermaid = null) {
    if (!enabled || !project?.id || !moduleKey) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/module-documents/${moduleKey}`, {
        method: 'PUT',
        body: JSON.stringify({
          editorState,
          ...(mermaid ? { mermaid } : {}),
        }),
      });
      setDocumentState(payload);
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function consumeModuleFragment(fragmentOrFileName) {
    if (!enabled || !project?.id || !moduleKey) return null;
    const payload = await fetchJson(`/api/projects/${project.id}/module-documents/${moduleKey}/fragments/consume`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: typeof fragmentOrFileName === 'string' ? fragmentOrFileName : fragmentOrFileName?.fileName,
        sourceScope: typeof fragmentOrFileName === 'object' ? fragmentOrFileName?.sourceScope : undefined,
      }),
    });
    setDocumentState(payload.document || payload);
    setFragments(Array.isArray(payload.fragments) ? payload.fragments : []);
    setStatus('ready');
    return payload;
  }

  useFragmentFileWatcher({
    projectId: project?.id || '',
    enabled: Boolean(enabled && project?.id && moduleKey),
    onChange: () => {
      refresh().catch(() => {});
    },
  });

  return {
    documentState,
    fragments,
    status,
    error,
    saveStatus,
    refresh,
    saveModuleDocument,
    consumeModuleFragment,
  };
}
