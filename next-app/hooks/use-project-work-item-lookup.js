'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function normalizeFeature(feature) {
  if (!feature || typeof feature !== 'object') return null;
  const code = normalizeCode(feature.code || feature.id);
  if (!code) return null;
  return {
    type: 'feature',
    code,
    id: feature.id || '',
    title: feature.title || feature.summary || code,
    status: feature.status || '',
    planningBucket: feature.planningBucket || '',
    category: feature.category || '',
    summary: feature.summary || '',
    description: feature.description || feature.summary || '',
    affectedModuleKeys: Array.isArray(feature.affectedModuleKeys) ? feature.affectedModuleKeys : [],
    raw: feature,
  };
}

function normalizeBug(bug) {
  if (!bug || typeof bug !== 'object') return null;
  const code = normalizeCode(bug.code || bug.id);
  if (!code) return null;
  return {
    type: 'bug',
    code,
    id: bug.id || '',
    title: bug.title || bug.summary || code,
    status: bug.status || '',
    planningBucket: bug.planningBucket || '',
    category: bug.category || '',
    summary: bug.summary || '',
    currentBehavior: bug.currentBehavior || bug.summary || '',
    expectedBehavior: bug.expectedBehavior || '',
    affectedModuleKeys: Array.isArray(bug.affectedModuleKeys) ? bug.affectedModuleKeys : [],
    raw: bug,
  };
}

export function useProjectWorkItemLookup(project, enabled = true) {
  const [features, setFeatures] = useState([]);
  const [bugs, setBugs] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!enabled || !project?.id) {
        setFeatures([]);
        setBugs([]);
        return;
      }

      try {
        const [featuresPayload, bugsPayload] = await Promise.all([
          fetchJson(`/api/projects/${project.id}/features`),
          fetchJson(`/api/projects/${project.id}/bugs`),
        ]);
        if (cancelled) return;
        setFeatures(
          (Array.isArray(featuresPayload?.features) ? featuresPayload.features : [])
            .map(normalizeFeature)
            .filter(Boolean)
        );
        setBugs(
          (Array.isArray(bugsPayload?.bugs) ? bugsPayload.bugs : [])
            .map(normalizeBug)
            .filter(Boolean)
        );
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load project work item lookup:', error);
        setFeatures([]);
        setBugs([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [enabled, project?.id]);

  const byCode = useMemo(() => {
    const lookup = {};
    [...features, ...bugs].forEach((item) => {
      if (!item?.code) return;
      lookup[item.code] = item;
    });
    return lookup;
  }, [features, bugs]);

  return {
    features,
    bugs,
    byCode,
  };
}
