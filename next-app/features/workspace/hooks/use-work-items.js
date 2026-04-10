'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function useWorkItems(project, enabled = true) {
  const [workItems, setWorkItems] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadWorkItems() {
      if (!enabled || !project || !project.id) {
        setWorkItems([]);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const payload = await fetchJson(`/api/projects/${project.id}/work-items`);
        if (cancelled) return;
        setWorkItems(Array.isArray(payload) ? payload : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadWorkItems();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return [];
    const payload = await fetchJson(`/api/projects/${project.id}/work-items`);
    const nextItems = Array.isArray(payload) ? payload : [];
    setWorkItems(nextItems);
    setStatus('ready');
    return nextItems;
  }

  async function createWorkItem(itemInput) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify(itemInput),
      });
      const nextItems = await refresh();
      setSaveStatus('saved');
      return nextItems;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function updateWorkItem(itemId, itemInput) {
    if (!enabled || !project || !project.id || !itemId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/tasks/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(itemInput),
      });
      const nextItems = await refresh();
      setSaveStatus('saved');
      return nextItems;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function deleteWorkItem(itemId) {
    if (!enabled || !project || !project.id || !itemId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/tasks/${itemId}`, {
        method: 'DELETE',
      });
      const nextItems = await refresh();
      setSaveStatus('saved');
      return nextItems;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  return {
    workItems,
    status,
    error,
    saveStatus,
    refresh,
    createWorkItem,
    updateWorkItem,
    deleteWorkItem,
  };
}
