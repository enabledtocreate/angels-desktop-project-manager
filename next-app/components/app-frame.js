'use client';

import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';

function useElectronWindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [hasElectronControls, setHasElectronControls] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const available = Boolean(
      typeof window !== 'undefined' &&
        window.electronAPI &&
        typeof window.electronAPI.windowMinimize === 'function'
    );
    setHasElectronControls(available);

    async function syncMaximizedState() {
      try {
        if (
          available &&
          typeof window !== 'undefined' &&
          window.electronAPI &&
          typeof window.electronAPI.windowIsMaximized === 'function'
        ) {
          const nextValue = await window.electronAPI.windowIsMaximized();
          if (!cancelled) setIsMaximized(Boolean(nextValue));
        }
      } catch (error) {
        console.error('Failed to read window maximize state:', error);
      }
    }

    syncMaximizedState();
    window.addEventListener('resize', syncMaximizedState);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', syncMaximizedState);
    };
  }, []);

  async function minimizeWindow() {
    try {
      await window.electronAPI?.windowMinimize?.();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  }

  async function toggleMaximizeWindow() {
    try {
      const nextValue = await window.electronAPI?.windowMaximize?.();
      setIsMaximized(Boolean(nextValue));
    } catch (error) {
      console.error('Failed to maximize window:', error);
    }
  }

  async function closeWindow() {
    try {
      await window.electronAPI?.windowClose?.();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  }

  return {
    hasElectronControls,
    isMaximized,
    minimizeWindow,
    toggleMaximizeWindow,
    closeWindow,
  };
}

export function AppFrame({ children }) {
  const { hasElectronControls, isMaximized, minimizeWindow, toggleMaximizeWindow, closeWindow } =
    useElectronWindowControls();

  return (
    <div className="min-h-screen">
      {hasElectronControls ? (
        <header className="app-titlebar">
          <div className="app-titlebar__brand">
            <div className="app-titlebar__mark" aria-hidden="true">
              AP
            </div>
            <div className="app-titlebar__copy">
              <span className="app-titlebar__eyebrow">Desktop Project Designer</span>
              <span className="app-titlebar__title">Angel&apos;s Project Manager</span>
            </div>
          </div>

          <div className="app-titlebar__controls app-no-drag">
            <ActionButton
              variant="subtle"
              size="sm"
              className="app-titlebar__button"
              onClick={minimizeWindow}
              aria-label="Minimize window"
              title="Minimize"
            >
              <span aria-hidden="true">-</span>
            </ActionButton>
            <ActionButton
              variant="subtle"
              size="sm"
              className="app-titlebar__button"
              onClick={toggleMaximizeWindow}
              aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              <span aria-hidden="true">{isMaximized ? '[]' : '[ ]'}</span>
            </ActionButton>
            <ActionButton
              variant="subtle"
              size="sm"
              className="app-titlebar__button app-titlebar__button--close"
              onClick={closeWindow}
              aria-label="Close window"
              title="Close"
            >
              <span aria-hidden="true">x</span>
            </ActionButton>
          </div>
        </header>
      ) : null}

      <div className={hasElectronControls ? 'app-shell-with-titlebar' : ''}>
        <div className="app-shell-scroll">{children}</div>
      </div>
    </div>
  );
}
