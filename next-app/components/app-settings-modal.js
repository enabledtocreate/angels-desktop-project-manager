'use client';

import { useEffect, useMemo, useState } from 'react';
import { ActionButton } from '@/components/ui/action-button';
import { useAppTheme } from '@/components/app-theme-provider';
import { DialogFrame } from '@/components/ui/dialog-frame';
import { FileExplorerModal } from '@/components/ui/file-explorer-modal';
import { FilePathField } from '@/components/ui/file-path-field';
import { fetchJson } from '@/lib/api-client';

function buildEditableSettings(payload) {
  return {
    projectRoot: payload?.projects?.projectRoot || '',
    dataDir: payload?.projects?.dataDir || '',
    logsDir: payload?.projects?.logsDir || '',
    fragmentsRootDir: payload?.projects?.fragmentsRootDir || '',
    githubApiBaseUrl: payload?.integrations?.githubApiBaseUrl || 'https://api.github.com',
    githubToken: '',
    webhookSecret: '',
    githubTokenMasked: payload?.integrations?.githubTokenMasked || null,
    webhookSecretConfigured: Boolean(payload?.integrations?.webhookSecretConfigured),
    fragmentsDirectiveProjectId: payload?.ai?.fragmentsDirectiveProjectId || '',
    shutdownLockedAppBeforeBuildDirectiveEnabled: Boolean(payload?.ai?.shutdownLockedAppBeforeBuildDirectiveEnabled),
    showStableIds: payload?.ui?.showStableIds !== false,
  };
}

function buildCredentialDraft(credential = null) {
  return {
    id: credential?.id || null,
    name: credential?.name || '',
    host: credential?.host || '',
    port: credential?.port || 22,
    user: credential?.user || '',
    password: '',
    keyPath: credential?.keyPath || '',
    hasStoredPassword: Boolean(credential?.passwordMasked),
  };
}

