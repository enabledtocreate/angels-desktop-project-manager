'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function useIntegrations(project, enabled = true) {
  const [integrations, setIntegrations] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadIntegrations() {
      if (!enabled || !project || !project.id) {
        setIntegrations(null);
        setCatalog(null);
        setEvents([]);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [integrationsPayload, catalogPayload, eventsPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/integrations`),
          fetchJson('/api/integrations/catalog'),
          fetchJson(`/api/projects/${project.id}/integration-events?limit=10`),
        ]);
        if (cancelled) return;
        setIntegrations(integrationsPayload || {});
        setCatalog(catalogPayload || { builtIn: [] });
        setEvents(Array.isArray(eventsPayload) ? eventsPayload : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadIntegrations();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    const [integrationsPayload, catalogPayload, eventsPayload] = await Promise.all([
      fetchJson(`/api/projects/${project.id}/integrations`),
      fetchJson('/api/integrations/catalog'),
      fetchJson(`/api/projects/${project.id}/integration-events?limit=10`),
    ]);
    setIntegrations(integrationsPayload || {});
    setCatalog(catalogPayload || { builtIn: [] });
    setEvents(Array.isArray(eventsPayload) ? eventsPayload : []);
    setStatus('ready');
    return integrationsPayload;
  }

  async function saveIntegrations(nextIntegrations) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      const payload = await fetchJson(`/api/projects/${project.id}/integrations`, {
        method: 'PUT',
        body: JSON.stringify(nextIntegrations),
      });
      setIntegrations(payload || {});
      setSaveStatus('saved');
      await refresh();
      return payload;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  return {
    integrations,
    catalog,
    events,
    status,
    error,
    saveStatus,
    refresh,
    saveIntegrations,
  };
}
