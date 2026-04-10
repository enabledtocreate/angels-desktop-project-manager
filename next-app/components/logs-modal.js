'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { fetchJson } from '@/lib/api-client';

function matchesFilter(entry, filters) {
  const query = String(filters.query || '').trim().toLowerCase();
  if (filters.level && entry.level !== filters.level) return false;
  if (filters.source && entry.source !== filters.source) return false;
  if (!query) return true;
  return [
    entry.timestamp,
    entry.requestId,
    entry.source,
    entry.eventType,
    entry.action,
    entry.message,
    entry.details,
    entry.error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(query);
}

function formatEntry(entry) {
  return [
    entry.timestamp,
    entry.level,
    entry.requestId,
    entry.source,
    entry.eventType,
    entry.action,
    entry.message,
    entry.details,
    entry.error,
  ].join('\t');
}

function compareEntries(left, right, sortState) {
  const { column, direction } = sortState;
  const factor = direction === 'asc' ? 1 : -1;
  const leftValue = left?.[column] || '';
  const rightValue = right?.[column] || '';
  if (column === 'timestamp') {
    const leftTime = Date.parse(leftValue) || 0;
    const rightTime = Date.parse(rightValue) || 0;
    return (leftTime - rightTime) * factor;
  }
  return String(leftValue).localeCompare(String(rightValue), undefined, {
    numeric: true,
    sensitivity: 'base',
  }) * factor;
}

function HeaderButton({ label, column, sortState, onToggle }) {
  const active = sortState.column === column;
  const arrow = active ? (sortState.direction === 'desc' ? 'v' : '^') : '';
  return (
    <button
      type="button"
      className={`flex items-center gap-1 text-left ${active ? 'text-ink' : 'text-ink/60 hover:text-ink/85'}`}
      onClick={() => onToggle(column)}
    >
      <span>{label}</span>
      <span className="text-[10px]">{arrow}</span>
    </button>
  );
}

export function LogsModal({ isOpen, onClose, onStatusChange }) {
  const [logInfo, setLogInfo] = useState(null);
  const [selectedArchive, setSelectedArchive] = useState('');
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('idle');
  const [filters, setFilters] = useState({ query: '', level: '', source: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [dragAnchor, setDragAnchor] = useState(null);
  const [sortState, setSortState] = useState({ column: 'timestamp', direction: 'desc' });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadInfo() {
      setStatus('loading');
      try {
        const info = await fetchJson('/api/logs');
        if (cancelled) return;
        setLogInfo(info);
        setSelectedArchive('');
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load log info:', error);
          setStatus('error');
        }
      }
    }

    loadInfo();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadEntries() {
      setStatus('loading');
      try {
        const payload = await fetchJson(
          selectedArchive
            ? `/api/logs/entries?archive=${encodeURIComponent(selectedArchive)}`
            : '/api/logs/entries'
        );
        if (cancelled) return;
        setEntries(Array.isArray(payload?.entries) ? payload.entries : []);
        setSelectedIds([]);
        setDragAnchor(null);
        setStatus('ready');
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load log entries:', error);
          setStatus('error');
        }
      }
    }

    loadEntries();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedArchive]);

  const filteredEntries = useMemo(
    () => entries
      .filter((entry) => matchesFilter(entry, filters))
      .sort((left, right) => compareEntries(left, right, sortState)),
    [entries, filters, sortState]
  );

  const levels = useMemo(
    () => [...new Set(entries.map((entry) => entry.level).filter(Boolean))],
    [entries]
  );
  const sources = useMemo(
    () => [...new Set(entries.map((entry) => entry.source).filter(Boolean))],
    [entries]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        const lines = filteredEntries
          .filter((entry) => selectedIds.includes(entry.id))
          .map(formatEntry);
        const text = lines.join('\n');
        if (text && navigator.clipboard) {
          navigator.clipboard.writeText(text).then(() => {
            onStatusChange?.('Copied selected log lines.');
          }).catch(() => {});
        }
      }
    }

    function handleMouseUp() {
      setDragAnchor(null);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [filteredEntries, isOpen, onStatusChange, selectedIds]);

  if (!isOpen) return null;

  function selectRange(nextId) {
    if (!dragAnchor) return;
    const startIndex = filteredEntries.findIndex((entry) => entry.id === dragAnchor);
    const endIndex = filteredEntries.findIndex((entry) => entry.id === nextId);
    if (startIndex < 0 || endIndex < 0) return;
    const [min, max] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    setSelectedIds(filteredEntries.slice(min, max + 1).map((entry) => entry.id));
  }

  async function handleCopy() {
    const lines = filteredEntries
      .filter((entry) => selectedIds.includes(entry.id))
      .map(formatEntry);
    const text = lines.join('\n');
    if (!text || !navigator.clipboard) return;
    await navigator.clipboard.writeText(text);
    onStatusChange?.('Copied selected log lines.');
  }

  function handleSort(column) {
    setSortState((current) => (
      current.column === column
        ? { column, direction: current.direction === 'desc' ? 'asc' : 'desc' }
        : { column, direction: column === 'timestamp' ? 'desc' : 'asc' }
    ));
  }

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />
      <DialogFrame
        eyebrow="Logs"
        title="Structured log viewer"
        description="Search, filter, and copy structured log lines without leaving the app."
        className="relative z-[1301] w-full max-w-[95rem]"
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_160px_180px_auto]">
            <select
              value={selectedArchive}
              onChange={(event) => setSelectedArchive(event.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none"
            >
              <option value="">Current log</option>
              {(logInfo?.archived || []).map((entry) => (
                <option key={entry.name} value={entry.name}>{entry.name}</option>
              ))}
            </select>
            <input
              type="search"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search message, request id, source..."
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none"
            />
            <select
              value={filters.level}
              onChange={(event) => setFilters((current) => ({ ...current, level: event.target.value }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none"
            >
              <option value="">All levels</option>
              {levels.map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <select
              value={filters.source}
              onChange={(event) => setFilters((current) => ({ ...current, source: event.target.value }))}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-ink outline-none"
            >
              <option value="">All sources</option>
              {sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <div className="flex gap-2">
              <ActionButton variant="ghost" onClick={handleCopy} disabled={!selectedIds.length}>Copy</ActionButton>
              <ActionButton variant="ghost" onClick={onClose}>Close</ActionButton>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="grid grid-cols-[180px_80px_150px_110px_160px_140px_minmax(220px,1fr)] gap-2 border-b border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/60">
              <HeaderButton label="Timestamp" column="timestamp" sortState={sortState} onToggle={handleSort} />
              <HeaderButton label="Level" column="level" sortState={sortState} onToggle={handleSort} />
              <HeaderButton label="Request" column="requestId" sortState={sortState} onToggle={handleSort} />
              <HeaderButton label="Source" column="source" sortState={sortState} onToggle={handleSort} />
              <HeaderButton label="Event" column="eventType" sortState={sortState} onToggle={handleSort} />
              <HeaderButton label="Action" column="action" sortState={sortState} onToggle={handleSort} />
              <HeaderButton label="Message" column="message" sortState={sortState} onToggle={handleSort} />
            </div>
            <div className="max-h-[calc(100vh-20rem)] overflow-auto">
              {status === 'loading' ? (
                <div className="px-3 py-4 text-sm text-ink/70">Loading log entries...</div>
              ) : filteredEntries.length ? filteredEntries.map((entry) => {
                const selected = selectedIds.includes(entry.id);
                return (
                  <div
                    key={entry.id}
                    className={[
                      'grid cursor-default grid-cols-[180px_80px_150px_110px_160px_140px_minmax(220px,1fr)] gap-2 border-b border-white/6 px-3 py-2 text-xs text-ink/80',
                      selected ? 'bg-slate-950/70 text-white ring-1 ring-accent/60' : 'hover:bg-white/6',
                    ].join(' ')}
                    onMouseDown={() => {
                      setDragAnchor(entry.id);
                      setSelectedIds([entry.id]);
                    }}
                    onMouseEnter={() => selectRange(entry.id)}
                  >
                    <span className="truncate">{entry.timestamp}</span>
                    <span className="truncate">{entry.level}</span>
                    <span className="truncate">{entry.requestId || '-'}</span>
                    <span className="truncate">{entry.source || '-'}</span>
                    <span className="truncate">{entry.eventType || '-'}</span>
                    <span className="truncate">{entry.action || '-'}</span>
                    <span className="break-words">{entry.message || entry.details || entry.error || '-'}</span>
                  </div>
                );
              }) : (
                <div className="px-3 py-4 text-sm text-ink/70">No log entries match the current filters.</div>
              )}
            </div>
          </div>
        </div>
      </DialogFrame>
    </div>
  );
}
