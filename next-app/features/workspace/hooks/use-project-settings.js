'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function useProjectSettings(project, enabled = true) {
  const [projectState, setProjectState] = useState(project || null);
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (!enabled || !project || !project.id) {
        setProjectState(project || null);
        setSettings(null);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const payload = await fetchJson('/api/settings');
        if (cancelled) return;
        setProjectState(project);
        setSettings(payload || {});
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadSettings();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const payload = await fetchJson('/api/settings');
    setProjectState(project);
    setSettings(payload || {});
    setStatus('ready');
    return payload;
  }

  async function saveProjectSettings(nextProjectState) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      const savedProject = await fetchJson(`/api/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify(nextProjectState),
      });
      setProjectState(savedProject);
      setSaveStatus('saved');
      return savedProject;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  return {
    projectState,
    settings,
    status,
    error,
    saveStatus,
    refresh,
    saveProjectSettings,
  };
}
