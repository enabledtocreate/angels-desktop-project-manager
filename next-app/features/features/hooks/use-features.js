'use client';

import { useEffect, useState } from 'react';
import { fetchJson } from '@/lib/api-client';
import { useFragmentFileWatcher } from '@/hooks/use-fragment-file-watcher';

export function useFeatures(project, enabled = true) {
  const [featuresState, setFeaturesState] = useState(null);
  const [fragments, setFragments] = useState([]);
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [refreshStatus, setRefreshStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;

    async function loadFeatures() {
      if (!enabled || !project || !project.id) {
        setFeaturesState(null);
        setStatus('idle');
        return;
      }

      setStatus('loading');
      setError(null);
      try {
        const [payload, fragmentPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/features`),
          fetchJson(`/api/projects/${project.id}/features/fragments`),
        ]);
        if (cancelled) return;
        setFeaturesState(payload);
        setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadFeatures();
    return () => {
      cancelled = true;
    };
  }, [enabled, project]);

  async function refresh() {
    if (!enabled || !project || !project.id) return null;
    setRefreshStatus('refreshing');
    try {
      const [payload, fragmentPayload] = await Promise.all([
        fetchJson(`/api/projects/${project.id}/features`),
        fetchJson(`/api/projects/${project.id}/features/fragments`),
      ]);
      setFeaturesState(payload);
      setFragments(Array.isArray(fragmentPayload?.fragments) ? fragmentPayload.fragments : []);
      setStatus('ready');
      setRefreshStatus('refreshed');
      return payload;
    } catch (refreshError) {
      setRefreshStatus('error');
      throw refreshError;
    }
  }

  async function createFeature(featureInput) {
    if (!enabled || !project || !project.id) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/features`, {
        method: 'POST',
        body: JSON.stringify(featureInput),
      });
      const nextState = await refresh();
      setSaveStatus('saved');
      return nextState;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function updateFeature(featureId, featureInput) {
    if (!enabled || !project || !project.id || !featureId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/features/${featureId}`, {
        method: 'PUT',
        body: JSON.stringify(featureInput),
      });
      const nextState = await refresh();
      setSaveStatus('saved');
      return nextState;
    } catch (saveError) {
      setSaveStatus('error');
      throw saveError;
    }
  }

  async function deleteFeature(featureId) {
    if (!enabled || !project || !project.id || !featureId) return null;
    setSaveStatus('saving');
    try {
      await fetchJson(`/api/projects/${project.id}/features/${featureId}`, {
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

  async function consumeFeatureFragment(fragmentOrFileName) {
    if (!enabled || !project || !project.id) return null;
    const payload = await fetchJson(`/api/projects/${project.id}/features/fragments/consume`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: typeof fragmentOrFileName === 'string' ? fragmentOrFileName : fragmentOrFileName?.fileName,
        sourceScope: typeof fragmentOrFileName === 'object' ? fragmentOrFileName?.sourceScope : undefined,
      }),
    });
    setFeaturesState(payload.features || payload);
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
    featuresState,
    fragments,
    status,
    error,
    saveStatus,
    refreshStatus,
    refresh,
    createFeature,
    updateFeature,
    deleteFeature,
    consumeFeatureFragment,
  };
}
