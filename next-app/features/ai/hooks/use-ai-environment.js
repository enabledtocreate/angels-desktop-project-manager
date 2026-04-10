'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function useAiEnvironment(project, enabled = true) {
  const [aiEnvironment, setAiEnvironment] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadAiEnvironment() {
      if (!enabled || !project || !project.id) {
        setAiEnvironment(null);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [payload, fragmentPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/ai-environment`),
          fetchJson(`/api/projects/${project.id}/ai-environment/fragments`),
        ]);
        if (cancelled) return;
        setAiEnvironment(payload);
        setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadAiEnvironment();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const [payload, fragmentPayload] = await Promise.all([
      fetchJson(`/api/projects/${project.id}/ai-environment`),
      fetchJson(`/api/projects/${project.id}/ai-environment/fragments`),
    ]);
    setAiEnvironment(payload);
    setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
    setStatus('ready');
    return payload;
  }

  async function saveAiEnvironment(editorState, mermaid = null) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/ai-environment`, {
        method: 'PUT',
        body: JSON.stringify({
          editorState,
          ...(mermaid ? { mermaid } : {}),
        }),
      });
      setAiEnvironment(payload);
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function consumeAiEnvironmentFragment(fragmentOrFileName) {
    if (!enabled || !project || !project.id) return null;
    const payload = await fetchJson(`/api/projects/${project.id}/ai-environment/fragments/consume`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: typeof fragmentOrFileName === 'string' ? fragmentOrFileName : fragmentOrFileName?.fileName,
        sourceScope: typeof fragmentOrFileName === 'object' ? fragmentOrFileName?.sourceScope : undefined,
      }),
    });
    setAiEnvironment(payload.aiEnvironment || payload);
    setFragments(Array.isArray(payload.fragments) ? payload.fragments : []);
    setStatus('ready');
    return payload;
  }

  return {
    aiEnvironment,
    fragments,
    status,
    error,
    saveStatus,
    refresh,
    saveAiEnvironment,
    consumeAiEnvironmentFragment,
  };
}
