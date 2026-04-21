'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { SurfaceCard } from '@/components/ui/surface-card';

function ToolbarMenu({ label, items, isOpen, onToggle, onClose }) {
  return (
    <div
      className={`toolbar-menu toolbar-menu-${String(label).toLowerCase()} relative app-no-drag`}
      id={`toolbar-menu-${String(label).toLowerCase()}`}
    >
      <button
        id={`toolbar-menu-button-${String(label).toLowerCase()}`}
        type="button"
        className="toolbar-menu-button rounded-xl px-3 py-2 text-sm font-medium text-ink transition hover:bg-white/10"
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
      >
        {label}
      </button>
      {isOpen ? (
        <div id={`toolbar-menu-popover-${String(label).toLowerCase()}`} className="toolbar-menu-popover absolute left-0 top-full z-30 mt-2 min-w-48 rounded-2xl border border-white/10 bg-panel/95 p-2 shadow-panel backdrop-blur-md">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              className="toolbar-menu-item block w-full rounded-xl px-3 py-2 text-left text-sm text-ink transition hover:bg-white/10"
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onClose();
                item.onClick?.();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AppToolbar({
  searchQuery,
  onSearchChange,
  sortMode,
  onSortModeChange,
  viewMode,
  onViewModeChange,
  groupMode,
  onGroupModeChange,
  onOpenSettings,
  onViewLogs,
  onRestartApp,
  onCreateProject,
  statusMessage,
  showOrganizer = true,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const menuBarRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!menuBarRef.current) return;
      if (!menuBarRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenMenu(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const menus = useMemo(
    () => [
      { label: 'File', items: [{ label: 'Settings', onClick: onOpenSettings }] },
      { label: 'View', items: [{ label: 'View Logs', onClick: onViewLogs }] },
      { label: 'Help', items: [{ label: 'Restart App', onClick: onRestartApp }] },
    ],
    [onOpenSettings, onRestartApp, onViewLogs]
  );

  return (
    <div id="app-toolbar" className="app-toolbar flex-none space-y-2">
      <div id="app-menu-bar" className="app-menu-bar rounded-t-[1.1rem] border border-white/10 border-b-white/5 bg-panel/88 px-3 py-1.5 shadow-panel">
        <div ref={menuBarRef} className="app-menu-bar-inner relative z-20 flex flex-wrap items-center gap-1">
          {menus.map((menu) => (
            <ToolbarMenu
              key={menu.label}
              label={menu.label}
              items={menu.items}
              isOpen={openMenu === menu.label}
              onToggle={() => setOpenMenu((current) => (current === menu.label ? null : menu.label))}
              onClose={() => setOpenMenu(null)}
            />
          ))}
        </div>
      </div>

      {showOrganizer ? (
        <SurfaceCard id="project-list-organizer" className="project-list-organizer p-3">
          <div className="project-list-organizer-grid grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,180px))]">
            <label id="project-list-organizer-search" className="project-list-organizer-search block space-y-2 text-sm text-ink/80">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Search</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search name, description, tags..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink outline-none focus:border-accent/60"
              />
            </label>

            <label id="project-list-organizer-sort" className="project-list-organizer-sort block space-y-2 text-sm text-ink/80">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Sort</span>
              <select
                value={sortMode}
                onChange={(event) => onSortModeChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink outline-none focus:border-accent/60"
              >
                <option value="alphabetical">Alphabetical</option>
                <option value="dateAdded">Date Added</option>
                <option value="category">Category</option>
              </select>
            </label>

            <label id="project-list-organizer-view" className="project-list-organizer-view block space-y-2 text-sm text-ink/80">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">View</span>
              <select
                value={viewMode}
                onChange={(event) => onViewModeChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink outline-none focus:border-accent/60"
              >
                <option value="list">List</option>
                <option value="grid">Grid</option>
              </select>
            </label>

            <label id="project-list-organizer-group" className="project-list-organizer-group block space-y-2 text-sm text-ink/80">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Group</span>
              <select
                value={groupMode}
                onChange={(event) => onGroupModeChange(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-ink outline-none focus:border-accent/60"
              >
                <option value="none">None</option>
                <option value="name">Name</option>
                <option value="dateAdded">Date Added</option>
                <option value="category">Category</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              id="project-list-organizer-create-project"
              className="rounded-2xl border border-accent/35 bg-accent/90 px-4 py-3 text-sm font-medium text-slate transition hover:border-accent hover:bg-sky-300"
              onClick={onCreateProject}
            >
              Create Project
            </button>
          </div>

          <p id="project-list-organizer-status" className="project-list-organizer-status mt-3 min-h-[1.25rem] text-sm text-ink/70">
            {statusMessage || 'Use search, sort, view, and grouping to organize the project list before opening a workspace.'}
          </p>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
