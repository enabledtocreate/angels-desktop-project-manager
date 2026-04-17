'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';
import { useFragmentFileWatcher } from '@/hooks/use-fragment-file-watcher';

export function useBugs(project, enabled = true) {
  const [bugsState, setBugsState] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadBugs() {
      if (!enabled || !project || !project.id) {
        setBugsState(null);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [payload, fragmentPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/bugs`),
          fetchJson(`/api/projects/${project.id}/bugs/fragments`),
        ]);
        if (cancelled) return;
        setBugsState(payload);
        setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadBugs();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const [payload, fragmentPayload] = await Promise.all([
      fetchJson(`/api/projects/${project.id}/bugs`),
      fetchJson(`/api/projects/${project.id}/bugs/fragments`),
    ]);
    setBugsState(payload);
    setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
    setStatus('ready');
    return payload;
  }

  async function createBug(bugInput) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/bugs`, {
        method: 'POST',
        body: JSON.stringify(bugInput),
      });
      const nextState = await refresh();
      setSaveStatus('saved');
      return nextState;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function updateBug(bugId, bugInput) {
    if (!enabled || !project || !project.id || !bugId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/bugs/${bugId}`, {
        method: 'PUT',
        body: JSON.stringify(bugInput),
      });
      const nextState = await refresh();
      setSaveStatus('saved');
      return nextState;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function deleteBug(bugId) {
    if (!enabled || !project || !project.id || !bugId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/bugs/${bugId}`, {
        method: 'DELETE',
      });
      const nextState = await refresh();
      setSaveStatus('saved');
      return nextState;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function consumeBugFragment(fragmentOrFileName) {
    if (!enabled || !project || !project.id) return null;
    const payload = await fetchJson(`/api/projects/${project.id}/bugs/fragments/consume`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: typeof fragmentOrFileName === 'string' ? fragmentOrFileName : fragmentOrFileName?.fileName,
        sourceScope: typeof fragmentOrFileName === 'object' ? fragmentOrFileName?.sourceScope : undefined,
      }),
    });
    setBugsState(payload.bugs || payload);
    await refresh();
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
    bugsState,
    fragments,
    status,
    error,
    saveStatus,
    refresh,
    createBug,
    updateBug,
    deleteBug,
    consumeBugFragment,
  };
}
