'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';
import { useFragmentFileWatcher } from '@/hooks/use-fragment-file-watcher';

export function useArchitecture(project, enabled = true) {
  const [architecture, setArchitecture] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadArchitecture() {
      if (!enabled || !project || !project.id) {
        setArchitecture(null);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [payload, fragmentPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/architecture`),
          fetchJson(`/api/projects/${project.id}/architecture/fragments`),
        ]);
        if (cancelled) return;
        setArchitecture(payload);
        setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadArchitecture();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const [payload, fragmentPayload] = await Promise.all([
      fetchJson(`/api/projects/${project.id}/architecture`),
      fetchJson(`/api/projects/${project.id}/architecture/fragments`),
    ]);
    setArchitecture(payload);
    setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
    setStatus('ready');
    return payload;
  }

  async function saveArchitecture(editorState, mermaid = null) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/architecture`, {
        method: 'PUT',
        body: JSON.stringify({
          editorState,
          ...(mermaid ? { mermaid } : {}),
        }),
      });
      setArchitecture(payload);
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function consumeArchitectureFragment(fragmentOrFileName) {
    if (!enabled || !project || !project.id) return null;
    const payload = await fetchJson(`/api/projects/${project.id}/architecture/fragments/consume`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: typeof fragmentOrFileName === 'string' ? fragmentOrFileName : fragmentOrFileName?.fileName,
        sourceScope: typeof fragmentOrFileName === 'object' ? fragmentOrFileName?.sourceScope : undefined,
      }),
    });
    setArchitecture(payload.architecture || payload);
    setFragments(Array.isArray(payload.fragments) ? payload.fragments : []);
    setStatus('ready');
    return payload;
  }

  useFragmentFileWatcher({
    projectId: project?.id || '',
    enabled: Boolean(enabled && project?.id),
    onChange: () => {
      refresh().catch(() => {});
    },
  });

  return {
    architecture,
    fragments,
    status,
    error,
    saveStatus,
    refresh,
    saveArchitecture,
    consumeArchitectureFragment,
  };
}
