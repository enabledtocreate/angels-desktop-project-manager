'use client';

import { useEffect, useRef, useState } from 'react';

export function useFileWatcher({ watchId = '', enabled = true, onEvent = null, maxEvents = 50 } = {}) {
  const [status, setStatus] = useState(enabled ? 'connecting' : 'idle');
  const [events, setEvents] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return undefined;
    }

    const params = new URLSearchParams();
    if (watchId) params.set('watchId', watchId);
    const source = new EventSource(`/api/file-watcher/stream${params.toString() ? `?${params.toString()}` : ''}`);

    source.addEventListener('ready', () => {
      setStatus('connected');
    });

    source.addEventListener('file', (event) => {
      try {
        const payload = JSON.parse(event.data);
        setLastEvent(payload);
        setEvents((current) => [payload, ...current].slice(0, maxEvents));
        if (typeof onEventRef.current === 'function') {
          onEventRef.current(payload);
        }
      } catch {
        // Ignore malformed event payloads.
      }
    });

    source.onerror = () => {
      setStatus('error');
    };

    return () => {
      source.close();
      setStatus('idle');
    };
  }, [enabled, watchId, maxEvents]);

  return {
    status,
    events,
    lastEvent,
    clearEvents: () => setEvents([]),
  };
}
