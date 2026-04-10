'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function useProjectModules(projectId) {
  const [modules, setModules] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [status, setStatus] = useState(projectId ? 'loading' : 'idle');
  const [error, setError] = useState(null);

  async function loadModules(cancelled = false) {
    if (!projectId) {
      setModules([]);
      setDependencies([]);
      setStatus('idle');
      return null;
    }

    setStatus('loading');
    setError(null);
    try {
      const payload = await fetchJson(`/api/projects/${projectId}/modules`);
      if (cancelled) return null;
      setModules(Array.isArray(payload.modules) ? payload.modules : []);
      setDependencies(Array.isArray(payload.dependencies) ? payload.dependencies : []);
      setStatus('ready');
      return payload;
    } catch (loadError) {
      if (cancelled) return null;
      setError(loadError);
      setStatus('error');
      throw loadError;
    }
  }

  useEffect(() => {
    let cancelled = false;
    loadModules(cancelled);
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return {
    modules,
    dependencies,
    status,
    error,
    refresh: () => loadModules(false),
  };
}
