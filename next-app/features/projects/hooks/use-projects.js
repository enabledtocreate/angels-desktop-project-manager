'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchJson } from '@/lib/api-client';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [roots, setRoots] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function loadProjects() {
    setStatus('loading');
    setError(null);
    try {
      const [nextProjects, nextRoots] = await Promise.all([
        fetchJson('/api/projects'),
        fetchJson('/api/roots'),
      ]);
      setProjects(Array.isArray(nextProjects) ? nextProjects : []);
      setRoots(nextRoots || null);
      setSelectedProjectId((currentId) => {
        if (currentId && nextProjects.some((project) => project.id === currentId)) return currentId;
        return null;
      });
      setStatus('ready');
    } catch (loadError) {
      setError(loadError);
      setStatus('error');
    }
  }

  async function updateProject(projectId, updates) {
    const saved = await fetchJson(`/api/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(updates || {}),
    });

    setProjects((currentProjects) =>
      currentProjects.map((project) => (project.id === saved.id ? saved : project))
    );

    return saved;
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId]
  );

  return {
    projects,
    roots,
    selectedProject,
    selectedProjectId,
    setSelectedProjectId,
    updateProject,
    status,
    error,
    refresh: loadProjects,
  };
}
