'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function usePrd(project, enabled = true) {
  const [prd, setPrd] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadPrd() {
      if (!enabled || !project || !project.id) {
        setPrd(null);
        setFragments([]);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [payload, fragmentPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/prd`),
          fetchJson(`/api/projects/${project.id}/prd/fragments`),
        ]);
        if (cancelled) return;
        setPrd(payload);
        setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadPrd();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const [payload, fragmentPayload] = await Promise.all([
      fetchJson(`/api/projects/${project.id}/prd`),
      fetchJson(`/api/projects/${project.id}/prd/fragments`),
    ]);
    setPrd(payload);
    setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
    setStatus('ready');
    return payload;
  }

  async function savePrd(editorState, mermaid = null) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/prd`, {
        method: 'PUT',
        body: JSON.stringify({
          editorState,
          ...(mermaid ? { mermaid } : {}),
        }),
      });
      setPrd(payload);
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function mergeFragment(fragmentId) {
    if (!enabled || !project || !project.id || !fragmentId) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/prd/fragments/${fragmentId}/merge`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (payload?.prd) setPrd(payload.prd);
      await refresh();
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function integrateFragment(fragmentId) {
    if (!enabled || !project || !project.id || !fragmentId) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/prd/fragments/${fragmentId}/integrate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (payload?.prd) setPrd(payload.prd);
      await refresh();
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  return {
    prd,
    fragments,
    status,
    error,
    saveStatus,
    refresh,
    savePrd,
    mergeFragment,
    integrateFragment,
  };
}
