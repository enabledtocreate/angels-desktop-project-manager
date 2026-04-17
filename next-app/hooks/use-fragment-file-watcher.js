'use client';

import { useEffect, useRef } from 'react';
import { useFileWatcher } from '@/hooks/use-file-watcher';

function isFragmentEvent(event) {
  const absolutePath = String(event?.absolutePath || '');
  if (!absolutePath || !/\.md$/i.test(absolutePath)) return false;
  if (/\.template\.md$/i.test(absolutePath)) return true;
  return /fragment/i.test(absolutePath) || /\\Fragments\\/i.test(absolutePath) || /\/Fragments\//i.test(absolutePath);
}

export function useFragmentFileWatcher({ projectId = '', enabled = true, onChange = null, debounceMs = 350 } = {}) {
  const onChangeRef = useRef(onChange);
  const timerRef = useRef(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  const watchId = projectId ? `project-fragments:${projectId}` : '';
  return useFileWatcher({
    watchId,
    enabled: Boolean(enabled && projectId),
    maxEvents: 25,
    onEvent: (event) => {
      if (!isFragmentEvent(event)) return;
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (typeof onChangeRef.current === 'function') {
          onChangeRef.current(event);
        }
      }, debounceMs);
    },
  });
}
