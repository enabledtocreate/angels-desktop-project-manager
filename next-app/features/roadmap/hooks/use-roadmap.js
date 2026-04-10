'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function useRoadmap(project, enabled = true) {
  const [roadmap, setRoadmap] = useState(null);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadRoadmap() {
      if (!enabled || !project || !project.id) {
        setRoadmap(null);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const payload = await fetchJson(`/api/projects/${project.id}/roadmap`);
        if (cancelled) return;
        setRoadmap(payload);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadRoadmap();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const payload = await fetchJson(`/api/projects/${project.id}/roadmap`);
    setRoadmap(payload);
    setStatus('ready');
    return payload;
  }

  async function createPhase(phaseInput) {
    if (!project || !project.id) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/roadmap/phases`, {
        method: 'POST',
        body: JSON.stringify(phaseInput),
      });
      const nextState = await refresh();
      setSaveStatus('saved');
      return nextState;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function updatePhase(phaseId, phaseInput) {
    if (!project || !project.id || !phaseId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/roadmap/phases/${phaseId}`, {
        method: 'PUT',
        body: JSON.stringify(phaseInput),
      });
      const nextState = await refresh();
      setSaveStatus('saved');
      return nextState;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function deletePhase(phaseId) {
    if (!project || !project.id || !phaseId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/roadmap/phases/${phaseId}`, {
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

  async function mergeFragment(fragmentId) {
    if (!project || !project.id || !fragmentId) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/roadmap/fragments/${fragmentId}/merge`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (payload?.roadmap) setRoadmap(payload.roadmap);
      else await refresh();
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function integrateFragment(fragmentId) {
    if (!project || !project.id || !fragmentId) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/roadmap/fragments/${fragmentId}/integrate`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      if (payload?.roadmap) setRoadmap(payload.roadmap);
      else await refresh();
      setSaveStatus('saved');
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  return {
    roadmap,
    status,
    error,
    saveStatus,
    refresh,
    createPhase,
    updatePhase,
    deletePhase,
    mergeFragment,
    integrateFragment,
  };
}
