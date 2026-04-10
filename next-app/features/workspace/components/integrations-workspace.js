'use client';

import { useEffect, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { InfoTile } from '@/components/ui/info-tile';
import { SectionShell } from '@/components/ui/section-shell';
import { StatisticsDisclosure } from '@/components/ui/statistics-disclosure';
import { StatusBadge } from '@/components/ui/status-badge';
import { SurfaceCard } from '@/components/ui/surface-card';
import { SftpModal } from '@/features/workspace/components/sftp-modal';
import { useIntegrations } from '@/features/workspace/hooks/use-integrations';

function buildEditableState(integrations) {
  return {
    githubEnabled: !!integrations?.github?.enabled,
    githubOwner: integrations?.github?.owner || '',
    githubRepo: integrations?.github?.repo || '',
    autoCreateTasks: !!integrations?.webhooks?.autoCreateTasks,
    taskPrefix: integrations?.webhooks?.taskPrefix || '',
  };
}

export function IntegrationsWorkspace({ project, onProjectUpdated, onStatusChange }) {
  const { integrations, catalog, events, status, error, saveStatus, refresh, saveIntegrations } = useIntegrations(project, true);
  const [editableState, setEditableState] = useState(() => buildEditableState(null));
  const [isSftpOpen, setIsSftpOpen] = useState(false);
  const [workspaceStatus, setWorkspaceStatus] = useState('');

  useEffect(() => {
    if (integrations) setEditableState(buildEditableState(integrations));
  }, [integrations]);

  async function handleSave() {
    await saveIntegrations({
      ...(integrations || {}),
      github: {
        ...(integrations?.github || {}),
        enabled: editableState.githubEnabled,
        owner: editableState.githubOwner,
        repo: editableState.githubRepo,
      },
      webhooks: {
        ...(integrations?.webhooks || {}),
        autoCreateTasks: editableState.autoCreateTasks,
        taskPrefix: editableState.taskPrefix,
      },
    });
  }

  function handleStatusChange(message) {
    const next = String(message || '').trim();
    setWorkspaceStatus(next);
    onStatusChange?.(next);
  }

  if (status === 'loading' || status === 'idle') {
    return <SectionShell eyebrow="Integrations" title="Loading integrations..." description="Fetching integration settings, catalog, and recent events." />;
  }

  if (status === 'error') {
    return <SectionShell eyebrow="Integrations" title="Integrations load failed" description={error ? error.message : 'Unknown integrations error'} />;
  }

  const mappingCount = (project.mappingGroups || []).reduce(
    (count, group) => count + ((group?.uploadMappings?.length || 0) + (group?.downloadMappings?.length || 0)),
    0
  );
  const linkedSftpServerCount = Array.isArray(project?.integrations?.sftp?.serverIds) && project.integrations.sftp.serverIds.length
    ? project.integrations.sftp.serverIds.length
    : (project.serverId ? 1 : 0);

  return (
    <div className="space-y-5">
      <SectionShell
        eyebrow="Integrations"
        title="Integrations workspace"
        description="This migrated surface keeps project integrations in React while restoring the SFTP workflow on top of the existing backend."
        actions={(
          <>
            <StatusBadge tone="foundation">{(catalog?.builtIn || []).length} built-in</StatusBadge>
            <StatusBadge tone="migration">{saveStatus === 'saving' ? 'Saving' : 'Ready'}</StatusBadge>
            <ActionButton variant="subtle" onClick={refresh}>Refresh integrations</ActionButton>
            <ActionButton variant="subtle" onClick={() => setIsSftpOpen(true)}>Open SFTP workspace</ActionButton>
            <ActionButton variant="accent" onClick={handleSave} disabled={saveStatus === 'saving'}>
              {saveStatus === 'saving' ? 'Saving...' : 'Save integrations'}
            </ActionButton>
          </>
        )}
      >
        <StatisticsDisclosure>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <InfoTile eyebrow="Catalog" title={`${(catalog?.builtIn || []).length}`} body="Built-in integration capabilities available to this project." />
            <InfoTile eyebrow="GitHub" title={editableState.githubEnabled ? 'Enabled' : 'Disabled'} body={`${editableState.githubOwner || 'No owner'} / ${editableState.githubRepo || 'No repo'}`} />
            <InfoTile eyebrow="Webhooks" title={editableState.autoCreateTasks ? 'Auto-create tasks' : 'Manual only'} body={`Prefix: ${editableState.taskPrefix || 'none'}`} />
            <InfoTile eyebrow="SFTP" title={linkedSftpServerCount ? `${linkedSftpServerCount} linked` : 'No server'} body={`${mappingCount} mappings saved`} />
          </div>
        </StatisticsDisclosure>
      </SectionShell>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionShell eyebrow="Configuration" title="Project integration settings" description="GitHub and webhook settings stay editable here, while SFTP now has its own dedicated workspace again.">
          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 text-sm text-sky-100/75">
              <input type="checkbox" checked={editableState.githubEnabled} onChange={(event) => setEditableState((current) => ({ ...current, githubEnabled: event.target.checked }))} />
              Enable GitHub integration
            </label>
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="GitHub owner" value={editableState.githubOwner} onChange={(event) => setEditableState((current) => ({ ...current, githubOwner: event.target.value }))} />
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="GitHub repo" value={editableState.githubRepo} onChange={(event) => setEditableState((current) => ({ ...current, githubRepo: event.target.value }))} />
            <label className="inline-flex items-center gap-2 text-sm text-sky-100/75">
              <input type="checkbox" checked={editableState.autoCreateTasks} onChange={(event) => setEditableState((current) => ({ ...current, autoCreateTasks: event.target.checked }))} />
              Auto-create tasks from webhooks
            </label>
            <input className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none focus:border-accent/60" placeholder="Webhook task prefix" value={editableState.taskPrefix} onChange={(event) => setEditableState((current) => ({ ...current, taskPrefix: event.target.value }))} />
            <SurfaceCard className="p-3" tone="muted">
              <p className="text-sm leading-6 text-sky-100/75">
                {linkedSftpServerCount
                  ? 'This project already has linked SFTP server settings. Open the SFTP workspace to browse files, manage mapping groups, and run transfers.'
                  : 'No SFTP server is currently associated with this project. Open the SFTP workspace or project settings to link one.'}
              </p>
              <div className="mt-3">
                <ActionButton variant="subtle" onClick={() => setIsSftpOpen(true)}>Open SFTP workspace</ActionButton>
              </div>
            </SurfaceCard>
            <SurfaceCard className="p-3" tone="muted">
              <p className="text-sm leading-6 text-sky-100/75">
                {workspaceStatus || 'SFTP status updates from mapping actions and transfer runs will appear here.'}
              </p>
            </SurfaceCard>
          </div>
        </SectionShell>

        <div className="space-y-4">
          <SectionShell eyebrow="Built-in Catalog" title="Available integration tools" description="These come from the current backend catalog, so the React workspace is reading the same definitions as the desktop backend.">
            <div className="grid gap-3 md:grid-cols-2">
              {(catalog?.builtIn || []).map((item) => (
                <SurfaceCard key={item.id} className="p-4" tone="muted">
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-sky-100/55">{item.kind}</p>
                </SurfaceCard>
              ))}
            </div>
          </SectionShell>
          <SectionShell eyebrow="Event Stream" title="Recent integration activity" description="Recent integration events remain useful for smoke-checking automation behavior while the UI is migrating.">
            <div className="space-y-3">
              {events.length ? events.map((event) => (
                <SurfaceCard key={event.id} className="p-4" tone="muted">
                  <p className="text-sm font-semibold text-white">{event.eventType || 'event'}</p>
                  <p className="mt-2 text-sm text-sky-100/75">{event.source || 'unknown source'} | {event.deliveryStatus || 'unknown status'}</p>
                </SurfaceCard>
              )) : (
                <SurfaceCard tone="muted">
                  <p className="text-sm leading-6 text-sky-100/75">No recent integration events for this project.</p>
                </SurfaceCard>
              )}
            </div>
          </SectionShell>
        </div>
      </div>

      <SftpModal
        isOpen={isSftpOpen}
        project={project}
        onClose={() => setIsSftpOpen(false)}
        onProjectUpdated={onProjectUpdated}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
