'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { COLOR_SCHEME_KEY, DEFAULT_SCHEME, SCHEMES } from '@/lib/color-schemes';

const ThemeContext = createContext({
  colorScheme: DEFAULT_SCHEME,
  setColorScheme: () => {},
  showStableIds: true,
  setShowStableIds: () => {},
  schemes: SCHEMES,
});

const SHOW_STABLE_IDS_KEY = 'apm:show-stable-ids';

function applyScheme(schemeId) {
  const scheme = SCHEMES[schemeId] || SCHEMES[DEFAULT_SCHEME];
  const nextScheme = SCHEMES[schemeId] ? schemeId : DEFAULT_SCHEME;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.scheme = nextScheme;
  }
  try {
    window.localStorage.setItem(COLOR_SCHEME_KEY, nextScheme);
  } catch {}
  try {
    window.electronAPI?.setTheme?.({
      scheme: nextScheme,
      backgroundColor: scheme.backgroundColor,
    });
  } catch (error) {
    console.error('Failed to apply Electron theme:', error);
  }
  return nextScheme;
}

function applyStableIdVisibility(showStableIds) {
  const nextValue = showStableIds !== false;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.showStableIds = nextValue ? 'true' : 'false';
  }
  try {
    window.localStorage.setItem(SHOW_STABLE_IDS_KEY, nextValue ? '1' : '0');
  } catch {}
  return nextValue;
}

function getApiBaseUrl() {
  if (typeof window === 'undefined') return '';
  const explicit = window.__APM_API_BASE_URL__ || process.env.NEXT_PUBLIC_API_BASE_URL;
  return explicit ? String(explicit).replace(/\/+$/, '') : '';
}

function sendClientError(payload) {
  if (typeof window === 'undefined') return;
  const url = `${getApiBaseUrl()}/api/log-client-error`;
  const body = JSON.stringify(payload);
  try {
    if (navigator?.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {}
  try {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      cache: 'no-store',
    }).catch(() => {});
  } catch {}
}

export function AppThemeProvider({ children }) {
  const [colorScheme, setColorSchemeState] = useState(DEFAULT_SCHEME);
  const [showStableIds, setShowStableIdsState] = useState(true);

  useEffect(() => {
    let savedScheme = DEFAULT_SCHEME;
    try {
      const stored = window.localStorage.getItem(COLOR_SCHEME_KEY);
      if (stored && SCHEMES[stored]) savedScheme = stored;
    } catch {}
    const applied = applyScheme(savedScheme);
    setColorSchemeState(applied);
  }, []);

  useEffect(() => {
    let savedShowStableIds = true;
    try {
      const stored = window.localStorage.getItem(SHOW_STABLE_IDS_KEY);
      if (stored === '0') savedShowStableIds = false;
    } catch {}
    setShowStableIdsState(applyStableIdVisibility(savedShowStableIds));

    let cancelled = false;
    fetch(`${getApiBaseUrl()}/api/settings`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((settings) => {
        if (cancelled || !settings) return;
        setShowStableIdsState(applyStableIdVisibility(settings?.ui?.showStableIds !== false));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleWindowError(event) {
      sendClientError({
        type: 'window.error',
        message: event?.message || event?.error?.message || 'Unhandled client error',
        stack: event?.error?.stack || '',
        source: event?.filename || '',
        lineno: event?.lineno,
        colno: event?.colno,
      });
    }

    function handleUnhandledRejection(event) {
      const reason = event?.reason;
      sendClientError({
        type: 'window.unhandledrejection',
        message: reason instanceof Error ? reason.message : String(reason || 'Unhandled promise rejection'),
        stack: reason instanceof Error ? (reason.stack || '') : '',
        source: '',
        lineno: '',
        colno: '',
      });
    }

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const value = useMemo(
    () => ({
      colorScheme,
      schemes: SCHEMES,
      showStableIds,
      setColorScheme: (schemeId) => {
        const applied = applyScheme(schemeId);
        setColorSchemeState(applied);
      },
      setShowStableIds: (nextValue) => {
        setShowStableIdsState(applyStableIdVisibility(nextValue));
      },
    }),
    [colorScheme, showStableIds]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