export function AppSettingsModal({ isOpen, onClose, onStatusChange, onOpenLogsModal }) {
  const { colorScheme, setColorScheme, schemes, setShowStableIds } = useAppTheme();
  const [activeTab, setActiveTab] = useState('projects');
  const [status, setStatus] = useState('idle');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [credentialDraft, setCredentialDraft] = useState(() => buildCredentialDraft(null));
  const [credentialSaveStatus, setCredentialSaveStatus] = useState('idle');
  const [credentialTestStatus, setCredentialTestStatus] = useState('idle');
  const [credentialMessage, setCredentialMessage] = useState('');
  const [editableSettings, setEditableSettings] = useState(() => buildEditableSettings(null));
  const [projects, setProjects] = useState([]);
  const [pickerState, setPickerState] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    async function loadModalData() {
      setStatus('loading');
      setError(null);
      setActiveTab('projects');
      try {
        const [settingsPayload, credentialsPayload, projectsPayload] = await Promise.all([
          fetchJson('/api/settings'),
          fetchJson('/api/credentials'),
          fetchJson('/api/projects'),
        ]);
        if (cancelled) return;
        setEditableSettings(buildEditableSettings(settingsPayload));
        setCredentials(Array.isArray(credentialsPayload) ? credentialsPayload : []);
        setProjects(Array.isArray(projectsPayload) ? projectsPayload : []);
        setCredentialDraft(buildCredentialDraft(null));
        setCredentialSaveStatus('idle');
        setCredentialTestStatus('idle');
        setCredentialMessage('');
        setStatus('ready');
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError);
        setStatus('error');
      }
    }

    loadModalData();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const hasSettingsChanges = useMemo(() => {
    return (
      editableSettings.projectRoot !== '' ||
      editableSettings.dataDir !== '' ||
      editableSettings.logsDir !== '' ||
      editableSettings.fragmentsDirectiveProjectId !== '' ||
      editableSettings.shutdownLockedAppBeforeBuildDirectiveEnabled !== false ||
      editableSettings.showStableIds !== true ||
      editableSettings.githubApiBaseUrl !== '' ||
      editableSettings.githubToken !== '' ||
      editableSettings.webhookSecret !== ''
    );
  }, [editableSettings]);

  if (!isOpen) return null;

  async function reloadCredentials() {
    const payload = await fetchJson('/api/credentials');
    setCredentials(Array.isArray(payload) ? payload : []);
    return payload;
  }

  async function handleSaveCredential() {
    setCredentialSaveStatus('saving');
    setCredentialMessage('');
    try {
      const body = {
        name: credentialDraft.name.trim(),
        host: credentialDraft.host.trim(),
        port: Number(credentialDraft.port) || 22,
        user: credentialDraft.user.trim(),
        keyPath: credentialDraft.keyPath.trim() || null,
      };
      if (credentialDraft.password.trim() !== '') {
        body.password = credentialDraft.password;
      }
      if (!body.name || !body.host || !body.user) {
        throw new Error('Name, host, and user are required.');
      }

      if (credentialDraft.id) {
        await fetchJson(`/api/credentials/${credentialDraft.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        onStatusChange?.('Updated SFTP server.');
      } else {
        await fetchJson('/api/credentials', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        onStatusChange?.('Saved new SFTP server.');
      }

      await reloadCredentials();
      setCredentialDraft(buildCredentialDraft(null));
      setCredentialSaveStatus('saved');
      setCredentialMessage('Credential saved.');
    } catch (saveError) {
      console.error('Failed to save credential:', saveError);
      setCredentialSaveStatus('error');
      setCredentialMessage(saveError.message || 'Failed to save credential.');
    }
  }

  async function handleDeleteCredential(id) {
    try {
      await fetchJson(`/api/credentials/${id}`, { method: 'DELETE' });
      await reloadCredentials();
      if (credentialDraft.id === id) {
        setCredentialDraft(buildCredentialDraft(null));
      }
      setCredentialMessage('Credential deleted.');
      onStatusChange?.('Deleted SFTP server.');
    } catch (deleteError) {
      console.error('Failed to delete credential:', deleteError);
      setCredentialMessage(deleteError.message || 'Failed to delete credential.');
    }
  }

  async function handleTestCredential() {
    setCredentialTestStatus('saving');
    setCredentialMessage('');
    try {
      const payload = await fetchJson('/api/credentials/test', {
        method: 'POST',
        body: JSON.stringify({
          host: credentialDraft.host.trim(),
          port: Number(credentialDraft.port) || 22,
          user: credentialDraft.user.trim(),
          password: credentialDraft.password.trim() || null,
          keyPath: credentialDraft.keyPath.trim() || null,
        }),
      });
      setCredentialTestStatus('saved');
      setCredentialMessage(payload?.message || 'Connection successful.');
      onStatusChange?.('SFTP connection successful.');
    } catch (testError) {
      console.error('Failed to test credential:', testError);
      setCredentialTestStatus('error');
      setCredentialMessage(testError.message || 'Connection test failed.');
    }
  }

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const integrations = {
        githubApiBaseUrl: editableSettings.githubApiBaseUrl || 'https://api.github.com',
      };
      if (editableSettings.githubToken.trim() !== '') {
        integrations.githubToken = editableSettings.githubToken.trim();
      }
      if (editableSettings.webhookSecret.trim() !== '') {
        integrations.webhookSecret = editableSettings.webhookSecret.trim();
      }

      const savedSettings = await fetchJson('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({
          projects: {
            projectRoot: editableSettings.projectRoot,
            dataDir: editableSettings.dataDir,
            logsDir: editableSettings.logsDir,
          },
          ui: {
            showStableIds: editableSettings.showStableIds,
          },
          ai: {
            fragmentsDirectiveProjectId: editableSettings.fragmentsDirectiveProjectId,
            shutdownLockedAppBeforeBuildDirectiveEnabled: editableSettings.shutdownLockedAppBeforeBuildDirectiveEnabled,
          },
          integrations,
        }),
      });
      setShowStableIds?.(savedSettings?.ui?.showStableIds !== false);

      setEditableSettings((current) => ({
        ...current,
        githubToken: '',
        webhookSecret: '',
        githubTokenMasked: current.githubToken.trim() ? '********' : current.githubTokenMasked,
        webhookSecretConfigured: current.webhookSecret.trim() ? true : current.webhookSecretConfigured,
      }));
      setSaveStatus('saved');
      onStatusChange?.('Saved application settings.');
    } catch (saveError) {
      console.error('Failed to save app settings:', saveError);
      setSaveStatus('error');
      onStatusChange?.('Failed to save application settings.');
    }
  }

  const tabButtonClass = (tabKey) =>
    [
      'rounded-2xl border px-4 py-3 text-left text-sm transition',
      activeTab === tabKey
        ? 'border-accent/50 bg-accentSoft/80 text-white'
        : 'border-white/10 bg-white/5 text-sky-100/75 hover:border-accent/30 hover:bg-white/10',
    ].join(' ');

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate/80 px-4 py-6 backdrop-blur-md">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <DialogFrame
        eyebrow="Application Settings"
        title="Desktop app settings"
        description="This is the app-wide settings modal from the desktop shell. Project-level settings still live inside each project workspace."
        className="relative z-[1201] w-full max-w-6xl"
      >
        <div role="dialog" aria-modal="true" aria-label="Application settings" className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
            <nav className="space-y-2">
              <button type="button" className={tabButtonClass('projects')} onClick={() => setActiveTab('projects')}>
                Projects
              </button>
              <button type="button" className={tabButtonClass('appearance')} onClick={() => setActiveTab('appearance')}>
                Appearance
              </button>
              <button type="button" className={tabButtonClass('integrations')} onClick={() => setActiveTab('integrations')}>
                Integrations
              </button>
              <button type="button" className={tabButtonClass('sftp')} onClick={() => setActiveTab('sftp')}>
                SFTP Servers
              </button>
            </nav>

            <div className="min-h-[22rem] rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              {status === 'loading' ? (
                <p className="text-sm text-sky-100/75">Loading settings...</p>
              ) : status === 'error' ? (
                <p className="text-sm text-rose-200">{error ? error.message : 'Failed to load settings.'}</p>
              ) : (
                <>
                  {activeTab === 'projects' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Projects</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Project root</h3>
                        <p className="mt-2 text-sm leading-6 text-sky-100/75">
                          Set the top-level project root and the application data directory used for the app database, logs, fragments, and runtime assets.
                        </p>
                      </div>
                      <FilePathField
                        id="app-settings-project-root"
                        label="Project Root"
                        value={editableSettings.projectRoot}
                        onBrowse={() => setPickerState({
                          title: 'Choose project root',
                          description: 'Select the folder the desktop app should use as its project root.',
                          initialPath: editableSettings.projectRoot,
                          selectionMode: 'folder',
                          onSelect: (entry) => {
                            setEditableSettings((current) => ({
                              ...current,
                              projectRoot: entry.absolutePath,
                            }));
                          },
                        })}
                        help="This is the root folder the desktop app uses to resolve folder-based projects."
                      />
                      <FilePathField
                        id="app-settings-data-dir"
                        label="Data Directory"
                        value={editableSettings.dataDir}
                        onBrowse={() => setPickerState({
                          title: 'Choose data directory',
                          description: 'Select the folder the desktop app should use for its database, logs, fragments, and runtime data.',
                          initialPath: editableSettings.dataDir || editableSettings.projectRoot,
                          selectionMode: 'folder',
                          onSelect: (entry) => {
                            setEditableSettings((current) => ({
                              ...current,
                              dataDir: entry.absolutePath,
                            }));
                          },
                        })}
                        help="This is the application data folder. If it moves, the app will copy existing runtime data when possible."
                      />
                      <FilePathField
                        id="app-settings-logs-dir"
                        label="Log Directory"
                        value={editableSettings.logsDir}
                        onBrowse={() => setPickerState({
                          title: 'Choose log directory',
                          description: 'Select the folder the desktop app should use for current and archived logs.',
                          initialPath: editableSettings.logsDir || editableSettings.dataDir || editableSettings.projectRoot,
                          selectionMode: 'folder',
                          onSelect: (entry) => {
                            setEditableSettings((current) => ({
                              ...current,
                              logsDir: entry.absolutePath,
                            }));
                          },
                        })}
                        help="This is the logs folder. It contains the current TSV log and the Archive subfolder."
                      />
                      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <label className="block space-y-2 text-sm text-sky-100/75">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">Fragments Path</span>
                          <input
                            type="text"
                            value={editableSettings.fragmentsRootDir}
                            readOnly
                            className="w-full rounded-2xl border border-white/10 bg-slate/70 px-4 py-3 text-white/85 outline-none"
                          />
                        </label>
                        <label className="block space-y-2 text-sm text-sky-100/75">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">Directive Project</span>
                          <select
                            value={editableSettings.fragmentsDirectiveProjectId}
                            onChange={(event) =>
                              setEditableSettings((current) => ({ ...current, fragmentsDirectiveProjectId: event.target.value }))
                            }
                            className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                          >
                            <option value="">No project selected</option>
                            {projects.map((project) => (
                              <option key={project.id} value={project.id}>{project.name}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <p className="text-xs text-sky-100/60">
                        Only the selected project will receive the locked fragments directive in its generated AI environment.
                      </p>
                      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-sky-100/75">
                        <input
                          type="checkbox"
                          checked={editableSettings.shutdownLockedAppBeforeBuildDirectiveEnabled}
                          onChange={(event) =>
                            setEditableSettings((current) => ({
                              ...current,
                              shutdownLockedAppBeforeBuildDirectiveEnabled: event.target.checked,
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-slate text-accent"
                        />
                        <span>
                          <span className="block font-semibold text-white">Add build-lock shutdown directive</span>
                          <span className="mt-1 block text-xs leading-5 text-sky-100/60">
                            When enabled, the selected project AI Environment tells agents to shut down a running locked APM/Electron process before rebuilding or packaging.
                          </span>
                        </span>
                      </label>
                    </div>
                  ) : null}

                  {activeTab === 'appearance' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Appearance</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">UI skins</h3>
                        <p className="mt-2 text-sm leading-6 text-sky-100/75">
                          These are the original application skins restored into the Next desktop shell.
                        </p>
                      </div>
                      <div className="grid gap-3">
                        {Object.entries(schemes).map(([schemeId, scheme]) => {
                          const active = colorScheme === schemeId;
                          return (
                            <button
                              key={schemeId}
                              type="button"
                              onClick={() => {
                                setColorScheme(schemeId);
                                onStatusChange?.(`Applied ${scheme.label} skin.`);
                              }}
                              className={[
                                'rounded-2xl border px-4 py-4 text-left transition',
                                active
                                  ? 'border-accent/50 bg-accentSoft/80 text-white'
                                  : 'border-white/10 bg-white/5 text-sky-100/80 hover:border-accent/30 hover:bg-white/10',
                              ].join(' ')}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className={`theme-swatch theme-swatch--${schemeId}`} aria-hidden="true" />
                                  <div>
                                    <p className="text-sm font-semibold">{scheme.label}</p>
                                    <p className="mt-1 text-xs text-sky-100/65">Scheme key: {schemeId}</p>
                                  </div>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">
                                  {active ? 'Active' : 'Select'}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-sky-100/75">
                        <input
                          type="checkbox"
                          checked={editableSettings.showStableIds}
                          onChange={(event) =>
                            setEditableSettings((current) => ({
                              ...current,
                              showStableIds: event.target.checked,
                            }))
                          }
                          className="mt-1 h-4 w-4 rounded border-white/20 bg-slate text-accent"
                        />
                        <span>
                          <span className="block font-semibold text-white">Show document and canvas IDs</span>
                          <span className="mt-1 block text-xs leading-5 text-sky-100/60">
                            Hide stable IDs from the visual UI when you want less clutter. IDs remain stored in the database, documents, fragments, and canvas data.
                          </span>
                        </span>
                      </label>
                    </div>
                  ) : null}

                  {activeTab === 'integrations' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">Integrations</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">GitHub and webhook defaults</h3>
                      </div>
                      <label className="block space-y-2 text-sm text-sky-100/75">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">GitHub API Base URL</span>
                        <input
                          type="text"
                          value={editableSettings.githubApiBaseUrl}
                          onChange={(event) =>
                            setEditableSettings((current) => ({ ...current, githubApiBaseUrl: event.target.value }))
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                        />
                      </label>
                      <label className="block space-y-2 text-sm text-sky-100/75">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">GitHub Token</span>
                        <input
                          type="password"
                          value={editableSettings.githubToken}
                          onChange={(event) =>
                            setEditableSettings((current) => ({ ...current, githubToken: event.target.value }))
                          }
                          placeholder={editableSettings.githubTokenMasked ? 'Leave blank to keep current token' : 'Optional'}
                          className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                        />
                        <p className="text-xs text-sky-100/60">
                          {editableSettings.githubTokenMasked
                            ? 'A GitHub token is already configured. Leave this blank to keep it.'
                            : 'Used for GitHub issues and pull requests.'}
                        </p>
                      </label>
                      <label className="block space-y-2 text-sm text-sky-100/75">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/60">Webhook Secret</span>
                        <input
                          type="password"
                          value={editableSettings.webhookSecret}
                          onChange={(event) =>
                            setEditableSettings((current) => ({ ...current, webhookSecret: event.target.value }))
                          }
                          placeholder={editableSettings.webhookSecretConfigured ? 'Leave blank to keep current secret' : 'Optional'}
                          className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                        />
                        <p className="text-xs text-sky-100/60">
                          {editableSettings.webhookSecretConfigured
                            ? 'A webhook secret is already configured. Leave this blank to keep it.'
                            : 'Optional shared secret expected in x-apm-webhook-secret.'}
                        </p>
                      </label>
                    </div>
                  ) : null}

                  {activeTab === 'sftp' ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/60">SFTP Servers</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">Saved server connections</h3>
                        <p className="mt-2 text-sm leading-6 text-sky-100/75">
                          Manage SFTP credentials here, then associate them with projects in project settings or use them in the SFTP workspace.
                        </p>
                      </div>
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-3 rounded-2xl border border-white/10 bg-slate/70 p-4">
                          <div className="grid gap-3 md:grid-cols-2">
                            <input
                              className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                              placeholder="Server name"
                              value={credentialDraft.name}
                              onChange={(event) => setCredentialDraft((current) => ({ ...current, name: event.target.value }))}
                            />
                            <input
                              className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                              placeholder="Host"
                              value={credentialDraft.host}
                              onChange={(event) => setCredentialDraft((current) => ({ ...current, host: event.target.value }))}
                            />
                            <input
                              className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                              placeholder="Port"
                              type="number"
                              value={credentialDraft.port}
                              onChange={(event) => setCredentialDraft((current) => ({ ...current, port: event.target.value }))}
                            />
                            <input
                              className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60"
                              placeholder="User"
                              value={credentialDraft.user}
                              onChange={(event) => setCredentialDraft((current) => ({ ...current, user: event.target.value }))}
                            />
                            <input
                              className="w-full rounded-2xl border border-white/10 bg-slate px-4 py-3 text-white outline-none focus:border-accent/60 md:col-span-2"
                              placeholder={credentialDraft.hasStoredPassword ? 'Password (leave blank to keep current)' : 'Password'}
                              type="password"
                              value={credentialDraft.password}
                              onChange={(event) => setCredentialDraft((current) => ({ ...current, password: event.target.value }))}
                            />
                            <div className="md:col-span-2">
                              <FilePathField
                                id="app-settings-credential-key-path"
                                label="Key Path"
                                value={credentialDraft.keyPath}
                                onBrowse={() => setPickerState({
                                  title: 'Choose private key file',
                                  description: 'Select the private key file to use for this SFTP server.',
                                  initialPath: credentialDraft.keyPath || editableSettings.projectRoot,
                                  includeFiles: true,
                                  selectionMode: 'file',
                                  onSelect: (entry) => {
                                    setCredentialDraft((current) => ({ ...current, keyPath: entry.absolutePath }));
                                  },
                                })}
                                help="Optional path to a private key file."
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <ActionButton variant="subtle" onClick={handleTestCredential} disabled={credentialTestStatus === 'saving'}>
                              {credentialTestStatus === 'saving' ? 'Testing...' : 'Test Connection'}
                            </ActionButton>
                            <ActionButton variant="accent" onClick={handleSaveCredential} disabled={credentialSaveStatus === 'saving'}>
                              {credentialSaveStatus === 'saving'
                                ? 'Saving...'
                                : credentialDraft.id
                                  ? 'Update Server'
                                  : 'Add Server'}
                            </ActionButton>
                            <ActionButton
                              variant="ghost"
                              onClick={() => {
                                setCredentialDraft(buildCredentialDraft(null));
                                setCredentialMessage('');
                                setCredentialSaveStatus('idle');
                                setCredentialTestStatus('idle');
                              }}
                            >
                              Clear
                            </ActionButton>
                          </div>

                          {credentialMessage ? (
                            <p className="text-sm text-sky-100/75">{credentialMessage}</p>
                          ) : null}
                        </div>

                        <div className="space-y-3">
                          {credentials.length > 0 ? (
                            credentials.map((credential) => (
                              <div key={credential.id} className="rounded-2xl border border-white/10 bg-slate/70 p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white">{credential.name}</p>
                                    <p className="mt-1 break-words text-xs text-sky-100/70">
                                      {credential.user}@{credential.host}:{credential.port}
                                    </p>
                                    <p className="mt-2 break-words text-xs text-sky-100/60">
                                      {credential.keyPath ? `Key: ${credential.keyPath}` : credential.passwordMasked ? 'Password saved' : 'No password saved'}
                                    </p>
                                  </div>
                                  <div className="flex gap-2">
                                    <ActionButton
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setCredentialDraft(buildCredentialDraft(credential));
                                        setCredentialMessage('');
                                        setCredentialSaveStatus('idle');
                                        setCredentialTestStatus('idle');
                                      }}
                                    >
                                      Edit
                                    </ActionButton>
                                    <ActionButton
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteCredential(credential.id)}
                                    >
                                      Delete
                                    </ActionButton>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-sky-100/75">No SFTP servers are saved yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null}

                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-sky-100/65">
              {saveStatus === 'saving'
                ? 'Saving settings...'
                : saveStatus === 'saved'
                  ? 'Settings saved.'
                  : hasSettingsChanges
                    ? 'Changes in this modal affect the whole desktop app.'
                    : 'App settings are loaded from the current desktop backend.'}
            </p>
            <div className="flex gap-3">
              <ActionButton variant="ghost" onClick={onClose}>
                Close
              </ActionButton>
              <ActionButton variant="accent" onClick={handleSave} disabled={status !== 'ready' || saveStatus === 'saving'}>
                {saveStatus === 'saving' ? 'Saving...' : 'Save settings'}
              </ActionButton>
            </div>
          </div>
        </div>
      </DialogFrame>

      <FileExplorerModal
        isOpen={Boolean(pickerState)}
        title={pickerState?.title || 'Choose path'}
        description={pickerState?.description || 'Browse folders and files, or paste a path directly.'}
        initialPath={pickerState?.initialPath || editableSettings.projectRoot}
        includeFiles={Boolean(pickerState?.includeFiles)}
        selectionMode={pickerState?.selectionMode || 'folder'}
        onClose={() => setPickerState(null)}
        onSelect={(entry) => {
          pickerState?.onSelect?.(entry);
          setPickerState(null);
        }}
      />
    </div>
  );
}
