const API = '/api';

const COLOR_SCHEME_KEY = 'colorScheme';
const SCHEMES = {
  'cyan-glow': { label: 'Cyan Glow', backgroundColor: '#0c1222' },
  'dark-blue': { label: 'Dark Blue', backgroundColor: '#0a0f1a' },
  'app-icon': { label: 'App Icon', backgroundColor: '#16122a' },
};

let projectsRoot = '';
let appSettings = {
  projects: { projectRoot: '', dataDir: '' },
  integrations: { githubApiBaseUrl: 'https://api.github.com' },
};
let projects = [];
let credentials = [];
let contextMenuProjectId = null;
let selectedProjectId = null;
let browseState = { path: '', absolute: '', dirs: [] };
let browseStateSettings = { path: '', absolute: '', dirs: [] };
let browseStateLink = { path: '', absolute: '', dirs: [], files: [], selectedPath: '', selectedType: 'directory' };
let pendingTestConnection = null;
const taskState = {
  project: null,
  tasks: [],
  view: 'roadmap',
};

const phase5State = {
  projectId: null,
  roadmap: null,
  roadmapPanel: 'general',
  roadmapPhasePanel: 'planner',
  roadmapBucketTabs: {
    planned: 'features',
    considered: 'features',
  },
  selectedRoadmapFragmentId: null,
  features: null,
  bugs: null,
  prd: null,
  architecture: null,
  databaseSchema: null,
  selectedPrdFragmentId: null,
  mermaid: null,
};

const autosaveState = {
  pendingWrites: 0,
  state: 'saved',
  message: 'Saved',
};

const integrationState = {
  projectId: null,
  git: null,
  github: null,
  events: [],
};

const sftpState = {
  project: null,
  credId: null,
  status: 'disconnected',
  localSelected: null,
  remoteSelected: null,
  mappings: [],
  downloadMappings: [],
  mappingGroups: [],
  selectedGroupId: null,
  localCurrentPath: null,
  remoteCurrentPath: '/',
  localListing: null,
  remoteListing: null,
  overwriteResolve: null,
  editingMappingIndex: null,
  editingDownloadMappingIndex: null,
  downloadRemotePath: null,
  downloadRemoteType: null,
  groupNameModalResolve: null,
};

function setSftpStatus(status) {
  sftpState.status = status;
  const wrap = el.sftpStatus;
  if (!wrap) return;
  const dot = wrap.querySelector('.sftp-status-dot');
  if (dot) {
    dot.className = 'sftp-status-dot sftp-status-' + status;
    wrap.title = status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting…' : 'Disconnected';
  }
}

const el = {
  projectView: document.querySelector('.project-view'),
  projectsList: document.getElementById('projects-list'),
  projectScreen: document.getElementById('project-screen'),
  projectScreenCard: document.getElementById('project-screen-card'),
  btnProjectScreenBack: document.getElementById('btn-project-screen-back'),
  workspaceDesignerKicker: document.getElementById('workspace-designer-kicker'),
  workspaceDesignerTitle: document.getElementById('workspace-designer-title'),
  workspaceDesignerSummary: document.getElementById('workspace-designer-summary'),
  workspaceDesignerNav: document.getElementById('workspace-designer-nav'),
  taskWorkspaceKicker: document.getElementById('task-workspace-kicker'),
  taskWorkspaceTitle: document.getElementById('task-workspace-title'),
  taskWorkspaceViewDescription: document.getElementById('task-workspace-view-description'),
  projectsRoot: document.getElementById('projects-root'),
  toolbarSearch: document.getElementById('toolbar-search'),
  toolbarSort: document.getElementById('toolbar-sort'),
  toolbarView: document.getElementById('toolbar-view'),
  toolbarGroup: document.getElementById('toolbar-group'),
  btnAddProject: document.getElementById('btn-add-project'),
  modalProject: document.getElementById('modal-project'),
  modalProjectTitle: document.getElementById('modal-project-title'),
  formProject: document.getElementById('form-project'),
  projectId: document.getElementById('project-id'),
  projectParentId: document.getElementById('project-parent-id'),
  projectPath: document.getElementById('project-path'),
  projectUrl: document.getElementById('project-url'),
  projectTypeFolder: document.querySelector('input[name="project-type"][value="folder"]'),
  projectTypeUrl: document.querySelector('input[name="project-type"][value="url"]'),
  fieldProjectType: document.getElementById('field-project-type'),
  fieldProjectPath: document.getElementById('field-project-path'),
  fieldProjectUrl: document.getElementById('field-project-url'),
  projectName: document.getElementById('project-name'),
  projectDescription: document.getElementById('project-description'),
  projectCategory: document.getElementById('project-category'),
  projectCategoryList: document.getElementById('project-category-list'),
  projectTagsChips: document.getElementById('project-tags-chips'),
  projectTagsInput: document.getElementById('project-tags-input'),
  projectTagsSuggestions: document.getElementById('project-tags-suggestions'),
  btnBrowse: document.getElementById('btn-browse'),
  browsePanel: document.getElementById('browse-panel'),
  browseCurrent: document.getElementById('browse-current'),
  browseDirs: document.getElementById('browse-dirs'),
  browseUp: document.getElementById('browse-up'),
  browseSelect: document.getElementById('browse-select'),
  btnCancelProject: document.getElementById('btn-cancel-project'),
  modalProjectSettings: document.getElementById('modal-project-settings'),
  formProjectSettings: document.getElementById('form-project-settings'),
  projectSettingsId: document.getElementById('project-settings-id'),
  projectSettingsPrimaryAction: document.getElementById('project-settings-primary-action'),
  projectSettingsPath: document.getElementById('project-settings-path'),
  projectSettingsUrl: document.getElementById('project-settings-url'),
  fieldProjectSettingsPath: document.getElementById('field-project-settings-path'),
  fieldProjectSettingsUrl: document.getElementById('field-project-settings-url'),
  projectSettingsImageFile: document.getElementById('project-settings-image-file'),
  projectSettingsImageUrl: document.getElementById('project-settings-image-url'),
  projectSettingsImageSourceLocal: document.querySelector('input[name="project-image-source"][value="local"]'),
  projectSettingsImageSourceUrl: document.querySelector('input[name="project-image-source"][value="url"]'),
  fieldProjectSettingsImageLocal: document.getElementById('field-project-settings-image-local'),
  fieldProjectSettingsImageUrl: document.getElementById('field-project-settings-image-url'),
  btnProjectSettingsImage: document.getElementById('btn-project-settings-image'),
  btnProjectSettingsRemoveImage: document.getElementById('btn-project-settings-remove-image'),
  modalCropImage: document.getElementById('modal-crop-image'),
  cropViewport: document.getElementById('crop-viewport'),
  cropImage: document.getElementById('crop-image'),
  cropZoom: document.getElementById('crop-zoom'),
  cropZoomValue: document.getElementById('crop-zoom-value'),
  cropPanX: document.getElementById('crop-pan-x'),
  cropPanY: document.getElementById('crop-pan-y'),
  btnCropCancel: document.getElementById('btn-crop-cancel'),
  btnCropApply: document.getElementById('btn-crop-apply'),
  projectSettingsDescription: document.getElementById('project-settings-description'),
  projectSettingsCategory: document.getElementById('project-settings-category'),
  projectSettingsCategoryList: document.getElementById('project-settings-category-list'),
  projectSettingsTagsChips: document.getElementById('project-settings-tags-chips'),
  projectSettingsTagsInput: document.getElementById('project-settings-tags-input'),
  projectSettingsTagsSuggestions: document.getElementById('project-settings-tags-suggestions'),
  projectSettingsLinksList: document.getElementById('project-settings-links-list'),
  btnProjectSettingsAddLink: document.getElementById('btn-project-settings-add-link'),
  modalLink: document.getElementById('modal-link'),
  linkDescription: document.getElementById('link-description'),
  linkTypeUrl: document.querySelector('input[name="link-type"][value="url"]'),
  linkTypeFile: document.querySelector('input[name="link-type"][value="file"]'),
  linkUrl: document.getElementById('link-url'),
  linkPath: document.getElementById('link-path'),
  linkAction: document.getElementById('link-action'),
  fieldLinkUrl: document.getElementById('field-link-url'),
  fieldLinkPath: document.getElementById('field-link-path'),
  btnLinkBrowse: document.getElementById('btn-link-browse'),
  linkBrowsePanel: document.getElementById('link-browse-panel'),
  linkBrowseCurrent: document.getElementById('link-browse-current'),
  linkBrowseDirs: document.getElementById('link-browse-dirs'),
  linkBrowseUp: document.getElementById('link-browse-up'),
  linkBrowseSelection: document.getElementById('link-browse-selection'),
  linkBrowseSelectFolder: document.getElementById('link-browse-select-folder'),
  linkBrowseSelect: document.getElementById('link-browse-select'),
  btnLinkCancel: document.getElementById('btn-link-cancel'),
  btnLinkSave: document.getElementById('btn-link-save'),
  modalPlugin: document.getElementById('modal-plugin'),
  modalPluginTitle: document.getElementById('modal-plugin-title'),
  pluginName: document.getElementById('plugin-name'),
  pluginType: document.getElementById('plugin-type'),
  pluginTargetUrl: document.getElementById('plugin-target-url'),
  pluginMethod: document.getElementById('plugin-method'),
  pluginHeaders: document.getElementById('plugin-headers'),
  pluginIncludeProjectContext: document.getElementById('plugin-include-project-context'),
  fieldPluginMethod: document.getElementById('field-plugin-method'),
  fieldPluginHeaders: document.getElementById('field-plugin-headers'),
  fieldPluginProjectContext: document.getElementById('field-plugin-project-context'),
  btnPluginCancel: document.getElementById('btn-plugin-cancel'),
  btnPluginSave: document.getElementById('btn-plugin-save'),
  projectSettingsServer: document.getElementById('project-settings-server'),
  projectSettingsGithubEnabled: document.getElementById('project-settings-github-enabled'),
  projectSettingsGithubOwner: document.getElementById('project-settings-github-owner'),
  projectSettingsGithubRepo: document.getElementById('project-settings-github-repo'),
  projectSettingsWebhookAutoTasks: document.getElementById('project-settings-webhook-auto-tasks'),
  projectSettingsWebhookStatus: document.getElementById('project-settings-webhook-status'),
  projectSettingsWebhookPrefix: document.getElementById('project-settings-webhook-prefix'),
  projectSettingsPluginsList: document.getElementById('project-settings-plugins-list'),
  btnProjectSettingsAddPlugin: document.getElementById('btn-project-settings-add-plugin'),
  btnProjectSettingsBrowse: document.getElementById('btn-project-settings-browse'),
  projectSettingsBrowsePanel: document.getElementById('project-settings-browse-panel'),
  projectSettingsBrowseCurrent: document.getElementById('project-settings-browse-current'),
  projectSettingsBrowseDirs: document.getElementById('project-settings-browse-dirs'),
  projectSettingsBrowseUp: document.getElementById('project-settings-browse-up'),
  projectSettingsBrowseSelect: document.getElementById('project-settings-browse-select'),
  btnCancelProjectSettings: document.getElementById('btn-cancel-project-settings'),
  projectContextMenu: document.getElementById('project-context-menu'),
  projectContextPin: document.getElementById('project-context-pin'),
  projectContextUnpin: document.getElementById('project-context-unpin'),
  projectContextOpenCursor: document.getElementById('project-context-open-cursor'),
  projectContextOpenExplorer: document.getElementById('project-context-open-explorer'),
  projectContextSettings: document.getElementById('project-context-settings'),
  projectContextSftp: document.getElementById('project-context-sftp'),
  projectContextAddSubproject: document.getElementById('project-context-add-subproject'),
  projectContextRemove: document.getElementById('project-context-remove'),
  menuSettings: document.getElementById('menu-settings'),
  menuViewLogs: document.getElementById('menu-view-logs'),
  menuRestartApp: document.getElementById('menu-restart-app'),
  modalSettings: document.getElementById('modal-settings'),
  settingsProjectRoot: document.getElementById('settings-project-root'),
  settingsColorScheme: document.getElementById('settings-color-scheme'),
  settingsGithubApiBaseUrl: document.getElementById('settings-github-api-base-url'),
  settingsGithubToken: document.getElementById('settings-github-token'),
  settingsGithubTokenHint: document.getElementById('settings-github-token-hint'),
  settingsWebhookSecret: document.getElementById('settings-webhook-secret'),
  settingsWebhookSecretHint: document.getElementById('settings-webhook-secret-hint'),
  titleBar: document.getElementById('title-bar'),
  titleBarMinimize: document.getElementById('title-bar-minimize'),
  titleBarMaximize: document.getElementById('title-bar-maximize'),
  titleBarClose: document.getElementById('title-bar-close'),
  settingsServersList: document.getElementById('settings-servers-list'),
  modalSettingsServer: document.getElementById('modal-settings-server'),
  modalSettingsServerTitle: document.getElementById('modal-settings-server-title'),
  btnSettingsAddServer: document.getElementById('btn-settings-add-server'),
  btnSettingsServerCancel: document.getElementById('btn-settings-server-cancel'),
  btnSettingsTestConnection: document.getElementById('btn-settings-test-connection'),
  modalTestConnectionPassword: document.getElementById('modal-test-connection-password'),
  testConnectionLabel: document.getElementById('test-connection-label'),
  testConnectionPasswordInput: document.getElementById('test-connection-password-input'),
  btnTestConnectionCancel: document.getElementById('btn-test-connection-cancel'),
  btnTestConnectionSubmit: document.getElementById('btn-test-connection-submit'),
  settingsCredId: document.getElementById('settings-cred-id'),
  settingsCredName: document.getElementById('settings-cred-name'),
  settingsCredHost: document.getElementById('settings-cred-host'),
  settingsCredPort: document.getElementById('settings-cred-port'),
  settingsCredUser: document.getElementById('settings-cred-user'),
  settingsCredPassword: document.getElementById('settings-cred-password'),
  settingsCredKey: document.getElementById('settings-cred-key'),
  btnSettingsSaveServer: document.getElementById('btn-settings-save-server'),
  btnSettingsClearServer: document.getElementById('btn-settings-clear-server'),
  btnCancelSettings: document.getElementById('btn-cancel-settings'),
  btnSaveSettings: document.getElementById('btn-save-settings'),
  taskWorkspaceSummary: document.getElementById('task-workspace-summary'),
  btnTaskAdd: document.getElementById('btn-task-add'),
  autosaveStatus: document.getElementById('autosave-status'),
  autosaveStatusText: document.getElementById('autosave-status-text'),
  taskDeadlineAlerts: document.getElementById('task-deadline-alerts'),
  taskPhase3Sidebar: document.getElementById('task-phase3-sidebar'),
  taskBoard: document.getElementById('task-board'),
  taskTimeline: document.getElementById('task-timeline'),
  moduleDesignerSurface: document.getElementById('module-designer-surface'),
  roadmapVersion: document.getElementById('roadmap-version'),
  roadmapExecutiveSummary: document.getElementById('roadmap-executive-summary'),
  roadmapGeneralFlowchart: document.getElementById('roadmap-general-flowchart'),
  roadmapPhaseFlowchart: document.getElementById('roadmap-phase-flowchart'),
  roadmapPlannedItems: document.getElementById('roadmap-planned-items'),
  roadmapConsideredItems: document.getElementById('roadmap-considered-items'),
  roadmapArchivedPhaseList: document.getElementById('roadmap-archived-phase-list'),
  roadmapArchivedFragmentList: document.getElementById('roadmap-archived-fragment-list'),
  btnRoadmapMergeFragments: document.getElementById('btn-roadmap-merge-fragments'),
  btnRoadmapPhaseAdd: document.getElementById('btn-roadmap-phase-add'),
  roadmapPhaseList: document.getElementById('roadmap-phase-list'),
  btnRoadmapFragmentsRefresh: document.getElementById('btn-roadmap-fragments-refresh'),
  roadmapFragmentList: document.getElementById('roadmap-fragment-list'),
  roadmapFragmentPreview: document.getElementById('roadmap-fragment-preview'),
  workspacePluginManager: document.getElementById('workspace-plugin-manager'),
  btnRoadmapRefresh: document.getElementById('btn-roadmap-refresh'),
  roadmapMarkdownPreview: document.getElementById('roadmap-markdown-preview'),
  roadmapMermaid: document.getElementById('roadmap-mermaid'),
  roadmapMermaidPreview: document.getElementById('roadmap-mermaid-preview'),
  btnFeatureAdd: document.getElementById('btn-feature-add'),
  featureList: document.getElementById('feature-list'),
  featuresMarkdownPreview: document.getElementById('features-markdown-preview'),
  featuresMermaid: document.getElementById('features-mermaid'),
  featuresMermaidPreview: document.getElementById('features-mermaid-preview'),
  btnBugAdd: document.getElementById('btn-bug-add'),
  bugList: document.getElementById('bug-list'),
  bugsMarkdownPreview: document.getElementById('bugs-markdown-preview'),
  bugsMermaid: document.getElementById('bugs-mermaid'),
  bugsMermaidPreview: document.getElementById('bugs-mermaid-preview'),
  btnPrdSave: document.getElementById('btn-prd-save'),
  btnPrdFragmentsRefresh: document.getElementById('btn-prd-fragments-refresh'),
  prdEditorBuilder: document.getElementById('prd-editor-builder'),
  prdMarkdownPreview: document.getElementById('prd-markdown-preview'),
  prdMermaid: document.getElementById('prd-mermaid'),
  prdMermaidPreview: document.getElementById('prd-mermaid-preview'),
  prdFragmentList: document.getElementById('prd-fragment-list'),
  prdFragmentPreview: document.getElementById('prd-fragment-preview'),
  btnIntegrationRefreshGit: document.getElementById('btn-integration-refresh-git'),
  btnIntegrationRefreshGithub: document.getElementById('btn-integration-refresh-github'),
  btnIntegrationRefreshEvents: document.getElementById('btn-integration-refresh-events'),
  integrationGitSummary: document.getElementById('integration-git-summary'),
  btnGitFetch: document.getElementById('btn-git-fetch'),
  btnGitPull: document.getElementById('btn-git-pull'),
  btnGitPush: document.getElementById('btn-git-push'),
  integrationBranchSelect: document.getElementById('integration-branch-select'),
  btnGitCheckout: document.getElementById('btn-git-checkout'),
  integrationBranchCreate: document.getElementById('integration-branch-create'),
  btnGitCreateBranch: document.getElementById('btn-git-create-branch'),
  integrationMergeBranch: document.getElementById('integration-merge-branch'),
  btnGitMerge: document.getElementById('btn-git-merge'),
  btnGitAbortMerge: document.getElementById('btn-git-abort-merge'),
  integrationGitConflicts: document.getElementById('integration-git-conflicts'),
  integrationGithubSummary: document.getElementById('integration-github-summary'),
  integrationGithubIssues: document.getElementById('integration-github-issues'),
  integrationGithubPulls: document.getElementById('integration-github-pulls'),
  integrationIssueTitle: document.getElementById('integration-issue-title'),
  integrationIssueBody: document.getElementById('integration-issue-body'),
  btnGithubCreateIssue: document.getElementById('btn-github-create-issue'),
  integrationPrTitle: document.getElementById('integration-pr-title'),
  integrationPrHead: document.getElementById('integration-pr-head'),
  integrationPrBase: document.getElementById('integration-pr-base'),
  integrationPrBody: document.getElementById('integration-pr-body'),
  btnGithubCreatePr: document.getElementById('btn-github-create-pr'),
  btnToolExplorer: document.getElementById('btn-tool-explorer'),
  btnToolCursor: document.getElementById('btn-tool-cursor'),
  btnToolVscode: document.getElementById('btn-tool-vscode'),
  btnToolTerminal: document.getElementById('btn-tool-terminal'),
  btnToolChrome: document.getElementById('btn-tool-chrome'),
  integrationWebhookSummary: document.getElementById('integration-webhook-summary'),
  integrationWebhookUrl: document.getElementById('integration-webhook-url'),
  integrationPluginList: document.getElementById('integration-plugin-list'),
  integrationEventsList: document.getElementById('integration-events-list'),
  modalTaskEditor: document.getElementById('modal-task-editor'),
  taskEditorTitle: document.getElementById('task-editor-title'),
  formTaskEditor: document.getElementById('form-task-editor'),
  taskEditorId: document.getElementById('task-editor-id'),
  taskEditorTitleInput: document.getElementById('task-editor-title-input'),
  taskEditorDescription: document.getElementById('task-editor-description'),
  taskEditorStatus: document.getElementById('task-editor-status'),
  taskEditorPriority: document.getElementById('task-editor-priority'),
  taskEditorCategory: document.getElementById('task-editor-category'),
  taskEditorProgress: document.getElementById('task-editor-progress'),
  taskEditorAssignee: document.getElementById('task-editor-assignee'),
  taskEditorDueDate: document.getElementById('task-editor-due-date'),
  taskEditorMilestone: document.getElementById('task-editor-milestone'),
  taskEditorStartDate: document.getElementById('task-editor-start-date'),
  taskEditorEndDate: document.getElementById('task-editor-end-date'),
  taskEditorRoadmapPhase: document.getElementById('task-editor-roadmap-phase'),
  taskEditorPlanningBucket: document.getElementById('task-editor-planning-bucket'),
  taskEditorDependencies: document.getElementById('task-editor-dependencies'),
  btnTaskEditorCancel: document.getElementById('btn-task-editor-cancel'),
  projectSettingsSoftwareModules: document.getElementById('project-settings-software-modules'),
  modalRoadmapPhase: document.getElementById('modal-roadmap-phase'),
  formRoadmapPhase: document.getElementById('form-roadmap-phase'),
  roadmapPhaseId: document.getElementById('roadmap-phase-id'),
  roadmapPhaseName: document.getElementById('roadmap-phase-name'),
  roadmapPhaseGoal: document.getElementById('roadmap-phase-goal'),
  roadmapPhaseSummary: document.getElementById('roadmap-phase-summary'),
  roadmapPhaseStatus: document.getElementById('roadmap-phase-status'),
  roadmapPhaseTargetDate: document.getElementById('roadmap-phase-target-date'),
  roadmapPhaseAfter: document.getElementById('roadmap-phase-after'),
  roadmapPhaseArchived: document.getElementById('roadmap-phase-archived'),
  btnRoadmapPhaseCancel: document.getElementById('btn-roadmap-phase-cancel'),
  modalFeature: document.getElementById('modal-feature'),
  formFeature: document.getElementById('form-feature'),
  featureId: document.getElementById('feature-id'),
  featureTitle: document.getElementById('feature-title'),
  featureSummary: document.getElementById('feature-summary'),
  featureStatus: document.getElementById('feature-status'),
  featurePriority: document.getElementById('feature-priority'),
  featureCategory: document.getElementById('feature-category'),
  featureProgress: document.getElementById('feature-progress'),
  featureAssignedTo: document.getElementById('feature-assigned-to'),
  featureDueDate: document.getElementById('feature-due-date'),
  featureMilestone: document.getElementById('feature-milestone'),
  featureStartDate: document.getElementById('feature-start-date'),
  featureEndDate: document.getElementById('feature-end-date'),
  featureRoadmapPhase: document.getElementById('feature-roadmap-phase'),
  featurePlanningBucket: document.getElementById('feature-planning-bucket'),
  featureDependencies: document.getElementById('feature-dependencies'),
  featureArchived: document.getElementById('feature-archived'),
  btnFeatureCancel: document.getElementById('btn-feature-cancel'),
  modalBug: document.getElementById('modal-bug'),
  formBug: document.getElementById('form-bug'),
  bugId: document.getElementById('bug-id'),
  bugTitle: document.getElementById('bug-title'),
  bugCurrentBehavior: document.getElementById('bug-current-behavior'),
  bugExpectedBehavior: document.getElementById('bug-expected-behavior'),
  bugStatus: document.getElementById('bug-status'),
  bugSeverity: document.getElementById('bug-severity'),
  bugCategory: document.getElementById('bug-category'),
  bugPlanningBucket: document.getElementById('bug-planning-bucket'),
  bugRoadmapPhase: document.getElementById('bug-roadmap-phase'),
  bugProgress: document.getElementById('bug-progress'),
  bugAssignedTo: document.getElementById('bug-assigned-to'),
  bugDueDate: document.getElementById('bug-due-date'),
  bugMilestone: document.getElementById('bug-milestone'),
  bugStartDate: document.getElementById('bug-start-date'),
  bugEndDate: document.getElementById('bug-end-date'),
  bugDependencies: document.getElementById('bug-dependencies'),
  bugCompleted: document.getElementById('bug-completed'),
  bugRegressed: document.getElementById('bug-regressed'),
  bugArchived: document.getElementById('bug-archived'),
  btnBugCancel: document.getElementById('btn-bug-cancel'),
  modalRoadmapFragments: document.getElementById('modal-roadmap-fragments'),
  roadmapFragmentMergeList: document.getElementById('roadmap-fragment-merge-list'),
  btnRoadmapFragmentsClose: document.getElementById('btn-roadmap-fragments-close'),
  modalFragmentPreview: document.getElementById('modal-fragment-preview'),
  fragmentPreviewTitle: document.getElementById('fragment-preview-title'),
  fragmentPreviewMeta: document.getElementById('fragment-preview-meta'),
  fragmentPreviewBody: document.getElementById('fragment-preview-body'),
  btnFragmentPreviewClose: document.getElementById('btn-fragment-preview-close'),
  modalWorkItemDetail: document.getElementById('modal-work-item-detail'),
  workItemDetailTitle: document.getElementById('work-item-detail-title'),
  workItemDetailBody: document.getElementById('work-item-detail-body'),
  btnWorkItemDetailEdit: document.getElementById('btn-work-item-detail-edit'),
  btnWorkItemDetailClose: document.getElementById('btn-work-item-detail-close'),
  modalCredentials: document.getElementById('modal-credentials'),
  credentialsList: document.getElementById('credentials-list'),
  formCredential: document.getElementById('form-credential'),
  btnCloseCredentials: document.getElementById('btn-close-credentials'),
  modalSftp: document.getElementById('modal-sftp'),
  sftpStatus: document.getElementById('sftp-status'),
  sftpModalTitle: document.getElementById('sftp-modal-title'),
  sftpLocalPathbar: document.getElementById('sftp-local-pathbar'),
  sftpRemotePathbar: document.getElementById('sftp-remote-pathbar'),
  sftpListLocalBody: document.getElementById('sftp-list-local-body'),
  sftpListRemoteBody: document.getElementById('sftp-list-remote-body'),
  sftpLocalActions: document.getElementById('sftp-local-actions'),
  sftpRemoteActions: document.getElementById('sftp-remote-actions'),
  sftpBtnSend: document.getElementById('sftp-btn-send'),
  sftpBtnAddDownloadMapping: document.getElementById('sftp-btn-add-download-mapping'),
  sftpDestOptions: document.getElementById('sftp-dest-options'),
  sftpOverwrite: document.getElementById('sftp-overwrite'),
  sftpAskOverwrite: document.getElementById('sftp-ask-overwrite'),
  sftpMappingsList: document.getElementById('sftp-mappings-list'),
  sftpBtnCancel: document.getElementById('sftp-btn-cancel'),
  sftpBtnSaveMappings: document.getElementById('sftp-btn-save-mappings'),
  sftpBtnUpdateMapping: document.getElementById('sftp-btn-update-mapping'),
  sftpBtnRun: document.getElementById('sftp-btn-run'),
  modalSftpProgress: document.getElementById('modal-sftp-progress'),
  sftpProgressLog: document.getElementById('sftp-progress-log'),
  sftpProgressClose: document.getElementById('sftp-progress-close'),
  modalSftpOverwrite: document.getElementById('modal-sftp-overwrite'),
  sftpOverwriteMessage: document.getElementById('sftp-overwrite-message'),
  sftpOverwriteNo: document.getElementById('sftp-overwrite-no'),
  sftpOverwriteYes: document.getElementById('sftp-overwrite-yes'),
  sftpRemoteContextMenu: document.getElementById('sftp-remote-context-menu'),
  sftpRemoteContextDownload: document.getElementById('sftp-remote-context-download'),
  sftpRemoteContextAddDownloadMapping: document.getElementById('sftp-remote-context-add-download-mapping'),
  modalSftpDownload: document.getElementById('modal-sftp-download'),
  sftpDownloadLocalPath: document.getElementById('sftp-download-local-path'),
  sftpDownloadBrowse: document.getElementById('sftp-download-browse'),
  sftpDownloadRemotePath: document.getElementById('sftp-download-remote-path'),
  sftpDownloadCancel: document.getElementById('sftp-download-cancel'),
  sftpDownloadRun: document.getElementById('sftp-download-run'),
  sftpDownloadBrowsePanel: document.getElementById('sftp-download-browse-panel'),
  sftpDownloadBrowseDirs: document.getElementById('sftp-download-browse-dirs'),
  sftpGroupSelect: document.getElementById('sftp-group-select'),
  sftpGroupAdd: document.getElementById('sftp-group-add'),
  sftpGroupEdit: document.getElementById('sftp-group-edit'),
  sftpGroupDelete: document.getElementById('sftp-group-delete'),
  sftpBtnRunDownload: document.getElementById('sftp-btn-run-download'),
  modalMappingGroupName: document.getElementById('modal-mapping-group-name'),
  mappingGroupNameTitle: document.getElementById('modal-mapping-group-name-title'),
  mappingGroupNameInput: document.getElementById('mapping-group-name-input'),
  mappingGroupNameCancel: document.getElementById('mapping-group-name-cancel'),
  mappingGroupNameOk: document.getElementById('mapping-group-name-ok'),
};

// Log every error to console and to the app log file (View → View Logs to open)
function logClientError(type, message, stack, source, lineno, colno) {
  const payload = { type, message: String(message || ''), stack: stack ? String(stack) : '', source: source || '', lineno: lineno ?? '', colno: colno ?? '' };
  console.error(`[${type}]`, message, stack || '');
  try {
    fetch(API + '/log-client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {
    console.error('Failed to send error to log:', e);
  }
}
if (typeof window !== 'undefined') {
  window.onerror = function(message, source, lineno, colno, error) {
    logClientError('error', message, error && error.stack, source, lineno, colno);
    return false;
  };
  window.onunhandledrejection = function(event) {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    logClientError('unhandledrejection', message, stack, '', '', '');
  };
}

async function fetchJSON(url, options = {}) {
  const method = String(options.method || 'GET').toUpperCase();
  const isWrite = method !== 'GET';
  if (isWrite) setAutosaveStatus('saving', 'Saving');
  try {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || res.statusText);
    }
    if (isWrite) setAutosaveStatus('saved', 'Saved');
    return res.json();
  } catch (error) {
    if (isWrite) setAutosaveStatus('failed', error.message || 'Save failed');
    throw error;
  }
}

function setAutosaveStatus(state, message) {
  autosaveState.state = state;
  autosaveState.message = message || state;
  if (state === 'saving') {
    autosaveState.pendingWrites += 1;
  } else if (autosaveState.pendingWrites > 0) {
    autosaveState.pendingWrites -= 1;
  }
  if (autosaveState.pendingWrites > 0) {
    autosaveState.state = 'saving';
    autosaveState.message = 'Saving';
  }
  if (el.autosaveStatus) el.autosaveStatus.dataset.saveState = autosaveState.state;
  if (el.autosaveStatusText) el.autosaveStatusText.textContent = autosaveState.message;
}

async function logUiEvent(tab, action, details = {}) {
  try {
    await fetchJSON(`${API}/ui-event`, {
      method: 'POST',
      body: JSON.stringify({
        tab,
        action,
        projectId: taskState.project ? taskState.project.id : null,
        details,
      }),
    });
  } catch (error) {
    console.warn('Failed to log UI event', tab, action, error);
  }
}

async function loadRoot() {
  try {
    const data = await fetchJSON(`${API}/roots`);
    projectsRoot = (data && data.projectsRoot != null) ? String(data.projectsRoot) : '';
    if (el.projectsRoot) el.projectsRoot.textContent = projectsRoot;
  } catch (e) {
    if (el.projectsRoot) el.projectsRoot.textContent = '(load failed)';
    throw e;
  }
}

async function loadSettings() {
  const data = await fetchJSON(`${API}/settings`);
  appSettings = data && data.projects ? data : { projects: { projectRoot: '', dataDir: '' } };
  return appSettings;
}

async function loadProjects() {
  try {
    const data = await fetchJSON(`${API}/projects`);
    projects = Array.isArray(data) ? data : [];
  } catch (e) {
    projects = [];
    if (el.projectsList) {
      el.projectsList.innerHTML = `<div class="empty-state"><p>Could not load projects: ${escapeHtml(e.message)}</p><p>Make sure the server is running.</p></div>`;
    }
    throw e;
  }
  if (selectedProjectId && !getSelectedProject()) {
    selectedProjectId = null;
    taskState.project = null;
    resetPhaseFiveState();
    integrationState.projectId = null;
    integrationState.git = null;
    integrationState.github = null;
    integrationState.events = [];
  }
  renderAppView();
}

const WORKSPACE_PLUGIN_DEFS = [
  { id: 'features', label: 'Features', description: 'Track feature ideas and connect them to roadmap phases.' },
  { id: 'bugs', label: 'Bugs', description: 'Track active bugs, regressions, and archived fixes.' },
  { id: 'prd', label: 'PRD', description: 'Maintain the product requirements document for the project.' },
];

const WORKSPACE_VIEW_META = {
  roadmap: {
    label: 'Roadmap',
    description: 'Shape phases, planned work, considered work, and roadmap fragments from one planning surface.',
    group: 'core',
    implemented: true,
  },
  board: {
    label: 'Kanban',
    description: 'Move work through active execution states and keep delivery moving.',
    group: 'core',
    implemented: true,
  },
  gantt: {
    label: 'Gantt',
    description: 'Understand timing, milestones, deadlines, and dependency flow across the project.',
    group: 'core',
    implemented: true,
  },
  integrations: {
    label: 'Integrations',
    description: 'Connect the project to git, GitHub, webhooks, and automation workflows.',
    group: 'core',
    implemented: true,
  },
  features: {
    label: 'Features',
    description: 'Design the software capabilities that move from considered to planned to delivered.',
    group: 'software',
    implemented: true,
  },
  bugs: {
    label: 'Bugs',
    description: 'Track defects, regressions, and reliability work as software-specific work items.',
    group: 'software',
    implemented: true,
  },
  prd: {
    label: 'PRD',
    description: 'Define the product in a structured, mergeable, AI-consumable way.',
    group: 'software',
    implemented: true,
  },
  functional_spec: {
    label: 'Functional Spec',
    description: 'Define workflows, user actions, system behaviors, and interface expectations for the software.',
    group: 'software',
    implemented: false,
    outputs: ['Functional specification document', 'Structured behavior requirements', 'Mermaid workflow diagrams'],
    inputs: ['Roadmap phases', 'PRD requirements', 'Features and bugs', 'Integrations'],
  },
  architecture: {
    label: 'Architecture',
    description: 'Design the system boundaries, services, flows, and runtime structure of the software.',
    group: 'software',
    implemented: true,
    surface: 'module-designer',
    outputs: ['Architecture document', 'System component diagrams', 'Decision-ready system boundaries'],
    inputs: ['PRD intent', 'Functional specification', 'Integrations', 'Database schema'],
  },
  database_schema: {
    label: 'Database Schema',
    description: 'Design entities, relationships, constraints, indexes, and migrations for the software data model.',
    group: 'software',
    implemented: true,
    surface: 'module-designer',
    outputs: ['Schema design document', 'Mermaid ER diagrams', 'Migration-ready entity definitions'],
    inputs: ['Architecture decisions', 'Functional requirements', 'Work-item relationships', 'Existing persistence rules'],
  },
  technical_design: {
    label: 'Technical Design',
    description: 'Turn product and architecture intent into implementation-level subsystem designs.',
    group: 'software',
    implemented: false,
    outputs: ['Technical design document', 'Implementation sequencing notes', 'Subsystem tradeoff records'],
    inputs: ['Roadmap', 'Architecture', 'Database schema', 'Features and bugs'],
  },
  experience_design: {
    label: 'Experience Design',
    description: 'Design how the software should feel, flow, and present itself to users.',
    group: 'software',
    implemented: false,
    outputs: ['Experience design specification', 'Interaction models', 'Mermaid flowcharts for journeys'],
    inputs: ['PRD', 'Functional spec', 'Roadmap priorities', 'Feature goals'],
  },
  adr: {
    label: 'ADR',
    description: 'Record the important technical and architectural decisions behind the product.',
    group: 'software',
    implemented: false,
    outputs: ['Decision records', 'Traceable tradeoffs', 'Architecture rationale history'],
    inputs: ['Architecture', 'Database schema', 'Technical design', 'Integrations'],
  },
  test_strategy: {
    label: 'Test Strategy',
    description: 'Define how the software will be validated as the design becomes implementation.',
    group: 'software',
    implemented: false,
    outputs: ['Test strategy document', 'Validation approach', 'Quality gates and milestone checks'],
    inputs: ['PRD', 'Functional spec', 'Architecture', 'Features and bugs'],
  },
};

const DESIGNER_GROUP_LABELS = {
  core: 'Core Workspace',
  software: 'Software Design',
};

function resetPhaseFiveState() {
  phase5State.projectId = null;
  phase5State.roadmap = null;
  phase5State.roadmapPanel = 'general';
  phase5State.roadmapPhasePanel = 'planner';
  phase5State.roadmapBucketTabs = {
    planned: 'features',
    considered: 'features',
  };
  phase5State.selectedRoadmapFragmentId = null;
  phase5State.features = null;
  phase5State.bugs = null;
  phase5State.prd = null;
  phase5State.architecture = null;
  phase5State.databaseSchema = null;
  phase5State.selectedPrdFragmentId = null;
}

function isFolderProject(project) {
  return !!(project && project.type === 'folder' && project.path);
}

function getWorkspacePlugins(project = taskState.project) {
  if (!project || !Array.isArray(project.workspacePlugins)) return [];
  return project.workspacePlugins;
}

function isWorkspacePluginEnabled(pluginId, project = taskState.project) {
  return getWorkspacePlugins(project).includes(pluginId);
}

function getEnabledProjectModules(project = taskState.project) {
  if (!project || !Array.isArray(project.modules)) return [];
  return project.modules.filter((module) => module && module.enabled);
}

function getProjectModule(moduleKey, project = taskState.project) {
  if (!project || !Array.isArray(project.modules)) return null;
  return project.modules.find((module) => module && module.moduleKey === moduleKey) || null;
}

function getProjectModuleDependents(moduleKey, project = taskState.project, enabledOnly = false) {
  if (!project || !Array.isArray(project.modules)) return [];
  return project.modules.filter((module) => {
    if (!module || module.moduleKey === moduleKey) return false;
    if (enabledOnly && !module.enabled) return false;
    return Array.isArray(module.dependsOn) && module.dependsOn.includes(moduleKey);
  });
}

function collectDependentModuleKeys(moduleKey, project = taskState.project, enabledOnly = false, visited = new Set()) {
  if (visited.has(moduleKey)) return [];
  visited.add(moduleKey);
  const direct = getProjectModuleDependents(moduleKey, project, enabledOnly);
  const keys = new Set(direct.map((module) => module.moduleKey));
  direct.forEach((module) => {
    collectDependentModuleKeys(module.moduleKey, project, enabledOnly, visited).forEach((key) => keys.add(key));
  });
  return [...keys];
}

function getProjectTypeLabel(project = taskState.project) {
  if (!project) return 'Project';
  return project.projectType === 'software' ? 'Software Project' : 'General Project';
}

function getWorkspaceViews(project = taskState.project) {
  const modules = getEnabledProjectModules(project);
  const keys = modules.length
    ? modules.map((module) => module.moduleKey)
    : ['roadmap', 'board', 'gantt', 'integrations', ...getWorkspacePlugins(project)];
  const seen = new Set();
  return keys
    .map((key) => {
      const meta = WORKSPACE_VIEW_META[key];
      if (!meta || seen.has(key)) return null;
      seen.add(key);
      return {
        id: key,
        ...meta,
      };
    })
    .filter(Boolean);
}

function getWorkspaceViewDefinition(viewName = taskState.view, project = taskState.project) {
  const views = getWorkspaceViews(project);
  return views.find((view) => view.id === viewName) || views[0] || WORKSPACE_VIEW_META.roadmap;
}

function getRoadmapPhases() {
  return phase5State.roadmap && Array.isArray(phase5State.roadmap.phases)
    ? phase5State.roadmap.phases
    : [];
}

function getRoadmapFragments() {
  return phase5State.roadmap && Array.isArray(phase5State.roadmap.fragments)
    ? phase5State.roadmap.fragments
    : [];
}

function getFeaturesList() {
  return phase5State.features && Array.isArray(phase5State.features.features)
    ? phase5State.features.features
    : (phase5State.roadmap && Array.isArray(phase5State.roadmap.features) ? phase5State.roadmap.features : []);
}

function getBugsList() {
  return phase5State.bugs && Array.isArray(phase5State.bugs.bugs)
    ? phase5State.bugs.bugs
    : (phase5State.roadmap && Array.isArray(phase5State.roadmap.bugs) ? phase5State.roadmap.bugs : []);
}

function getPrdFragments() {
  return phase5State.prd && Array.isArray(phase5State.prd.fragments)
    ? phase5State.prd.fragments
    : [];
}

function getPrdFragmentForFeature(featureId) {
  if (!featureId) return null;
  return getPrdFragments().find((fragment) => fragment.featureId === featureId) || null;
}

function getFeatureDisplayLabel(featureId) {
  if (!featureId) return '';
  const feature = getFeaturesList().find((entry) => entry && entry.id === featureId);
  if (!feature) return featureId;
  return `${feature.code || feature.id}: ${feature.title || 'Untitled feature'}`;
}

function openFragmentPreviewModal(kind, fragment) {
  if (!fragment || !el.modalFragmentPreview) return;
  const kindLabel = kind === 'roadmap' ? 'Roadmap' : 'PRD';
  const fragmentCode = fragment.code || fragment.id || `${kindLabel} fragment`;
  const fragmentTitle = fragment.title || 'Untitled fragment';
  if (el.fragmentPreviewTitle) {
    el.fragmentPreviewTitle.textContent = `${kindLabel} Fragment Preview: ${fragmentCode}`;
  }
  if (el.fragmentPreviewMeta) {
    const metaItems = [
      `Status: ${fragment.status || 'draft'}`,
      fragment.featureId ? `Linked feature: ${getFeatureDisplayLabel(fragment.featureId)}` : null,
      fragment.fileName || fragment.mergedFileName ? `File: ${fragment.fileName || fragment.mergedFileName}` : 'File: Not generated yet',
    ].filter(Boolean).map((item) => `<span>${escapeHtml(item)}</span>`).join('');
    el.fragmentPreviewMeta.innerHTML = metaItems;
  }
  if (el.fragmentPreviewBody) {
    renderMarkdownPreview(el.fragmentPreviewBody, `# ${fragmentTitle}\n\n${fragment.markdown || ''}`);
  }
  if (el.modalFragmentPreview.open) return;
  el.modalFragmentPreview.showModal();
}

function createDesignerTimestamp() {
  return new Date().toISOString();
}

function createDesignerId(prefix = 'item') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createDesignerTextSection() {
  return {
    text: '',
    versionDate: createDesignerTimestamp(),
  };
}

function createDesignerDetailEntry() {
  return {
    title: '',
    description: '',
    versionDate: createDesignerTimestamp(),
  };
}

function createArchitectureEditorState(project = taskState.project) {
  const now = createDesignerTimestamp();
  return {
    overview: {
      systemPurpose: '',
      architecturalVision: '',
      architecturalStyle: '',
      versionDate: now,
    },
    components: [],
    componentConnections: [],
    boundaries: [],
    integrations: [],
    runtimeScenarios: [],
    operationalConcerns: [],
    decisions: [],
    constraints: [],
    deployment: {
      runtimeTopology: '',
      environmentNotes: '',
      versionDate: now,
    },
  };
}

function createDatabaseSchemaEditorState(project = taskState.project) {
  const now = createDesignerTimestamp();
  return {
    overview: {
      purpose: '',
      storageStrategy: '',
      versionDate: now,
    },
    importSource: null,
    entities: [],
    relationships: [],
    constraints: [],
    indexes: [],
    migrations: [],
    synchronizationRules: [],
    openQuestions: [],
    dbml: '',
    schemaModel: createDatabaseSchemaModel(),
  };
}

function createDatabaseSchemaField() {
  return {
    id: createDesignerId('field'),
    name: '',
    type: 'text',
    nullable: true,
    primaryKey: false,
    unique: false,
    defaultValue: '',
    referencesEntityId: '',
    referencesFieldId: '',
    status: 'draft',
    notes: '',
  };
}

function createDatabaseSchemaEntity() {
  return {
    id: createDesignerId('entity'),
    name: '',
    kind: 'table',
    status: 'draft',
    notes: '',
    fields: [createDatabaseSchemaField()],
  };
}

function createDatabaseSchemaRelationship() {
  return {
    id: createDesignerId('rel'),
    fromEntityId: '',
    fromFieldId: '',
    toEntityId: '',
    toFieldId: '',
    cardinality: 'one-to-many',
    status: 'draft',
    notes: '',
  };
}

function createDatabaseSchemaIndex() {
  return {
    id: createDesignerId('idx'),
    entityId: '',
    name: '',
    fields: [],
    unique: false,
    status: 'draft',
    notes: '',
  };
}

function createDatabaseSchemaConstraint() {
  return {
    id: createDesignerId('cons'),
    entityId: '',
    name: '',
    type: 'check',
    definition: '',
    status: 'draft',
    notes: '',
  };
}

function createDatabaseSchemaModel() {
  return {
    entities: [],
    relationships: [],
    indexes: [],
    constraints: [],
  };
}

function normalizeDatabaseSchemaField(field) {
  const base = field && typeof field === 'object' ? field : {};
  return {
    id: String(base.id || createDesignerId('field')),
    name: String(base.name || ''),
    type: String(base.type || 'text'),
    nullable: base.nullable === undefined || base.nullable === null || base.nullable === '' ? true : Boolean(base.nullable),
    primaryKey: Boolean(base.primaryKey),
    unique: Boolean(base.unique),
    defaultValue: String(base.defaultValue || ''),
    referencesEntityId: String(base.referencesEntityId || ''),
    referencesFieldId: String(base.referencesFieldId || ''),
    status: String(base.status || 'draft'),
    notes: String(base.notes || ''),
  };
}

function normalizeDatabaseSchemaEntity(entity) {
  const base = entity && typeof entity === 'object' ? entity : {};
  return {
    id: String(base.id || createDesignerId('entity')),
    name: String(base.name || ''),
    kind: String(base.kind || 'table'),
    status: String(base.status || 'draft'),
    notes: String(base.notes || ''),
    fields: Array.isArray(base.fields) && base.fields.length
      ? base.fields.map((field) => normalizeDatabaseSchemaField(field))
      : [createDatabaseSchemaField()],
  };
}

function normalizeDatabaseSchemaRelationship(relationship) {
  const base = relationship && typeof relationship === 'object' ? relationship : {};
  return {
    id: String(base.id || createDesignerId('rel')),
    fromEntityId: String(base.fromEntityId || ''),
    fromFieldId: String(base.fromFieldId || ''),
    toEntityId: String(base.toEntityId || ''),
    toFieldId: String(base.toFieldId || ''),
    cardinality: String(base.cardinality || 'one-to-many'),
    status: String(base.status || 'draft'),
    notes: String(base.notes || ''),
  };
}

function normalizeDatabaseSchemaIndex(indexEntry) {
  const base = indexEntry && typeof indexEntry === 'object' ? indexEntry : {};
  return {
    id: String(base.id || createDesignerId('idx')),
    entityId: String(base.entityId || ''),
    name: String(base.name || ''),
    fields: Array.isArray(base.fields)
      ? base.fields.map((fieldId) => String(fieldId || '')).filter(Boolean)
      : String(base.fields || '').split(',').map((fieldId) => fieldId.trim()).filter(Boolean),
    unique: Boolean(base.unique),
    status: String(base.status || 'draft'),
    notes: String(base.notes || ''),
  };
}

function normalizeDatabaseSchemaConstraint(constraint) {
  const base = constraint && typeof constraint === 'object' ? constraint : {};
  return {
    id: String(base.id || createDesignerId('cons')),
    entityId: String(base.entityId || ''),
    name: String(base.name || ''),
    type: String(base.type || 'check'),
    definition: String(base.definition || ''),
    status: String(base.status || 'draft'),
    notes: String(base.notes || ''),
  };
}

function buildLegacySchemaModelFromEditorState(base) {
  return {
    entities: Array.isArray(base.entities)
      ? base.entities.map((entry) => {
          const detail = normalizeDesignerDetailEntry(entry);
          return normalizeDatabaseSchemaEntity({
            name: detail.title,
            notes: detail.description,
            fields: [],
          });
        })
      : [],
    relationships: [],
    indexes: [],
    constraints: [],
  };
}

function normalizeDatabaseSchemaModel(model, fallbackState = null) {
  const base = model && typeof model === 'object'
    ? model
    : (fallbackState ? buildLegacySchemaModelFromEditorState(fallbackState) : createDatabaseSchemaModel());
  return {
    entities: Array.isArray(base.entities) ? base.entities.map((entity) => normalizeDatabaseSchemaEntity(entity)) : [],
    relationships: Array.isArray(base.relationships) ? base.relationships.map((relationship) => normalizeDatabaseSchemaRelationship(relationship)) : [],
    indexes: Array.isArray(base.indexes) ? base.indexes.map((indexEntry) => normalizeDatabaseSchemaIndex(indexEntry)) : [],
    constraints: Array.isArray(base.constraints) ? base.constraints.map((constraint) => normalizeDatabaseSchemaConstraint(constraint)) : [],
  };
}

function buildSchemaDetailCollectionsFromModel(schemaModel) {
  const model = normalizeDatabaseSchemaModel(schemaModel);
  const entities = model.entities.map((entity) => normalizeDesignerDetailEntry({
    title: `${entity.name || entity.id}${entity.kind ? ` (${entity.kind})` : ''}`,
    description: [
      entity.notes || '',
      ...(Array.isArray(entity.fields) ? entity.fields : []).map((field) => {
        const facts = [
          field.type ? `Type: ${field.type}` : '',
          field.primaryKey ? 'Primary key' : '',
          field.unique ? 'Unique' : '',
          field.nullable === false ? 'Required' : 'Nullable',
          field.defaultValue ? `Default: ${field.defaultValue}` : '',
          field.referencesEntityId && field.referencesFieldId ? `References: ${field.referencesEntityId}.${field.referencesFieldId}` : '',
          field.status ? `Status: ${field.status}` : '',
        ].filter(Boolean);
        return `- ${field.name || field.id}${facts.length ? `: ${facts.join('; ')}` : ''}${field.notes ? ` (${field.notes})` : ''}`;
      }),
    ].filter(Boolean).join('\n'),
  }));

  const relationships = model.relationships.map((relationship) => normalizeDesignerDetailEntry({
    title: relationship.id || `${relationship.fromEntityId || 'unknown'} -> ${relationship.toEntityId || 'unknown'}`,
    description: [
      `From: ${relationship.fromEntityId || '?'}${relationship.fromFieldId ? `.${relationship.fromFieldId}` : ''}`,
      `To: ${relationship.toEntityId || '?'}${relationship.toFieldId ? `.${relationship.toFieldId}` : ''}`,
      relationship.cardinality ? `Cardinality: ${relationship.cardinality}` : '',
      relationship.status ? `Status: ${relationship.status}` : '',
      relationship.notes || '',
    ].filter(Boolean).join('\n'),
  }));

  const indexes = model.indexes.map((indexEntry) => normalizeDesignerDetailEntry({
    title: indexEntry.name || indexEntry.id,
    description: [
      `Entity: ${indexEntry.entityId || 'unknown'}`,
      Array.isArray(indexEntry.fields) && indexEntry.fields.length ? `Fields: ${indexEntry.fields.join(', ')}` : '',
      `Unique: ${indexEntry.unique ? 'yes' : 'no'}`,
      indexEntry.status ? `Status: ${indexEntry.status}` : '',
      indexEntry.notes || '',
    ].filter(Boolean).join('\n'),
  }));

  const constraints = model.constraints.map((constraint) => normalizeDesignerDetailEntry({
    title: constraint.name || constraint.id,
    description: [
      `Entity: ${constraint.entityId || 'unknown'}`,
      constraint.type ? `Type: ${constraint.type}` : '',
      constraint.definition ? `Definition: ${constraint.definition}` : '',
      constraint.status ? `Status: ${constraint.status}` : '',
      constraint.notes || '',
    ].filter(Boolean).join('\n'),
  }));

  return { entities, relationships, indexes, constraints };
}

function normalizeDatabaseSchemaEditorState(input, project = taskState.project) {
  const base = input && typeof input === 'object' ? input : createDatabaseSchemaEditorState(project);
  const schemaModel = normalizeDatabaseSchemaModel(base.schemaModel, base);
  const derivedDetails = buildSchemaDetailCollectionsFromModel(schemaModel);
  const next = {
    overview: {
      purpose: base.overview && typeof base.overview === 'object' ? String(base.overview.purpose || '') : '',
      storageStrategy: base.overview && typeof base.overview === 'object' ? String(base.overview.storageStrategy || '') : '',
      versionDate: base.overview && base.overview.versionDate ? base.overview.versionDate : createDesignerTimestamp(),
    },
    importSource: base.importSource && typeof base.importSource === 'object'
      ? {
          sourceType: String(base.importSource.sourceType || ''),
          sourceLabel: String(base.importSource.sourceLabel || ''),
          dialect: String(base.importSource.dialect || ''),
          observedAt: String(base.importSource.observedAt || ''),
          schemaFingerprint: String(base.importSource.schemaFingerprint || ''),
          confidence: String(base.importSource.confidence || ''),
        }
      : null,
    entities: derivedDetails.entities,
    relationships: derivedDetails.relationships,
    constraints: derivedDetails.constraints,
    indexes: derivedDetails.indexes,
    migrations: Array.isArray(base.migrations) ? base.migrations.map((item) => normalizeDesignerDetailEntry(item)) : [],
    synchronizationRules: Array.isArray(base.synchronizationRules) ? base.synchronizationRules.map((item) => normalizeDesignerDetailEntry(item)) : [],
    openQuestions: Array.isArray(base.openQuestions) ? base.openQuestions.map((item) => normalizeDesignerDetailEntry(item)) : [],
    dbml: String(base.dbml || ''),
    schemaModel,
  };
  return next;
}

function getArchitectureState() {
  if (!phase5State.architecture) {
    phase5State.architecture = {
      markdown: '',
      mermaid: '',
      editorState: createArchitectureEditorState(taskState.project),
    };
  }
  if (!phase5State.architecture.editorState || typeof phase5State.architecture.editorState !== 'object') {
    phase5State.architecture.editorState = createArchitectureEditorState(taskState.project);
  }
  phase5State.architecture.editorState = normalizeArchitectureEditorState(phase5State.architecture.editorState);
  if (!String(phase5State.architecture.mermaid || '').trim()) {
    phase5State.architecture.mermaid = buildClientArchitectureGeneratedMermaid(taskState.project, phase5State.architecture.editorState);
  }
  return phase5State.architecture.editorState;
}

function getDatabaseSchemaState() {
  if (!phase5State.databaseSchema) {
    phase5State.databaseSchema = {
      markdown: '',
      mermaid: 'erDiagram\n  ENTITY ||--o{ FIELD : defines',
      editorState: createDatabaseSchemaEditorState(taskState.project),
    };
  }
  if (!phase5State.databaseSchema.editorState || typeof phase5State.databaseSchema.editorState !== 'object') {
    phase5State.databaseSchema.editorState = createDatabaseSchemaEditorState(taskState.project);
  }
  phase5State.databaseSchema.editorState = normalizeDatabaseSchemaEditorState(phase5State.databaseSchema.editorState, taskState.project);
  if (!String(phase5State.databaseSchema.dbml || '').trim()) {
    phase5State.databaseSchema.dbml = buildClientDatabaseSchemaDbml(taskState.project, phase5State.databaseSchema.editorState);
  }
  return phase5State.databaseSchema.editorState;
}

function getLinkedTaskTitle(taskId) {
  if (!taskId) return 'None';
  const task = taskState.tasks.find((item) => item.id === taskId);
  return task ? task.title : taskId;
}

function renderMarkdownPreview(container, markdown) {
  if (!container) return;
  container.innerHTML = markdown
    ? `<pre>${escapeHtml(markdown)}</pre>`
    : '<div class="workspace-doc-empty">Nothing generated yet.</div>';
}

async function ensureMermaid() {
  if (phase5State.mermaid) return phase5State.mermaid;
  const module = await import('/vendor/mermaid.mjs');
  const mermaid = module && module.default ? module.default : module;
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: document.documentElement.dataset.scheme === 'app-icon' ? 'default' : 'dark',
  });
  phase5State.mermaid = mermaid;
  return mermaid;
}

async function renderMermaidPreview(container, mermaidText) {
  if (!container) return;
  const source = String(mermaidText || '').trim();
  if (!source) {
    container.innerHTML = '<div class="workspace-doc-empty">No Mermaid content yet.</div>';
    return;
  }
  try {
    const mermaid = await ensureMermaid();
    const renderId = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { svg } = await mermaid.render(renderId, source);
    container.innerHTML = svg;
  } catch (error) {
    container.innerHTML = `<div class="workspace-doc-error">${escapeHtml(error.message || 'Unable to render Mermaid diagram.')}</div>`;
  }
}

function updateWorkspacePluginTabs(project = taskState.project) {
  const enabledViews = getWorkspaceViews(project).map((view) => view.id);
  if (!enabledViews.length) {
    taskState.view = 'roadmap';
    return;
  }
  if (!enabledViews.includes(taskState.view)) {
    taskState.view = enabledViews.includes('roadmap') ? 'roadmap' : enabledViews[0];
  }
}

async function loadPhaseFiveWorkspace(project) {
  if (!isFolderProject(project)) {
    resetPhaseFiveState();
    return;
  }
  const enabled = getWorkspacePlugins(project);
  const projectId = project.id;
  phase5State.projectId = projectId;

  const requests = [
    fetchJSON(`${API}/projects/${projectId}/roadmap`),
    enabled.includes('features') ? fetchJSON(`${API}/projects/${projectId}/features`) : Promise.resolve(null),
    enabled.includes('bugs') ? fetchJSON(`${API}/projects/${projectId}/bugs`) : Promise.resolve(null),
    enabled.includes('prd') ? fetchJSON(`${API}/projects/${projectId}/prd`) : Promise.resolve(null),
    getEnabledProjectModules(project).some((module) => module.moduleKey === 'architecture' && module.enabled)
      ? fetchJSON(`${API}/projects/${projectId}/architecture`)
      : Promise.resolve(null),
    getEnabledProjectModules(project).some((module) => module.moduleKey === 'database_schema' && module.enabled)
      ? fetchJSON(`${API}/projects/${projectId}/database-schema`)
      : Promise.resolve(null),
  ];
  const [roadmap, features, bugs, prd, architecture, databaseSchema] = await Promise.all(requests);
  phase5State.roadmap = roadmap;
  phase5State.features = features;
  phase5State.bugs = bugs;
  phase5State.prd = prd;
  phase5State.architecture = architecture;
  phase5State.databaseSchema = databaseSchema;
  const roadmapFragments = roadmap && Array.isArray(roadmap.fragments) ? roadmap.fragments : [];
  if (!roadmapFragments.some((fragment) => fragment.id === phase5State.selectedRoadmapFragmentId)) {
    phase5State.selectedRoadmapFragmentId = roadmapFragments.length ? roadmapFragments[0].id : null;
  }
  const fragments = prd && Array.isArray(prd.fragments) ? prd.fragments : [];
  if (!fragments.some((fragment) => fragment.id === phase5State.selectedPrdFragmentId)) {
    phase5State.selectedPrdFragmentId = fragments.length ? fragments[0].id : null;
  }
}

function populateRoadmapPhaseOptions(selectEl, selectedValue = '') {
  if (!selectEl) return;
  const selected = selectedValue || '';
  const phases = getRoadmapPhases();
  selectEl.innerHTML = '<option value="">Unassigned</option>' + phases
    .map((phase) => `<option value="${escapeAttr(phase.id)}" ${phase.id === selected ? 'selected' : ''}>${escapeHtml(`${phase.code}: ${phase.name}`)}</option>`)
    .join('');
}

function populateTaskSelect(selectEl, selectedValue = '') {
  if (!selectEl) return;
  const selected = selectedValue || '';
  selectEl.innerHTML = '<option value="">None</option>' + taskState.tasks
    .map((task) => `<option value="${escapeAttr(task.id)}" ${task.id === selected ? 'selected' : ''}>${escapeHtml(task.title)}</option>`)
    .join('');
}

function getSelectedSoftwareModulesFromSettings() {
  if (!el.projectSettingsSoftwareModules) return [];
  return Array.from(el.projectSettingsSoftwareModules.querySelectorAll('[data-project-settings-module]'))
    .filter((input) => input.checked)
    .map((input) => input.dataset.projectSettingsModule)
    .filter(Boolean);
}

async function updateWorkspacePlugins(projectId, enabledPlugins, cleanupPlugins = []) {
  void logUiEvent('roadmap', 'update-workspace-plugins', { projectId, enabledPlugins, cleanupPlugins });
  const response = await fetchJSON(`${API}/projects/${projectId}/workspace-plugins`, {
    method: 'PUT',
    body: JSON.stringify({ enabledPlugins, cleanupPlugins }),
  });
  const project = projects.find((item) => item.id === projectId);
  if (project) project.workspacePlugins = Array.isArray(response.workspacePlugins) ? response.workspacePlugins : [];
  if (taskState.project && taskState.project.id === projectId && project) taskState.project.workspacePlugins = project.workspacePlugins.slice();
  return response.workspacePlugins || [];
}

async function toggleWorkspacePlugin(pluginId, nextEnabled) {
  if (!taskState.project) return;
  const current = getWorkspacePlugins(taskState.project);
  const enabledPlugins = nextEnabled
    ? [...new Set([...current, pluginId])]
    : current.filter((item) => item !== pluginId);
  const cleanupPlugins = [];
  if (!nextEnabled) {
    const shouldCleanup = confirm(`Keep ${pluginId.toUpperCase()} files and generated records? Click Cancel if you want cleanup.`);
    if (!shouldCleanup) cleanupPlugins.push(pluginId);
  }
  void logUiEvent('roadmap', nextEnabled ? 'enable-plugin' : 'disable-plugin', { pluginId, cleanupPlugins });
  await updateWorkspacePlugins(taskState.project.id, enabledPlugins, cleanupPlugins);
  await loadProjects();
  taskState.project = getSelectedProject();
  await refreshTaskWorkspace();
}

async function updateProjectModules(projectId, enabledModules, projectType = null, cleanupModules = []) {
  void logUiEvent('roadmap', 'update-project-modules', { projectId, enabledModules, projectType, cleanupModules });
  const response = await fetchJSON(`${API}/projects/${projectId}/modules`, {
    method: 'PUT',
    body: JSON.stringify({ enabledModules, projectType, cleanupModules }),
  });
  const project = projects.find((item) => item.id === projectId);
  if (project) {
    project.projectType = response.projectType || project.projectType;
    project.enabledModules = Array.isArray(response.enabledModules) ? response.enabledModules.slice() : [];
    project.workspacePlugins = Array.isArray(response.workspacePlugins) ? response.workspacePlugins.slice() : [];
    project.modules = Array.isArray(response.modules) ? response.modules.slice() : [];
  }
  if (taskState.project && taskState.project.id === projectId && project) taskState.project = project;
  return response;
}

async function toggleProjectModule(moduleKey, nextEnabled) {
  if (!taskState.project) return;
  const current = getEnabledProjectModules(taskState.project).map((module) => module.moduleKey);
  const module = getProjectModule(moduleKey, taskState.project);
  const dependencyKeys = module && Array.isArray(module.dependsOn) ? module.dependsOn : [];
  const dependentKeys = collectDependentModuleKeys(moduleKey, taskState.project, true);
  let enabledModules = nextEnabled
    ? [...new Set([...current, ...dependencyKeys, moduleKey])]
    : current.filter((item) => item !== moduleKey && !dependentKeys.includes(item));
  const cleanupModules = [];
  if (!nextEnabled) {
    if (dependentKeys.length) {
      const proceed = confirm(`Removing ${moduleKey.replace(/_/g, ' ')} will also remove dependent modules: ${dependentKeys.join(', ')}. Continue?`);
      if (!proceed) return;
    }
    const shouldCleanup = confirm(`Keep ${moduleKey.replace(/_/g, ' ')} documents and generated records? Click Cancel if you want cleanup.`);
    if (!shouldCleanup) cleanupModules.push(moduleKey);
    dependentKeys.forEach((key) => cleanupModules.push(key));
  } else if (dependencyKeys.length) {
    void logUiEvent('roadmap', 'module-auto-enables-dependencies', { moduleKey, dependencies: dependencyKeys });
  }
  const nextProjectType = taskState.project.projectType === 'software' || ['features', 'bugs', 'prd', 'functional_spec', 'architecture', 'database_schema', 'technical_design', 'experience_design', 'adr', 'test_strategy'].includes(moduleKey)
    ? 'software'
    : taskState.project.projectType;
  await updateProjectModules(taskState.project.id, enabledModules, nextProjectType, [...new Set(cleanupModules)]);
  await loadProjects();
  taskState.project = getSelectedProject();
  await refreshTaskWorkspace();
}

async function enableSoftwareDesignerProfile() {
  if (!taskState.project) return;
  const current = getEnabledProjectModules(taskState.project).map((module) => module.moduleKey);
  const starterModules = ['features', 'bugs', 'prd', 'architecture', 'database_schema'];
  await updateProjectModules(taskState.project.id, [...new Set([...current, ...starterModules])], 'software');
  await loadProjects();
  taskState.project = getSelectedProject();
  await refreshTaskWorkspace();
}

function renderProjectSettingsSoftwareModules(project) {
  if (!el.projectSettingsSoftwareModules) return;
  const modules = Array.isArray(project && project.modules) ? project.modules.filter((module) => module && module.group === 'software') : [];
  if (!modules.length) {
    el.projectSettingsSoftwareModules.innerHTML = '<div class="workspace-doc-empty">No Software modules are available for this project yet.</div>';
    return;
  }
  el.projectSettingsSoftwareModules.innerHTML = modules.map((module) => {
    const dependencyLabels = Array.isArray(module.dependsOn) && module.dependsOn.length
      ? module.dependsOn.map((key) => {
          const dependency = modules.find((entry) => entry.moduleKey === key) || getProjectModule(key, project);
          return dependency ? dependency.label : key;
        }).join(', ')
      : '';
    return `
      <article class="workspace-plugin-toggle ${module.enabled ? 'is-enabled' : ''}">
        <div>
          <strong>${escapeHtml(module.label)}</strong>
          <p>${escapeHtml(module.description || '')}</p>
          <div class="workspace-doc-item-meta">
            <span>${dependencyLabels ? `Depends on: ${escapeHtml(dependencyLabels)}` : 'No prerequisite modules'}</span>
          </div>
        </div>
        <label class="checkbox-inline">
          <input type="checkbox" data-project-settings-module="${escapeAttr(module.moduleKey)}" ${module.enabled ? 'checked' : ''} />
          Enabled
        </label>
      </article>
    `;
  }).join('');
}

function renderWorkspacePluginManager() {
  if (!el.workspacePluginManager) return;
  const project = taskState.project;
  if (!isFolderProject(project)) {
    el.workspacePluginManager.innerHTML = '<div class="workspace-doc-empty">Workspace modules are available for folder projects.</div>';
    return;
  }
  const modules = Array.isArray(project.modules) ? project.modules : [];
  if (project.projectType !== 'software') {
    el.workspacePluginManager.innerHTML = `
      <article class="workspace-doc-card">
        <div class="workspace-doc-sidebar-header">
          <h3>Software Designer</h3>
        </div>
        <p class="module-designer-copy">This project is currently using the general workspace. Promote it to a Software Project to enable software-specific design modules like Architecture and Database Schema.</p>
        <div class="workspace-doc-actions">
          <button type="button" class="btn btn-secondary" id="btn-enable-software-designer">Enable Software Designer</button>
        </div>
      </article>
    `;
    const button = document.getElementById('btn-enable-software-designer');
    if (button) {
      button.addEventListener('click', async () => {
        try {
          await enableSoftwareDesignerProfile();
        } catch (error) {
          alert(error.message || 'Failed to enable Software Designer');
        }
      });
    }
    return;
  }

  const softwareModules = modules.filter((module) => module && module.group === 'software');
  el.workspacePluginManager.innerHTML = softwareModules.length
    ? softwareModules.map((module) => `
      <article class="workspace-plugin-toggle ${module.enabled ? 'is-enabled' : ''}">
        <div>
          <strong>${escapeHtml(module.label)}</strong>
          <p>${escapeHtml(module.description || '')}</p>
          <div class="workspace-doc-item-meta">
            <span>${module.dependsOn && module.dependsOn.length ? `Depends on: ${escapeHtml(module.dependsOn.map((key) => {
              const dependency = getProjectModule(key, project);
              return dependency ? dependency.label : key;
            }).join(', '))}` : 'No prerequisite modules'}</span>
            <span>${(() => {
              const dependents = getProjectModuleDependents(module.moduleKey, project, false);
              return dependents.length
                ? `Used by: ${escapeHtml(dependents.map((item) => item.label).join(', '))}`
                : 'No dependent modules';
            })()}</span>
          </div>
        </div>
        <button type="button" class="btn btn-small ${module.enabled ? 'btn-ghost' : 'btn-secondary'}" data-module-toggle="${escapeAttr(module.moduleKey)}" data-module-enabled="${module.enabled ? '1' : '0'}">
          ${module.enabled ? 'Remove' : 'Add'}
        </button>
      </article>
    `).join('')
    : '<div class="workspace-doc-empty">No software modules are available yet.</div>';
  el.workspacePluginManager.querySelectorAll('[data-module-toggle]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await toggleProjectModule(button.dataset.moduleToggle, button.dataset.moduleEnabled !== '1');
      } catch (error) {
        alert(error.message || 'Failed to update project module');
      }
    });
  });
}

function renderRoadmapWorkspace() {
  const plannedFeatures = getFeaturesList().filter((feature) => !feature.archived);
  const consideredFeatures = getFeaturesList().filter((feature) => feature.archived);
  if (el.roadmapPhaseList) {
    const phases = getRoadmapPhases();
    el.roadmapPhaseList.innerHTML = phases.length
      ? phases.map((phase) => {
          const linkedTaskCount = taskState.tasks.filter((task) => task.roadmapPhaseId === phase.id).length;
          const linkedFeatureCount = getFeaturesList().filter((feature) => feature.roadmapPhaseId === phase.id && !feature.archived).length;
          return `
            <article class="workspace-doc-item">
              <div class="workspace-doc-item-top">
                <div>
                  <strong>${escapeHtml(`${phase.code}: ${phase.name}`)}</strong>
                  <span>${escapeHtml(phase.status || 'planned')}</span>
                </div>
                <div class="workspace-doc-item-actions">
                  <button type="button" class="btn btn-small btn-secondary" data-roadmap-edit="${escapeAttr(phase.id)}">Edit</button>
                  <button type="button" class="btn btn-small btn-ghost" data-roadmap-delete="${escapeAttr(phase.id)}">Delete</button>
                </div>
              </div>
              <p>${escapeHtml(phase.summary || phase.goal || 'No summary yet.')}</p>
              <div class="workspace-doc-item-meta">
                <span>${linkedTaskCount} linked task${linkedTaskCount === 1 ? '' : 's'}</span>
                <span>${linkedFeatureCount} linked feature${linkedFeatureCount === 1 ? '' : 's'}</span>
                <span>${escapeHtml(phase.targetDate || 'No target date')}</span>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="workspace-doc-empty">Add a roadmap phase to start structuring the project plan.</div>';

    el.roadmapPhaseList.querySelectorAll('[data-roadmap-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const phase = getRoadmapPhases().find((item) => item.id === button.dataset.roadmapEdit);
        if (phase) openRoadmapPhaseModal(phase);
      });
    });
    el.roadmapPhaseList.querySelectorAll('[data-roadmap-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!taskState.project) return;
        if (!confirm('Delete this roadmap phase? Linked tasks and features will become unassigned.')) return;
        try {
          void logUiEvent('roadmap', 'delete-phase', { phaseId: button.dataset.roadmapDelete });
          await fetchJSON(`${API}/projects/${taskState.project.id}/roadmap/phases/${button.dataset.roadmapDelete}`, { method: 'DELETE' });
          await refreshTaskWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to delete roadmap phase');
        }
      });
    });
  }

  if (el.roadmapPlannedFeatures) {
    el.roadmapPlannedFeatures.innerHTML = plannedFeatures.length
      ? plannedFeatures.map((feature) => `
          <article class="workspace-doc-item">
            <div class="workspace-doc-item-top">
              <div>
                <strong>${escapeHtml(`${feature.code}: ${feature.title}`)}</strong>
                <span>${escapeHtml(feature.status || 'planned')}</span>
              </div>
            </div>
            <p>${escapeHtml(feature.summary || 'No summary yet.')}</p>
            <div class="workspace-doc-item-meta">
              <span>${escapeHtml((getRoadmapPhases().find((phase) => phase.id === feature.roadmapPhaseId) || {}).name || 'Unassigned')}</span>
              <span>${escapeHtml(getLinkedTaskTitle(feature.taskId))}</span>
            </div>
          </article>
        `).join('')
      : '<div class="workspace-doc-empty">No planned features yet.</div>';
  }

  if (el.roadmapConsideredFeatures) {
    el.roadmapConsideredFeatures.innerHTML = consideredFeatures.length
      ? consideredFeatures.map((feature) => `
          <article class="workspace-doc-item is-archived">
            <div class="workspace-doc-item-top">
              <div>
                <strong>${escapeHtml(`${feature.code}: ${feature.title}`)}</strong>
                <span>${escapeHtml(feature.status || 'done')}</span>
              </div>
            </div>
            <p>${escapeHtml(feature.summary || 'No summary yet.')}</p>
            <div class="workspace-doc-item-meta">
              <span>${escapeHtml((getRoadmapPhases().find((phase) => phase.id === feature.roadmapPhaseId) || {}).name || 'Unassigned')}</span>
              <span>${escapeHtml(getLinkedTaskTitle(feature.taskId))}</span>
            </div>
          </article>
        `).join('')
      : '<div class="workspace-doc-empty">No considered features yet.</div>';
  }

  if (el.roadmapFragmentList) {
    const fragments = getRoadmapFragments();
    el.roadmapFragmentList.innerHTML = fragments.length
      ? fragments.map((fragment) => `
          <article class="workspace-doc-item ${phase5State.selectedRoadmapFragmentId === fragment.id ? 'is-selected' : ''} ${fragment.status === 'integrated' ? 'is-archived' : ''}">
            <div class="workspace-doc-item-top">
              <div>
                <strong>${escapeHtml(fragment.title || fragment.code)}</strong>
                <span>${escapeHtml(fragment.status || 'draft')}</span>
              </div>
              <div class="workspace-doc-item-actions">
                <button type="button" class="btn btn-small btn-secondary" data-roadmap-fragment-preview="${escapeAttr(fragment.id)}">Preview</button>
                <button type="button" class="btn btn-small btn-secondary" data-roadmap-fragment-merge="${escapeAttr(fragment.id)}" ${fragment.status === 'integrated' ? 'disabled' : ''}>${fragment.merged ? 'Re-merge' : 'Merge'}</button>
                <button type="button" class="btn btn-small btn-secondary" data-roadmap-fragment-integrate="${escapeAttr(fragment.id)}" ${fragment.status === 'integrated' ? 'disabled' : ''}>${fragment.status === 'integrated' ? 'Integrated' : 'Integrate'}</button>
              </div>
            </div>
            <div class="workspace-doc-item-meta">
              <span>${escapeHtml(fragment.code || 'No code')}</span>
              <span>${escapeHtml(fragment.fileName || 'No file yet')}</span>
            </div>
          </article>
        `).join('')
      : '<div class="workspace-doc-empty">No roadmap fragments yet. AI-authored ROADMAP_FRAGMENT files will appear here.</div>';

    el.roadmapFragmentList.querySelectorAll('[data-roadmap-fragment-preview]').forEach((button) => {
      button.addEventListener('click', () => {
        phase5State.selectedRoadmapFragmentId = button.dataset.roadmapFragmentPreview || null;
        void logUiEvent('roadmap', 'preview-fragment', { fragmentId: phase5State.selectedRoadmapFragmentId });
        const selectedFragment = getRoadmapFragments().find((fragment) => fragment.id === phase5State.selectedRoadmapFragmentId) || null;
        if (el.roadmapFragmentPreview) {
          renderMarkdownPreview(el.roadmapFragmentPreview, selectedFragment ? selectedFragment.markdown : '');
        }
        openFragmentPreviewModal('roadmap', selectedFragment);
      });
    });
    el.roadmapFragmentList.querySelectorAll('[data-roadmap-fragment-merge]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!taskState.project) return;
        const fragmentId = button.dataset.roadmapFragmentMerge || '';
        try {
          void logUiEvent('roadmap', 'merge-fragment', { fragmentId });
          const result = await fetchJSON(`${API}/projects/${taskState.project.id}/roadmap/fragments/${fragmentId}/merge`, { method: 'POST' });
          phase5State.roadmap = result.roadmap;
          phase5State.selectedRoadmapFragmentId = fragmentId;
          renderRoadmapWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to merge roadmap fragment');
        }
      });
    });
    el.roadmapFragmentList.querySelectorAll('[data-roadmap-fragment-integrate]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!taskState.project) return;
        const fragmentId = button.dataset.roadmapFragmentIntegrate || '';
        try {
          void logUiEvent('roadmap', 'integrate-fragment', { fragmentId });
          const result = await fetchJSON(`${API}/projects/${taskState.project.id}/roadmap/fragments/${fragmentId}/integrate`, { method: 'POST' });
          phase5State.roadmap = result.roadmap;
          phase5State.features = result.features;
          phase5State.selectedRoadmapFragmentId = fragmentId;
          renderRoadmapWorkspace();
          renderFeaturesWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to integrate roadmap fragment');
        }
      });
    });
  }

  if (el.roadmapFragmentPreview) {
    const fragments = getRoadmapFragments();
    const selected = fragments.find((fragment) => fragment.id === phase5State.selectedRoadmapFragmentId) || fragments[0] || null;
    if (selected && !phase5State.selectedRoadmapFragmentId) phase5State.selectedRoadmapFragmentId = selected.id;
    renderMarkdownPreview(el.roadmapFragmentPreview, selected ? selected.markdown : '');
  }

  renderWorkspacePluginManager();
  renderMarkdownPreview(el.roadmapMarkdownPreview, phase5State.roadmap && phase5State.roadmap.markdown);
  if (el.roadmapMermaid) {
    el.roadmapMermaid.value = phase5State.roadmap && phase5State.roadmap.mermaid ? phase5State.roadmap.mermaid : '';
    el.roadmapMermaid.readOnly = true;
  }
  renderMermaidPreview(el.roadmapMermaidPreview, phase5State.roadmap && phase5State.roadmap.mermaid);
}

function getRoadmapActivePhases() {
  return orderRoadmapPhases(getRoadmapPhases().filter((phase) => !phase.archived));
}

function getRoadmapArchivedPhases() {
  return getRoadmapPhases().filter((phase) => phase.archived);
}

function orderRoadmapPhases(phases) {
  const list = Array.isArray(phases) ? phases.slice() : [];
  const phaseById = new Map(list.map((phase) => [phase.id, phase]));
  const ordered = [];
  const visited = new Set();

  function visit(phase) {
    if (!phase || visited.has(phase.id)) return;
    visited.add(phase.id);
    ordered.push(phase);
    list
      .filter((candidate) => candidate.afterPhaseId === phase.id)
      .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
      .forEach(visit);
  }

  list
    .filter((phase) => !phase.afterPhaseId || !phaseById.has(phase.afterPhaseId))
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .forEach(visit);

  list
    .filter((phase) => !visited.has(phase.id))
    .sort((left, right) => Number(left.sortOrder || 0) - Number(right.sortOrder || 0))
    .forEach(visit);

  return ordered;
}

function getTaskForWorkItem(item) {
  if (!item || !item.taskId) return null;
  return taskState.tasks.find((task) => task.id === item.taskId) || null;
}

function populateDependencyOptions(selectEl, currentTaskId = '', selectedDependencyIds = []) {
  if (!selectEl) return;
  const selected = new Set(Array.isArray(selectedDependencyIds) ? selectedDependencyIds : []);
  selectEl.innerHTML = taskState.tasks
    .filter((task) => task.id !== currentTaskId)
    .map((task) => `<option value="${escapeAttr(task.id)}" ${selected.has(task.id) ? 'selected' : ''}>${escapeHtml(task.title)}</option>`)
    .join('');
}

function getFeaturePlanningBucket(feature) {
  if (!feature) return 'considered';
  return feature.planningBucket || (feature.roadmapPhaseId ? 'phase' : 'considered');
}

function getBugPlanningBucket(bug) {
  if (!bug) return 'considered';
  return bug.planningBucket || (bug.roadmapPhaseId ? 'phase' : 'considered');
}

function getRoadmapItemsForPhase(phaseId, kind) {
  if (kind === 'bugs') {
    return getBugsList()
      .filter((bug) => !bug.archived && getBugPlanningBucket(bug) === 'phase' && bug.roadmapPhaseId === phaseId)
      .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')));
  }
  return getFeaturesList()
    .filter((feature) => !feature.archived && getFeaturePlanningBucket(feature) === 'phase' && feature.roadmapPhaseId === phaseId)
    .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')));
}

function getRoadmapBucketItems(bucket, kind) {
  if (kind === 'bugs') {
    return getBugsList()
      .filter((bug) => !bug.archived && getBugPlanningBucket(bug) === bucket)
      .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')));
  }
  return getFeaturesList()
    .filter((feature) => !feature.archived && getFeaturePlanningBucket(feature) === bucket)
    .sort((left, right) => String(left.createdAt || '').localeCompare(String(right.createdAt || '')));
}

function formatItemDate(value) {
  if (!value) return 'No date';
  try {
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return String(value);
  }
}

function getDependencyTarget(task) {
  if (!task || !Array.isArray(task.dependencyIds) || !task.dependencyIds.length) return null;
  const dependencyId = task.dependencyIds[0];
  return taskState.tasks.find((candidate) => candidate.id === dependencyId) || null;
}

function getRoadmapCompletion(phaseId) {
  const features = getRoadmapItemsForPhase(phaseId, 'features');
  const bugs = getRoadmapItemsForPhase(phaseId, 'bugs');
  const total = features.length + bugs.length;
  if (!total) return 0;
  const doneFeatures = features.filter((feature) => feature.status === 'done').length;
  const doneBugs = bugs.filter((bug) => bug.completed || bug.status === 'resolved').length;
  return Math.round(((doneFeatures + doneBugs) / total) * 100);
}

function getRoadmapExecutiveSummary() {
  const markdown = phase5State.roadmap && phase5State.roadmap.markdown ? phase5State.roadmap.markdown : '';
  const match = markdown.match(/## Executive Summary\s+([\s\S]*?)\n## /);
  if (!match) return 'No executive summary generated yet.';
  return match[1]
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('>'))
    .join(' ')
    .trim() || 'No executive summary generated yet.';
}

function renderRoadmapItemLine(kind, item, options = {}) {
  const task = getTaskForWorkItem(item);
  const dependency = getDependencyTarget(task);
  return `
    <article class="roadmap-item-line ${options.compact ? 'is-compact' : ''}" draggable="${options.draggable === false ? 'false' : 'true'}" data-roadmap-item-kind="${escapeAttr(kind)}" data-roadmap-item-id="${escapeAttr(item.id)}">
      <button type="button" class="roadmap-item-code" data-work-item-open="${escapeAttr(kind)}:${escapeAttr(item.id)}">${escapeHtml(item.code || item.id)}</button>
      <div class="roadmap-item-copy">
        <div class="roadmap-item-title">${escapeHtml(item.title || 'Untitled')}</div>
        <div class="roadmap-item-meta">
          <span>${escapeHtml(formatItemDate(item.createdAt))}</span>
          ${dependency ? `<button type="button" class="dependency-chip" title="${escapeAttr(`${dependency.id}: ${dependency.title}`)}" data-dependency-open="${escapeAttr(dependency.id)}">Dependant on</button>` : ''}
        </div>
      </div>
    </article>
  `;
}

function renderRoadmapPhaseBubble(phase, options = {}) {
  const features = getRoadmapItemsForPhase(phase.id, 'features');
  const bugs = getRoadmapItemsForPhase(phase.id, 'bugs');
  const completion = getRoadmapCompletion(phase.id);
  const showActions = options.showActions !== false;
  return `
    <article class="roadmap-phase-bubble ${options.droppable ? 'is-droppable' : ''}" data-roadmap-phase="${escapeAttr(phase.id)}">
      <div class="roadmap-phase-header">
        <div>
          <h4>${escapeHtml(phase.name)}</h4>
          <div class="roadmap-phase-kicker">${escapeHtml(phase.targetDate || 'No target date')} · ${escapeHtml(phase.status || 'planned')} · ${completion}%</div>
        </div>
        ${showActions ? `
          <div class="workspace-doc-item-actions">
            <button type="button" class="btn btn-small btn-secondary" data-roadmap-edit="${escapeAttr(phase.id)}">Edit</button>
            <button type="button" class="btn btn-small btn-ghost" data-roadmap-archive="${escapeAttr(phase.id)}">${phase.archived ? 'Restore' : 'Archive'}</button>
            <button type="button" class="btn btn-small btn-ghost" data-roadmap-delete="${escapeAttr(phase.id)}">Delete</button>
          </div>
        ` : ''}
      </div>
      <div class="roadmap-phase-goal">${escapeHtml(phase.goal || 'No goal yet.')}</div>
      <div class="roadmap-phase-summary">${escapeHtml(phase.summary || 'No summary yet.')}</div>
      <div class="roadmap-phase-progress"><span style="width:${completion}%"></span></div>
      <div class="roadmap-phase-lists">
        <section>
          <h5>Features</h5>
          <div class="roadmap-phase-items">${features.length ? features.map((feature) => renderRoadmapItemLine('feature', feature, options)).join('') : '<div class="workspace-doc-empty">No features</div>'}</div>
        </section>
        <section>
          <h5>Bugs</h5>
          <div class="roadmap-phase-items">${bugs.length ? bugs.map((bug) => renderRoadmapItemLine('bug', bug, options)).join('') : '<div class="workspace-doc-empty">No bugs</div>'}</div>
        </section>
      </div>
    </article>
  `;
}

function renderRoadmapFlow(container, options = {}) {
  if (!container) return;
  const phases = options.archived ? getRoadmapArchivedPhases() : getRoadmapActivePhases();
  container.innerHTML = phases.length
    ? phases.map((phase) => renderRoadmapPhaseBubble(phase, options)).join('<div class="roadmap-phase-connector">→</div>')
    : '<div class="workspace-doc-empty">No phases yet.</div>';
}

async function setRoadmapItemPlacement(kind, itemId, nextPlacement) {
  if (!taskState.project) return;
  const routeBase = kind === 'bug' ? 'bugs' : 'features';
  await fetchJSON(`${API}/projects/${taskState.project.id}/${routeBase}/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(nextPlacement),
  });
  await refreshTaskWorkspace();
}

function findDetailTargetByTaskId(taskId) {
  const feature = getFeaturesList().find((item) => item.taskId === taskId);
  if (feature) return { kind: 'feature', item: feature };
  const bug = getBugsList().find((item) => item.taskId === taskId);
  if (bug) return { kind: 'bug', item: bug };
  const task = taskState.tasks.find((item) => item.id === taskId);
  return task ? { kind: 'task', item: task } : null;
}

function renderDetailRows(rows) {
  return rows.map((row) => `
    <div class="work-item-detail-row">
      <span>${escapeHtml(row.label)}</span>
      <strong>${escapeHtml(row.value)}</strong>
    </div>
  `).join('');
}

function openWorkItemDetail(kind, id) {
  let item = null;
  if (kind === 'feature') item = getFeaturesList().find((entry) => entry.id === id) || null;
  else if (kind === 'bug') item = getBugsList().find((entry) => entry.id === id) || null;
  else item = taskState.tasks.find((entry) => entry.id === id) || null;
  if (!item || !el.modalWorkItemDetail) return;

  const task = kind === 'task' ? item : getTaskForWorkItem(item);
  if (el.workItemDetailTitle) el.workItemDetailTitle.textContent = `${item.code || item.id}: ${item.title}`;
  if (el.btnWorkItemDetailEdit) {
    el.btnWorkItemDetailEdit.dataset.kind = kind;
    el.btnWorkItemDetailEdit.dataset.id = id;
  }

  const rows = [];
  if (kind === 'feature') {
    rows.push({ label: 'Status', value: item.status || 'planned' });
    rows.push({ label: 'Category', value: item.category || 'Uncategorized' });
    rows.push({ label: 'Priority', value: (task && task.priority) || 'medium' });
    rows.push({ label: 'Planning Bucket', value: getFeaturePlanningBucket(item) });
    rows.push({ label: 'Added', value: formatItemDate(item.createdAt) });
  } else if (kind === 'bug') {
    rows.push({ label: 'Status', value: item.status || 'open' });
    rows.push({ label: 'Severity', value: item.severity || 'medium' });
    rows.push({ label: 'Category', value: item.category || 'Uncategorized' });
    rows.push({ label: 'Planning Bucket', value: getBugPlanningBucket(item) });
    rows.push({ label: 'Added', value: formatItemDate(item.createdAt) });
  } else {
    rows.push({ label: 'Status', value: item.status || 'todo' });
    rows.push({ label: 'Category', value: item.category || 'Uncategorized' });
    rows.push({ label: 'Priority', value: item.priority || 'medium' });
    rows.push({ label: 'Planning Bucket', value: item.planningBucket || 'considered' });
    rows.push({ label: 'Added', value: formatItemDate(item.createdAt) });
  }
  if (task && task.assignedTo) rows.push({ label: 'Assigned To', value: task.assignedTo });
  if (task && task.dueDate) rows.push({ label: 'Due Date', value: formatTaskDate(task.dueDate) });
  if (task && task.startDate) rows.push({ label: 'Start Date', value: formatTaskDate(task.startDate) });
  if (task && task.endDate) rows.push({ label: 'End Date', value: formatTaskDate(task.endDate) });
  if (task) rows.push({ label: 'Progress', value: `${Math.round(Number(task.progress || 0))}%` });
  if (task && task.milestone) rows.push({ label: 'Milestone', value: 'Yes' });

  if (el.workItemDetailBody) {
    el.workItemDetailBody.innerHTML = `
      <div class="work-item-detail-grid">
        ${renderDetailRows(rows)}
      </div>
      <article class="work-item-detail-section">
        <h3>Description</h3>
        <p>${escapeHtml(kind === 'bug' ? (item.currentBehavior || item.summary || 'No current behavior recorded.') : (item.summary || item.description || 'No description recorded.'))}</p>
      </article>
      ${kind === 'bug' ? `
        <article class="work-item-detail-section">
          <h3>Expected Behavior</h3>
          <p>${escapeHtml(item.expectedBehavior || 'No expected behavior recorded.')}</p>
        </article>
      ` : ''}
      ${task && Array.isArray(task.dependencyIds) && task.dependencyIds.length ? `
        <article class="work-item-detail-section">
          <h3>Dependencies</h3>
          <div class="work-item-detail-links">
            ${task.dependencyIds.map((dependencyId) => {
              const target = findDetailTargetByTaskId(dependencyId);
              const label = target ? `${target.item.code || target.item.id}: ${target.item.title}` : dependencyId;
              return `<button type="button" class="dependency-chip" data-dependency-open="${escapeAttr(dependencyId)}">${escapeHtml(label)}</button>`;
            }).join('')}
          </div>
        </article>
      ` : ''}
    `;
    el.workItemDetailBody.querySelectorAll('[data-dependency-open]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = findDetailTargetByTaskId(button.dataset.dependencyOpen);
        if (target) openWorkItemDetail(target.kind, target.item.id);
      });
    });
  }
  el.modalWorkItemDetail.showModal();
}

function bindRoadmapItemInteractions(container) {
  if (!container) return;
  container.querySelectorAll('[data-work-item-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const [kind, id] = String(button.dataset.workItemOpen || '').split(':');
      openWorkItemDetail(kind, id);
    });
  });
  container.querySelectorAll('[data-dependency-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = findDetailTargetByTaskId(button.dataset.dependencyOpen);
      if (target) openWorkItemDetail(target.kind, target.item.id);
    });
  });
  container.querySelectorAll('.roadmap-item-line[draggable="true"]').forEach((itemEl) => {
    itemEl.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('application/json', JSON.stringify({
        kind: itemEl.dataset.roadmapItemKind,
        id: itemEl.dataset.roadmapItemId,
      }));
      itemEl.classList.add('is-dragging');
    });
    itemEl.addEventListener('dragend', () => itemEl.classList.remove('is-dragging'));
  });
}

function bindRoadmapDropTargets(container) {
  if (!container) return;
  container.querySelectorAll('[data-roadmap-phase], [data-roadmap-drop-target]').forEach((dropTarget) => {
    if (dropTarget.dataset.dropBound === '1') return;
    dropTarget.dataset.dropBound = '1';
    dropTarget.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropTarget.classList.add('is-drop-target');
    });
    dropTarget.addEventListener('dragleave', () => dropTarget.classList.remove('is-drop-target'));
    dropTarget.addEventListener('drop', async (event) => {
      event.preventDefault();
      dropTarget.classList.remove('is-drop-target');
      const payload = event.dataTransfer.getData('application/json');
      if (!payload) return;
      const item = JSON.parse(payload);
      const isPhase = !!dropTarget.dataset.roadmapPhase;
      await setRoadmapItemPlacement(item.kind, item.id, isPhase
        ? { planningBucket: 'phase', roadmapPhaseId: dropTarget.dataset.roadmapPhase, archived: false }
        : { planningBucket: dropTarget.dataset.roadmapDropTarget, roadmapPhaseId: null, archived: false });
    });
  });
}

function renderRoadmapFragmentsList(container, fragments) {
  if (!container) return;
  container.innerHTML = fragments.length
    ? fragments.map((fragment) => `
        <article class="workspace-doc-item ${phase5State.selectedRoadmapFragmentId === fragment.id ? 'is-selected' : ''} ${fragment.status === 'integrated' ? 'is-archived' : ''}">
          <div class="workspace-doc-item-top">
            <div>
              <strong>${escapeHtml(fragment.title || fragment.code)}</strong>
              <span>${escapeHtml(fragment.status || 'draft')}</span>
            </div>
            <div class="workspace-doc-item-actions">
              <button type="button" class="btn btn-small btn-secondary" data-roadmap-fragment-preview="${escapeAttr(fragment.id)}">Preview</button>
              <button type="button" class="btn btn-small btn-secondary" data-roadmap-fragment-merge="${escapeAttr(fragment.id)}" ${fragment.status === 'integrated' ? 'disabled' : ''}>${fragment.merged ? 'Re-merge' : 'Merge'}</button>
              <button type="button" class="btn btn-small btn-secondary" data-roadmap-fragment-integrate="${escapeAttr(fragment.id)}" ${fragment.status === 'integrated' ? 'disabled' : ''}>${fragment.status === 'integrated' ? 'Integrated' : 'Integrate'}</button>
            </div>
          </div>
          <div class="workspace-doc-item-meta">
            <span>${escapeHtml(fragment.code || 'No code')}</span>
            <span>${escapeHtml(fragment.fileName || 'No file yet')}</span>
          </div>
        </article>
      `).join('')
    : '<div class="workspace-doc-empty">No roadmap fragments yet.</div>';
}

function renderRoadmapWorkspace() {
  const roadmap = phase5State.roadmap || {};
  const fragments = getRoadmapFragments();
  const selectedFragment = fragments.find((fragment) => fragment.id === phase5State.selectedRoadmapFragmentId) || fragments[0] || null;
  if (selectedFragment && !phase5State.selectedRoadmapFragmentId) phase5State.selectedRoadmapFragmentId = selectedFragment.id;

  document.querySelectorAll('[data-roadmap-panel]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.roadmapPanel === phase5State.roadmapPanel);
  });
  document.querySelectorAll('[data-roadmap-panel-view]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.roadmapPanelView === phase5State.roadmapPanel);
  });
  document.querySelectorAll('[data-roadmap-phase-panel]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.roadmapPhasePanel === phase5State.roadmapPhasePanel);
  });
  document.querySelectorAll('[data-roadmap-phase-panel-view]').forEach((panel) => {
    panel.classList.toggle('is-active', panel.dataset.roadmapPhasePanelView === phase5State.roadmapPhasePanel);
  });
  document.querySelectorAll('[data-roadmap-bucket-group]').forEach((button) => {
    const group = button.dataset.roadmapBucketGroup;
    const kind = button.dataset.roadmapBucketKind;
    button.classList.toggle('is-active', phase5State.roadmapBucketTabs[group] === kind);
  });

  if (el.roadmapVersion) {
    el.roadmapVersion.innerHTML = `
      <div class="work-item-detail-grid">
        ${renderDetailRows([
          { label: 'Template Version', value: roadmap.templateVersion || 'Unversioned' },
          { label: 'Template Updated', value: roadmap.templateLastUpdated || 'Unknown' },
          { label: 'Active Phases', value: String(getRoadmapActivePhases().length) },
        ])}
      </div>
    `;
  }
  if (el.roadmapExecutiveSummary) {
    el.roadmapExecutiveSummary.textContent = getRoadmapExecutiveSummary();
  }

  renderRoadmapFlow(el.roadmapGeneralFlowchart, { showActions: false, draggable: false });
  renderRoadmapFlow(el.roadmapPhaseFlowchart, { droppable: true });
  bindRoadmapItemInteractions(el.roadmapGeneralFlowchart);
  bindRoadmapItemInteractions(el.roadmapPhaseFlowchart);
  bindRoadmapDropTargets(el.roadmapPhaseFlowchart);

  if (el.roadmapPlannedItems) {
    const kind = phase5State.roadmapBucketTabs.planned;
    const items = getRoadmapBucketItems('planned', kind);
    el.roadmapPlannedItems.innerHTML = items.length
      ? items.map((item) => renderRoadmapItemLine(kind === 'bugs' ? 'bug' : 'feature', item)).join('')
      : '<div class="workspace-doc-empty">No planned items.</div>';
    bindRoadmapItemInteractions(el.roadmapPlannedItems);
  }
  if (el.roadmapConsideredItems) {
    const kind = phase5State.roadmapBucketTabs.considered;
    const items = getRoadmapBucketItems('considered', kind);
    el.roadmapConsideredItems.innerHTML = items.length
      ? items.map((item) => renderRoadmapItemLine(kind === 'bugs' ? 'bug' : 'feature', item)).join('')
      : '<div class="workspace-doc-empty">No considered items.</div>';
    bindRoadmapItemInteractions(el.roadmapConsideredItems);
  }
  bindRoadmapDropTargets(document);

  if (el.roadmapArchivedPhaseList) {
    const archivedPhases = getRoadmapArchivedPhases();
    el.roadmapArchivedPhaseList.innerHTML = archivedPhases.length
      ? archivedPhases.map((phase) => `
          <article class="workspace-doc-item is-archived">
            <div class="workspace-doc-item-top">
              <div>
                <strong>${escapeHtml(`${phase.code}: ${phase.name}`)}</strong>
                <span>${escapeHtml(phase.status || 'planned')}</span>
              </div>
              <div class="workspace-doc-item-actions">
                <button type="button" class="btn btn-small btn-secondary" data-roadmap-edit="${escapeAttr(phase.id)}">Edit</button>
                <button type="button" class="btn btn-small btn-secondary" data-roadmap-archive="${escapeAttr(phase.id)}">Restore</button>
              </div>
            </div>
            <p>${escapeHtml(phase.summary || phase.goal || 'No summary yet.')}</p>
          </article>
        `).join('')
      : '<div class="workspace-doc-empty">No archived phases.</div>';
  }
  if (el.roadmapArchivedFragmentList) {
    const archivedFragments = fragments.filter((fragment) => fragment.merged || fragment.status === 'integrated');
    el.roadmapArchivedFragmentList.innerHTML = archivedFragments.length
      ? archivedFragments.map((fragment) => `
          <article class="workspace-doc-item is-archived">
            <div class="workspace-doc-item-top">
              <div>
                <strong>${escapeHtml(fragment.title || fragment.code)}</strong>
                <span>${escapeHtml(fragment.status || 'merged')}</span>
              </div>
            </div>
            <div class="workspace-doc-item-meta">
              <span>${escapeHtml(fragment.fileName || 'No file')}</span>
            </div>
          </article>
        `).join('')
      : '<div class="workspace-doc-empty">No merged fragments yet.</div>';
  }

  renderRoadmapFragmentsList(el.roadmapFragmentList, fragments);
  renderRoadmapFragmentsList(el.roadmapFragmentMergeList, fragments.filter((fragment) => fragment.status !== 'integrated'));
  renderMarkdownPreview(el.roadmapFragmentPreview, selectedFragment ? selectedFragment.markdown : '');
  renderMarkdownPreview(el.roadmapMarkdownPreview, roadmap.markdown);
  if (el.roadmapMermaid) {
    el.roadmapMermaid.value = roadmap.mermaid || '';
    el.roadmapMermaid.readOnly = true;
  }
  renderMermaidPreview(el.roadmapMermaidPreview, roadmap.mermaid);
  renderWorkspacePluginManager();

  document.querySelectorAll('[data-roadmap-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      const phase = getRoadmapPhases().find((item) => item.id === button.dataset.roadmapEdit);
      if (phase) openRoadmapPhaseModal(phase);
    });
  });
  document.querySelectorAll('[data-roadmap-archive]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!taskState.project) return;
      const phase = getRoadmapPhases().find((item) => item.id === button.dataset.roadmapArchive);
      if (!phase) return;
      await fetchJSON(`${API}/projects/${taskState.project.id}/roadmap/phases/${phase.id}`, {
        method: 'PUT',
        body: JSON.stringify({ archived: !phase.archived }),
      });
      await refreshTaskWorkspace();
    });
  });
  document.querySelectorAll('[data-roadmap-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!taskState.project) return;
      if (!confirm('Delete this roadmap phase? Linked items will become unassigned.')) return;
      await fetchJSON(`${API}/projects/${taskState.project.id}/roadmap/phases/${button.dataset.roadmapDelete}`, { method: 'DELETE' });
      await refreshTaskWorkspace();
    });
  });
  document.querySelectorAll('[data-roadmap-fragment-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      phase5State.selectedRoadmapFragmentId = button.dataset.roadmapFragmentPreview || null;
      const selectedFragment = getRoadmapFragments().find((fragment) => fragment.id === phase5State.selectedRoadmapFragmentId) || null;
      if (el.roadmapFragmentPreview) {
        renderMarkdownPreview(el.roadmapFragmentPreview, selectedFragment ? selectedFragment.markdown : '');
      }
      openFragmentPreviewModal('roadmap', selectedFragment);
    });
  });
  document.querySelectorAll('[data-roadmap-fragment-merge]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!taskState.project) return;
      const fragmentId = button.dataset.roadmapFragmentMerge || '';
      const result = await fetchJSON(`${API}/projects/${taskState.project.id}/roadmap/fragments/${fragmentId}/merge`, { method: 'POST' });
      phase5State.roadmap = result.roadmap;
      phase5State.selectedRoadmapFragmentId = fragmentId;
      renderRoadmapWorkspace();
    });
  });
  document.querySelectorAll('[data-roadmap-fragment-integrate]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!taskState.project) return;
      const fragmentId = button.dataset.roadmapFragmentIntegrate || '';
      const result = await fetchJSON(`${API}/projects/${taskState.project.id}/roadmap/fragments/${fragmentId}/integrate`, { method: 'POST' });
      phase5State.roadmap = result.roadmap;
      phase5State.features = result.features;
      phase5State.selectedRoadmapFragmentId = fragmentId;
      renderRoadmapWorkspace();
      renderFeaturesWorkspace();
    });
  });
}

function renderFeaturesWorkspace() {
  if (el.featureList) {
    const features = getFeaturesList();
    el.featureList.innerHTML = features.length
      ? features.map((feature) => `
          <article class="workspace-doc-item ${feature.archived ? 'is-archived' : ''}">
            <div class="workspace-doc-item-top">
              <div>
                <strong>${escapeHtml(`${feature.code}: ${feature.title}`)}</strong>
                <span>${escapeHtml(feature.status || 'proposed')}</span>
              </div>
              <div class="workspace-doc-item-actions">
                <button type="button" class="btn btn-small btn-secondary" data-feature-edit="${escapeAttr(feature.id)}">Edit</button>
                <button type="button" class="btn btn-small btn-ghost" data-feature-delete="${escapeAttr(feature.id)}">Delete</button>
              </div>
              </div>
              <p>${escapeHtml(feature.summary || 'No summary yet.')}</p>
              <div class="workspace-doc-item-meta">
                <span>${escapeHtml((getRoadmapPhases().find((phase) => phase.id === feature.roadmapPhaseId) || {}).name || 'No phase')}</span>
                <span>${escapeHtml(getLinkedTaskTitle(feature.taskId))}</span>
                <span>${feature.archived ? 'Archived' : 'Active'}</span>
                <span>${(() => {
                  const fragment = getPrdFragmentForFeature(feature.id);
                  return fragment ? `Fragment: ${fragment.merged ? 'Merged' : (fragment.status || 'Draft')}` : 'Fragment: Pending';
                })()}</span>
              </div>
            </article>
          `).join('')
      : '<div class="workspace-doc-empty">Enable the Software module: Features and add feature records to generate FEATURES.md.</div>';

    el.featureList.querySelectorAll('[data-feature-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const feature = getFeaturesList().find((item) => item.id === button.dataset.featureEdit);
        if (feature) openFeatureModal(feature);
      });
    });
    el.featureList.querySelectorAll('[data-feature-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!taskState.project) return;
        if (!confirm('Delete this feature?')) return;
        try {
          void logUiEvent('features', 'delete-feature', { featureId: button.dataset.featureDelete });
          await fetchJSON(`${API}/projects/${taskState.project.id}/features/${button.dataset.featureDelete}`, { method: 'DELETE' });
          await refreshTaskWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to delete feature');
        }
      });
    });
  }

  renderMarkdownPreview(el.featuresMarkdownPreview, phase5State.features && phase5State.features.markdown);
  if (el.featuresMermaid) {
    el.featuresMermaid.value = phase5State.features && phase5State.features.mermaid ? phase5State.features.mermaid : '';
    el.featuresMermaid.readOnly = true;
  }
  renderMermaidPreview(el.featuresMermaidPreview, phase5State.features && phase5State.features.mermaid);
}

function renderBugsWorkspace() {
  if (el.bugList) {
    const bugs = getBugsList();
    el.bugList.innerHTML = bugs.length
      ? bugs.map((bug) => `
          <article class="workspace-doc-item ${bug.archived ? 'is-archived' : ''}">
            <div class="workspace-doc-item-top">
              <div>
                <strong>${escapeHtml(`${bug.code}: ${bug.title}`)}</strong>
                <span>${escapeHtml(bug.severity || 'medium')}</span>
              </div>
              <div class="workspace-doc-item-actions">
                <button type="button" class="btn btn-small btn-secondary" data-bug-edit="${escapeAttr(bug.id)}">Edit</button>
                <button type="button" class="btn btn-small btn-ghost" data-bug-delete="${escapeAttr(bug.id)}">Delete</button>
              </div>
            </div>
            <p>${escapeHtml(bug.currentBehavior || bug.summary || 'No current behavior recorded yet.')}</p>
            <div class="workspace-doc-item-meta">
              <span>${escapeHtml(bug.status || 'open')}</span>
              <span>${bug.completed ? 'Completed' : 'Incomplete'}</span>
              <span>${bug.regressed ? 'Regressed' : 'Stable'}</span>
            </div>
          </article>
        `).join('')
      : '<div class="workspace-doc-empty">Enable the Software module: Bugs and add bug records to generate BUGS.md.</div>';

    el.bugList.querySelectorAll('[data-bug-edit]').forEach((button) => {
      button.addEventListener('click', () => {
        const bug = getBugsList().find((item) => item.id === button.dataset.bugEdit);
        if (bug) openBugModal(bug);
      });
    });
    el.bugList.querySelectorAll('[data-bug-delete]').forEach((button) => {
      button.addEventListener('click', async () => {
        if (!taskState.project) return;
        if (!confirm('Delete this bug record?')) return;
        try {
          void logUiEvent('bugs', 'delete-bug', { bugId: button.dataset.bugDelete });
          await fetchJSON(`${API}/projects/${taskState.project.id}/bugs/${button.dataset.bugDelete}`, { method: 'DELETE' });
          await refreshTaskWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to delete bug');
        }
      });
    });
  }

  renderMarkdownPreview(el.bugsMarkdownPreview, phase5State.bugs && phase5State.bugs.markdown);
  if (el.bugsMermaid) {
    el.bugsMermaid.value = phase5State.bugs && phase5State.bugs.mermaid ? phase5State.bugs.mermaid : '';
    el.bugsMermaid.readOnly = true;
  }
  renderMermaidPreview(el.bugsMermaidPreview, phase5State.bugs && phase5State.bugs.mermaid);
}

function createPrdTimestamp(value = null) {
  return value || new Date().toISOString();
}

function createPrdId(prefix = 'prd') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createPrdTextEntry(overrides = {}) {
  return {
    id: createPrdId('prdt'),
    text: '',
    versionDate: createPrdTimestamp(),
    ...overrides,
  };
}

function createPrdDetailEntry(overrides = {}) {
  return {
    id: createPrdId('prdi'),
    title: '',
    description: '',
    versionDate: createPrdTimestamp(),
    ...overrides,
  };
}

function createPrdRiskEntry(overrides = {}) {
  return {
    id: createPrdId('prdr'),
    risk: '',
    mitigation: '',
    versionDate: createPrdTimestamp(),
    ...overrides,
  };
}

function normalizePrdTextEntries(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    if (typeof item === 'string') return createPrdTextEntry({ text: item, versionDate: '' });
    if (!item || typeof item !== 'object') return null;
    return createPrdTextEntry({
      id: item.id || createPrdId('prdt'),
      text: item.text || item.title || item.description || '',
      versionDate: item.versionDate || item.updatedAt || item.createdAt || createPrdTimestamp(),
    });
  }).filter(Boolean);
}

function normalizePrdDetailEntries(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    if (typeof item === 'string') return createPrdDetailEntry({ title: item, versionDate: '' });
    if (!item || typeof item !== 'object') return null;
    return createPrdDetailEntry({
      id: item.id || createPrdId('prdi'),
      title: item.title || item.text || '',
      description: item.description || item.summary || item.details || '',
      versionDate: item.versionDate || item.updatedAt || item.createdAt || createPrdTimestamp(),
      featureId: item.featureId || null,
      sourceFeatureId: item.sourceFeatureId || null,
    });
  }).filter(Boolean);
}

function normalizePrdRiskEntries(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    if (typeof item === 'string') return createPrdRiskEntry({ risk: item, versionDate: '' });
    if (!item || typeof item !== 'object') return null;
    return createPrdRiskEntry({
      id: item.id || createPrdId('prdr'),
      risk: item.risk || item.title || item.text || '',
      mitigation: item.mitigation || item.description || '',
      versionDate: item.versionDate || item.updatedAt || item.createdAt || createPrdTimestamp(),
    });
  }).filter(Boolean);
}

function normalizePrdAppliedEntries(items) {
  return (Array.isArray(items) ? items : []).map((item) => {
    if (!item || typeof item !== 'object') return null;
    return {
      fragmentId: item.fragmentId || null,
      title: item.title || item.fragmentId || 'Fragment',
      sourceFeatureId: item.sourceFeatureId || null,
      status: item.status || 'merged',
      integratedAt: item.integratedAt || null,
      versionDate: item.versionDate || item.integratedAt || item.updatedAt || createPrdTimestamp(),
      notes: item.notes || '',
      fileName: item.fileName || '',
    };
  }).filter(Boolean);
}

function normalizePrdEditorState(rawState) {
  const base = rawState && typeof rawState === 'object' ? rawState : {};
  return {
    executiveSummary: {
      text: base.executiveSummary && typeof base.executiveSummary === 'object' ? (base.executiveSummary.text || '') : '',
      versionDate: base.executiveSummary && typeof base.executiveSummary === 'object'
        ? (base.executiveSummary.versionDate || createPrdTimestamp())
        : createPrdTimestamp(),
    },
    productOverview: {
      productName: base.productOverview && typeof base.productOverview === 'object'
        ? (base.productOverview.productName || (taskState.project && taskState.project.name) || '')
        : (taskState.project && taskState.project.name) || '',
      vision: base.productOverview && typeof base.productOverview === 'object' ? (base.productOverview.vision || '') : '',
      targetAudiences: normalizePrdTextEntries(base.productOverview && base.productOverview.targetAudiences),
      keyValueProps: normalizePrdTextEntries(base.productOverview && base.productOverview.keyValueProps),
      versionDate: base.productOverview && typeof base.productOverview === 'object'
        ? (base.productOverview.versionDate || createPrdTimestamp())
        : createPrdTimestamp(),
    },
    functionalRequirements: {
      workflows: normalizePrdDetailEntries(base.functionalRequirements && base.functionalRequirements.workflows),
      userActions: normalizePrdDetailEntries(base.functionalRequirements && base.functionalRequirements.userActions),
      systemBehaviors: normalizePrdDetailEntries(base.functionalRequirements && base.functionalRequirements.systemBehaviors),
      versionDate: base.functionalRequirements && typeof base.functionalRequirements === 'object'
        ? (base.functionalRequirements.versionDate || createPrdTimestamp())
        : createPrdTimestamp(),
    },
    nonFunctionalRequirements: {
      usability: base.nonFunctionalRequirements && typeof base.nonFunctionalRequirements === 'object' ? (base.nonFunctionalRequirements.usability || '') : '',
      reliability: base.nonFunctionalRequirements && typeof base.nonFunctionalRequirements === 'object' ? (base.nonFunctionalRequirements.reliability || '') : '',
      accessibility: base.nonFunctionalRequirements && typeof base.nonFunctionalRequirements === 'object' ? (base.nonFunctionalRequirements.accessibility || '') : '',
      security: base.nonFunctionalRequirements && typeof base.nonFunctionalRequirements === 'object' ? (base.nonFunctionalRequirements.security || '') : '',
      performance: base.nonFunctionalRequirements && typeof base.nonFunctionalRequirements === 'object' ? (base.nonFunctionalRequirements.performance || '') : '',
      versionDate: base.nonFunctionalRequirements && typeof base.nonFunctionalRequirements === 'object'
        ? (base.nonFunctionalRequirements.versionDate || createPrdTimestamp())
        : createPrdTimestamp(),
    },
    technicalArchitecture: normalizePrdDetailEntries(base.technicalArchitecture),
    implementationPlan: {
      sequencing: normalizePrdDetailEntries(base.implementationPlan && base.implementationPlan.sequencing),
      dependencies: normalizePrdDetailEntries(base.implementationPlan && base.implementationPlan.dependencies),
      milestones: normalizePrdDetailEntries(base.implementationPlan && base.implementationPlan.milestones),
      versionDate: base.implementationPlan && typeof base.implementationPlan === 'object'
        ? (base.implementationPlan.versionDate || createPrdTimestamp())
        : createPrdTimestamp(),
    },
    successMetrics: normalizePrdDetailEntries(base.successMetrics),
    risksMitigations: normalizePrdRiskEntries(base.risksMitigations),
    futureEnhancements: normalizePrdDetailEntries(base.futureEnhancements),
    appliedFragments: normalizePrdAppliedEntries(base.appliedFragments),
    conclusion: typeof base.conclusion === 'string' ? base.conclusion : '',
  };
}

function getPrdEditorState() {
  if (!phase5State.prd) {
    phase5State.prd = {
      markdown: '',
      mermaid: '',
      editorState: normalizePrdEditorState(null),
      fragments: [],
    };
  }
  phase5State.prd.editorState = normalizePrdEditorState(phase5State.prd.editorState);
  return phase5State.prd.editorState;
}

function formatPrdDateLabel(value) {
  if (!value) return 'Version date pending';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? `Updated ${date.toLocaleString()}`
    : `Updated ${value}`;
}

function renderPrdHelp(text) {
  return `<span class="prd-help" title="${escapeAttr(text)}" aria-label="${escapeAttr(text)}">&#9432;</span>`;
}

function renderPrdTextEntryEditor(title, path, items, options = {}) {
  return `
    <div class="prd-editor-subsection">
      <div class="prd-editor-subsection-header">
        <h5><span class="prd-icon">${escapeHtml(options.icon || 'TXT')}</span>${escapeHtml(title)} ${renderPrdHelp(options.help || title)}</h5>
        <button type="button" class="btn btn-small btn-secondary" data-prd-add-list="${escapeAttr(path)}">Add</button>
      </div>
      <div class="prd-editor-list">
        ${items.length
          ? items.map((item, index) => `
              <div class="prd-editor-item">
                <div class="prd-editor-item-toolbar">
                  <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(item.versionDate))}</span>
                  <button type="button" class="btn btn-small btn-ghost" data-prd-remove-list="${escapeAttr(path)}" data-prd-index="${index}">Remove</button>
                </div>
                <textarea rows="2" data-prd-list="${escapeAttr(path)}" data-prd-index="${index}" data-prd-item-field="text" placeholder="${escapeAttr(options.placeholder || 'Add an item')}">${escapeHtml(item.text || '')}</textarea>
              </div>
            `).join('')
          : '<div class="workspace-doc-empty">Nothing added yet.</div>'}
      </div>
    </div>
  `;
}

function renderPrdDetailEntryEditor(title, path, items, options = {}) {
  return `
    <div class="prd-editor-subsection">
      <div class="prd-editor-subsection-header">
        <h5><span class="prd-icon">${escapeHtml(options.icon || 'DOC')}</span>${escapeHtml(title)} ${renderPrdHelp(options.help || title)}</h5>
        <button type="button" class="btn btn-small btn-secondary" data-prd-add-list="${escapeAttr(path)}">Add</button>
      </div>
      <div class="prd-editor-list">
        ${items.length
          ? items.map((item, index) => `
              <div class="prd-editor-item">
                <div class="prd-editor-item-toolbar">
                  <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(item.versionDate))}</span>
                  <button type="button" class="btn btn-small btn-ghost" data-prd-remove-list="${escapeAttr(path)}" data-prd-index="${index}">Remove</button>
                </div>
                <input type="text" data-prd-list="${escapeAttr(path)}" data-prd-index="${index}" data-prd-item-field="title" placeholder="${escapeAttr(options.titlePlaceholder || 'Title')}" value="${escapeAttr(item.title || '')}" />
                <textarea rows="3" data-prd-list="${escapeAttr(path)}" data-prd-index="${index}" data-prd-item-field="description" placeholder="${escapeAttr(options.descriptionPlaceholder || 'Describe this item')}">${escapeHtml(item.description || '')}</textarea>
              </div>
            `).join('')
          : '<div class="workspace-doc-empty">Nothing added yet.</div>'}
      </div>
    </div>
  `;
}

function renderPrdRiskEditor(items) {
  return `
    <div class="prd-editor-subsection">
      <div class="prd-editor-subsection-header">
        <h5><span class="prd-icon">RISK</span>Risks and Mitigations ${renderPrdHelp('Track the risk and the mitigation together so the resulting PRD stays actionable.')}</h5>
        <button type="button" class="btn btn-small btn-secondary" data-prd-add-list="risksMitigations">Add risk</button>
      </div>
      <div class="prd-editor-list">
        ${items.length
          ? items.map((item, index) => `
              <div class="prd-editor-item">
                <div class="prd-editor-item-toolbar">
                  <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(item.versionDate))}</span>
                  <button type="button" class="btn btn-small btn-ghost" data-prd-remove-list="risksMitigations" data-prd-index="${index}">Remove</button>
                </div>
                <input type="text" data-prd-list="risksMitigations" data-prd-index="${index}" data-prd-item-field="risk" placeholder="Risk" value="${escapeAttr(item.risk || '')}" />
                <textarea rows="3" data-prd-list="risksMitigations" data-prd-index="${index}" data-prd-item-field="mitigation" placeholder="Mitigation">${escapeHtml(item.mitigation || '')}</textarea>
              </div>
            `).join('')
          : '<div class="workspace-doc-empty">No risks tracked yet.</div>'}
      </div>
    </div>
  `;
}

function syncPrdStateFromBuilder() {
  if (!el.prdEditorBuilder) return getPrdEditorState();
  const state = getPrdEditorState();
  const fieldNodes = el.prdEditorBuilder.querySelectorAll('[data-prd-field]');
  fieldNodes.forEach((node) => {
    const keys = (node.dataset.prdField || '').split('.');
    if (!keys[0]) return;
    let target = state;
    for (let index = 0; index < keys.length - 1; index += 1) {
      if (!target[keys[index]] || typeof target[keys[index]] !== 'object') target[keys[index]] = {};
      target = target[keys[index]];
    }
    target[keys[keys.length - 1]] = node.value;
    if (state[keys[0]] && typeof state[keys[0]] === 'object' && !Array.isArray(state[keys[0]])) {
      state[keys[0]].versionDate = createPrdTimestamp();
    }
  });
  const listGroups = new Map();
  el.prdEditorBuilder.querySelectorAll('[data-prd-list]').forEach((node) => {
    const path = node.dataset.prdList || '';
    const index = Number(node.dataset.prdIndex || 0);
    const field = node.dataset.prdItemField || '';
    if (!path || !field) return;
    if (!listGroups.has(path)) listGroups.set(path, []);
    if (!listGroups.get(path)[index]) listGroups.get(path)[index] = {};
    listGroups.get(path)[index][field] = node.value;
  });
  listGroups.forEach((items, path) => {
    const normalized = items.filter(Boolean).map((item) => {
      if (path === 'productOverview.targetAudiences' || path === 'productOverview.keyValueProps') {
        return createPrdTextEntry({ text: item.text || '', versionDate: createPrdTimestamp() });
      }
      if (path === 'risksMitigations') {
        return createPrdRiskEntry({ risk: item.risk || '', mitigation: item.mitigation || '', versionDate: createPrdTimestamp() });
      }
      return createPrdDetailEntry({ title: item.title || '', description: item.description || '', versionDate: createPrdTimestamp() });
    });
    const keys = path.split('.');
    if (keys.length === 1) {
      state[keys[0]] = normalized;
      return;
    }
    if (!state[keys[0]] || typeof state[keys[0]] !== 'object') state[keys[0]] = {};
    state[keys[0]][keys[1]] = normalized;
    state[keys[0]].versionDate = createPrdTimestamp();
  });
  phase5State.prd.editorState = state;
  return state;
}

function mutatePrdList(path, mode, index = -1) {
  const state = syncPrdStateFromBuilder();
  const keys = path.split('.');
  let target = state;
  for (let cursor = 0; cursor < keys.length - 1; cursor += 1) {
    if (!target[keys[cursor]] || typeof target[keys[cursor]] !== 'object') target[keys[cursor]] = {};
    target = target[keys[cursor]];
  }
  const listKey = keys[keys.length - 1];
  const items = Array.isArray(target[listKey]) ? target[listKey] : [];
  if (mode === 'add') {
    if (path === 'productOverview.targetAudiences' || path === 'productOverview.keyValueProps') items.push(createPrdTextEntry());
    else if (path === 'risksMitigations') items.push(createPrdRiskEntry());
    else items.push(createPrdDetailEntry());
  } else if (mode === 'remove' && index >= 0 && index < items.length) {
    items.splice(index, 1);
  }
  target[listKey] = items;
  if (state[keys[0]] && typeof state[keys[0]] === 'object' && !Array.isArray(state[keys[0]])) {
    state[keys[0]].versionDate = createPrdTimestamp();
  }
}

function renderPrdAppliedHistory(state, fragments) {
  const history = Array.isArray(state.appliedFragments) ? state.appliedFragments : [];
  const fragmentMap = new Map((Array.isArray(fragments) ? fragments : []).map((fragment) => [fragment.id, fragment]));
  if (!history.length && !(fragments || []).some((fragment) => fragment.merged || ['merged', 'integrated'].includes(fragment.status))) {
    return '<div class="workspace-doc-empty">No fragments have been merged or integrated yet.</div>';
  }
  const items = history.length
    ? history.map((entry) => {
        const fragment = entry.fragmentId ? fragmentMap.get(entry.fragmentId) : null;
        return {
          title: entry.title || (fragment && fragment.title) || entry.fragmentId || 'Fragment',
          status: entry.status || (fragment && fragment.status) || 'merged',
          sourceFeatureId: entry.sourceFeatureId || (fragment && fragment.featureId) || '',
          versionDate: entry.versionDate || entry.integratedAt || (fragment && fragment.updatedAt) || '',
        };
      })
    : (fragments || [])
        .filter((fragment) => fragment.merged || ['merged', 'integrated'].includes(fragment.status))
        .map((fragment) => ({
          title: fragment.title || fragment.code || fragment.id,
          status: fragment.status || 'merged',
          sourceFeatureId: fragment.featureId || '',
          versionDate: fragment.updatedAt || fragment.mergedAt || '',
        }));
  return items.map((item) => `
    <div class="prd-history-item">
      <strong>${escapeHtml(item.title)}</strong>
      <span>${escapeHtml(item.status || 'merged')}</span>
      <span>${escapeHtml(item.sourceFeatureId || 'No feature link')}</span>
      <span>${escapeHtml(formatPrdDateLabel(item.versionDate))}</span>
    </div>
  `).join('');
}

function buildClientPrdMarkdown(project, state, fragments) {
  const fragmentHistory = renderPrdAppliedHistory(state, fragments).replace(/<[^>]+>/g, '');
  const renderDetailItems = (items, emptyLabel, label) => {
    const lines = (Array.isArray(items) ? items : []).filter((item) => item && (item.title || item.description)).map((item, index) => [
      `#### ${index + 1}. ${item.title || label}`,
      '',
      item.description || '',
      item.versionDate ? '' : '',
      item.versionDate ? `- Version Date: ${new Date(item.versionDate).toISOString().slice(0, 10)}` : '',
      '',
    ].filter(Boolean).join('\n'));
    return lines.length ? lines.join('\n') : emptyLabel;
  };
  const renderTextItems = (items, emptyLabel) => {
    const lines = (Array.isArray(items) ? items : []).filter((item) => item && item.text).map((item) => `- ${item.text}${item.versionDate ? ` (Updated ${new Date(item.versionDate).toISOString().slice(0, 10)})` : ''}`);
    return lines.length ? lines.join('\n') : emptyLabel;
  };
  const renderRiskItems = () => {
    const lines = (Array.isArray(state.risksMitigations) ? state.risksMitigations : []).filter((item) => item && (item.risk || item.mitigation)).map((item, index) => [
      `### 8.${index + 1} ${item.risk || 'Unnamed risk'}`,
      '',
      `- Mitigation: ${item.mitigation || 'Pending mitigation'}`,
      item.versionDate ? `- Version Date: ${new Date(item.versionDate).toISOString().slice(0, 10)}` : '',
      '',
    ].filter(Boolean).join('\n'));
    return lines.length ? lines.join('\n') : 'No risks tracked yet.';
  };
  return [
    `# Product Requirements Document: ${project ? project.name : 'Product'}`,
    '',
    '## 1. Executive Summary',
    '',
    state.executiveSummary.text || 'Pending executive summary.',
    state.executiveSummary.versionDate ? `_Last updated: ${new Date(state.executiveSummary.versionDate).toISOString().slice(0, 10)}_` : '',
    '',
    '## 2. Product Overview',
    '',
    '### 2.1 Product Name',
    '',
    state.productOverview.productName || (project && project.name) || 'Product',
    '',
    '### 2.2 Product Vision',
    '',
    state.productOverview.vision || 'Pending product vision.',
    '',
    '### 2.3 Target Audience',
    '',
    renderTextItems(state.productOverview.targetAudiences, '- No target audiences defined yet'),
    '',
    '### 2.4 Key Value Propositions',
    '',
    renderTextItems(state.productOverview.keyValueProps, '- No value propositions defined yet'),
    '',
    '## 3. Functional Requirements',
    '',
    '### 3.1 Workflows',
    '',
    renderDetailItems(state.functionalRequirements.workflows, 'No workflows defined yet.', 'Workflow'),
    '### 3.2 User Actions',
    '',
    renderDetailItems(state.functionalRequirements.userActions, 'No user actions defined yet.', 'Action'),
    '### 3.3 System Behaviors',
    '',
    renderDetailItems(state.functionalRequirements.systemBehaviors, 'No system behaviors defined yet.', 'Behavior'),
    '## 4. Non-Functional Requirements',
    '',
    '### 4.1 Usability',
    '',
    state.nonFunctionalRequirements.usability || 'Pending usability guidance.',
    '',
    '### 4.2 Reliability',
    '',
    state.nonFunctionalRequirements.reliability || 'Pending reliability requirements.',
    '',
    '### 4.3 Accessibility',
    '',
    state.nonFunctionalRequirements.accessibility || 'Pending accessibility requirements.',
    '',
    '### 4.4 Security',
    '',
    state.nonFunctionalRequirements.security || 'Pending security requirements.',
    '',
    '### 4.5 Performance',
    '',
    state.nonFunctionalRequirements.performance || 'Pending performance requirements.',
    '',
    '## 5. Technical Architecture',
    '',
    renderDetailItems(state.technicalArchitecture, 'No technical architecture decisions captured yet.', 'Architecture'),
    '## 6. Implementation Plan',
    '',
    '### 6.1 Sequencing',
    '',
    renderDetailItems(state.implementationPlan.sequencing, 'No sequencing defined yet.', 'Sequence'),
    '### 6.2 Dependencies',
    '',
    renderDetailItems(state.implementationPlan.dependencies, 'No dependencies defined yet.', 'Dependency'),
    '### 6.3 Milestones',
    '',
    renderDetailItems(state.implementationPlan.milestones, 'No milestones defined yet.', 'Milestone'),
    '## 7. Success Metrics',
    '',
    renderDetailItems(state.successMetrics, 'No success metrics defined yet.', 'Metric'),
    '## 8. Risks and Mitigations',
    '',
    renderRiskItems(),
    '## 9. Future Enhancements',
    '',
    renderDetailItems(state.futureEnhancements, 'No future enhancements captured yet.', 'Enhancement'),
    '## 10. Applied Fragments',
    '',
    fragmentHistory || 'No PRD fragments have been merged or integrated yet.',
    '## 11. Conclusion',
    '',
    state.conclusion || 'Pending conclusion.',
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n').trim();
}

function refreshPrdMarkdownPreview() {
  const state = syncPrdStateFromBuilder();
  const markdown = buildClientPrdMarkdown(taskState.project, state, getPrdFragments());
  if (phase5State.prd) phase5State.prd.markdown = markdown;
  renderMarkdownPreview(el.prdMarkdownPreview, markdown);
}

function renderPrdWorkspace() {
  const state = getPrdEditorState();
  const phasesSummary = getRoadmapPhases().length
    ? getRoadmapPhases().map((phase) => `${phase.code}: ${phase.name}`).join(' | ')
    : 'No roadmap phases yet.';
  if (el.prdMermaid) el.prdMermaid.value = phase5State.prd && phase5State.prd.mermaid ? phase5State.prd.mermaid : '';
  if (el.prdEditorBuilder) {
    el.prdEditorBuilder.innerHTML = `
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Executive Summary ${renderPrdHelp('Summarize the product, user problem, and expected outcome.')}</h4>
          <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.executiveSummary.versionDate))}</span>
        </div>
        <textarea rows="5" data-prd-field="executiveSummary.text" placeholder="Summarize the product and the change you want delivered.">${escapeHtml(state.executiveSummary.text || '')}</textarea>
      </div>
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Product Overview ${renderPrdHelp('Capture the framing an AI agent needs before implementing anything.')}</h4>
          <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.productOverview.versionDate))}</span>
        </div>
        <div class="prd-editor-grid">
          <label class="field">
            <span>Product name</span>
            <input type="text" data-prd-field="productOverview.productName" value="${escapeAttr(state.productOverview.productName || '')}" />
          </label>
          <label class="field prd-editor-grid-full">
            <span>Product vision</span>
            <textarea rows="4" data-prd-field="productOverview.vision" placeholder="Describe the intended product outcome.">${escapeHtml(state.productOverview.vision || '')}</textarea>
          </label>
        </div>
        ${renderPrdTextEntryEditor('Target Audiences', 'productOverview.targetAudiences', state.productOverview.targetAudiences, { icon: 'AUD', help: 'List the user groups or stakeholders this PRD serves.', placeholder: 'Audience or stakeholder' })}
        ${renderPrdTextEntryEditor('Key Value Propositions', 'productOverview.keyValueProps', state.productOverview.keyValueProps, { icon: 'VAL', help: 'List the key value this product should deliver.', placeholder: 'Value proposition' })}
      </div>
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Functional Requirements ${renderPrdHelp('Structure workflows, actions, and system behaviors so the generated PRD stays organized.')}</h4>
          <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.functionalRequirements.versionDate))}</span>
        </div>
        <div class="prd-editor-grid">
          ${renderPrdDetailEntryEditor('Workflows', 'functionalRequirements.workflows', state.functionalRequirements.workflows, { icon: 'WF', help: 'Describe major end-to-end workflows.', titlePlaceholder: 'Workflow title', descriptionPlaceholder: 'Describe the workflow.' })}
          ${renderPrdDetailEntryEditor('User Actions', 'functionalRequirements.userActions', state.functionalRequirements.userActions, { icon: 'ACT', help: 'Describe the main user actions the product must support.', titlePlaceholder: 'User action', descriptionPlaceholder: 'Describe the user action.' })}
          ${renderPrdDetailEntryEditor('System Behaviors', 'functionalRequirements.systemBehaviors', state.functionalRequirements.systemBehaviors, { icon: 'SYS', help: 'Describe expected application or service behavior.', titlePlaceholder: 'System behavior', descriptionPlaceholder: 'Describe the expected system behavior.' })}
        </div>
      </div>
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Non-Functional Requirements ${renderPrdHelp('Define quality expectations for usability, reliability, accessibility, security, and performance.')}</h4>
          <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.nonFunctionalRequirements.versionDate))}</span>
        </div>
        <div class="prd-editor-grid">
          <label class="field"><span><span class="prd-icon">USE</span>Usability ${renderPrdHelp('What should feel easy, clear, and efficient to end users?')}</span><textarea rows="4" data-prd-field="nonFunctionalRequirements.usability">${escapeHtml(state.nonFunctionalRequirements.usability || '')}</textarea></label>
          <label class="field"><span><span class="prd-icon">REL</span>Reliability ${renderPrdHelp('What resilience and correctness expectations should this work meet?')}</span><textarea rows="4" data-prd-field="nonFunctionalRequirements.reliability">${escapeHtml(state.nonFunctionalRequirements.reliability || '')}</textarea></label>
          <label class="field"><span><span class="prd-icon">ACC</span>Accessibility ${renderPrdHelp('Describe accessibility expectations for keyboard and assistive technology.')}</span><textarea rows="4" data-prd-field="nonFunctionalRequirements.accessibility">${escapeHtml(state.nonFunctionalRequirements.accessibility || '')}</textarea></label>
          <label class="field"><span><span class="prd-icon">SEC</span>Security ${renderPrdHelp('Describe security requirements and sensitive-data handling expectations.')}</span><textarea rows="4" data-prd-field="nonFunctionalRequirements.security">${escapeHtml(state.nonFunctionalRequirements.security || '')}</textarea></label>
          <label class="field prd-editor-grid-full"><span><span class="prd-icon">PERF</span>Performance ${renderPrdHelp('Describe responsiveness, latency, or throughput expectations.')}</span><textarea rows="4" data-prd-field="nonFunctionalRequirements.performance">${escapeHtml(state.nonFunctionalRequirements.performance || '')}</textarea></label>
        </div>
      </div>
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Technical Shape ${renderPrdHelp('Capture the high-level design and architecture decisions.')}</h4>
        </div>
        ${renderPrdDetailEntryEditor('Architecture Decisions', 'technicalArchitecture', state.technicalArchitecture, { icon: 'ARCH', help: 'Use one item per major architecture or design decision.', titlePlaceholder: 'Technical decision', descriptionPlaceholder: 'Describe the technical shape and constraints.' })}
      </div>
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Implementation Plan ${renderPrdHelp('Tie the PRD to roadmap sequencing, dependencies, and milestones.')}</h4>
          <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.implementationPlan.versionDate))}</span>
        </div>
        <div class="workspace-doc-inline-note">Roadmap phases: ${escapeHtml(phasesSummary)}</div>
        <div class="prd-editor-grid">
          ${renderPrdDetailEntryEditor('Sequencing', 'implementationPlan.sequencing', state.implementationPlan.sequencing, { icon: 'SEQ', help: 'Describe implementation order or rollout sequencing.', titlePlaceholder: 'Sequence step', descriptionPlaceholder: 'Describe the sequence.' })}
          ${renderPrdDetailEntryEditor('Dependencies', 'implementationPlan.dependencies', state.implementationPlan.dependencies, { icon: 'DEP', help: 'Describe dependencies that block or influence delivery.', titlePlaceholder: 'Dependency', descriptionPlaceholder: 'Describe the dependency.' })}
          ${renderPrdDetailEntryEditor('Milestones', 'implementationPlan.milestones', state.implementationPlan.milestones, { icon: 'MS', help: 'Describe milestones that align with roadmap delivery checkpoints.', titlePlaceholder: 'Milestone', descriptionPlaceholder: 'Describe the milestone outcome.' })}
        </div>
      </div>
      <div class="prd-editor-section">
        ${renderPrdDetailEntryEditor('Success Metrics', 'successMetrics', state.successMetrics, { icon: 'MET', help: 'Define how the work will be measured.', titlePlaceholder: 'Metric', descriptionPlaceholder: 'How will this be measured?' })}
      </div>
      <div class="prd-editor-section">
        ${renderPrdRiskEditor(state.risksMitigations)}
      </div>
      <div class="prd-editor-section">
        ${renderPrdDetailEntryEditor('Future Enhancements', 'futureEnhancements', state.futureEnhancements, { icon: 'FUT', help: 'Track future opportunities that should reflect in roadmap planning.', titlePlaceholder: 'Future enhancement', descriptionPlaceholder: 'Describe the future enhancement.' })}
      </div>
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Applied Fragments ${renderPrdHelp('Merged fragments are stored in the system. Integrated fragments are applied to this PRD and should archive the linked feature.')}</h4>
        </div>
        <div class="prd-history-list">${renderPrdAppliedHistory(state, getPrdFragments())}</div>
      </div>
      <div class="prd-editor-section">
        <div class="prd-editor-section-header">
          <h4>Conclusion ${renderPrdHelp('Capture final guidance, constraints, or closing notes for implementation.')}</h4>
        </div>
        <textarea rows="4" data-prd-field="conclusion" placeholder="Add any final notes or conclusion.">${escapeHtml(state.conclusion || '')}</textarea>
      </div>
    `;
    el.prdEditorBuilder.querySelectorAll('[data-prd-field], [data-prd-list]').forEach((node) => {
      node.addEventListener('input', () => refreshPrdMarkdownPreview());
      node.addEventListener('change', () => refreshPrdMarkdownPreview());
    });
    el.prdEditorBuilder.querySelectorAll('[data-prd-add-list]').forEach((button) => {
      button.addEventListener('click', () => {
        mutatePrdList(button.dataset.prdAddList || '', 'add');
        void logUiEvent('prd', 'add-prd-section-item', { list: button.dataset.prdAddList || '' });
        renderPrdWorkspace();
      });
    });
    el.prdEditorBuilder.querySelectorAll('[data-prd-remove-list]').forEach((button) => {
      button.addEventListener('click', () => {
        mutatePrdList(button.dataset.prdRemoveList || '', 'remove', Number(button.dataset.prdIndex || 0));
        void logUiEvent('prd', 'remove-prd-section-item', { list: button.dataset.prdRemoveList || '', index: Number(button.dataset.prdIndex || 0) });
        renderPrdWorkspace();
      });
    });
  }
  refreshPrdMarkdownPreview();
  if (el.prdFragmentList) {
    const fragments = getPrdFragments();
    el.prdFragmentList.innerHTML = fragments.length
      ? fragments.map((fragment) => {
          const fragmentLabel = fragment.code || fragment.id || 'PRD fragment';
          const fragmentTitle = fragment.title || 'Untitled PRD fragment';
          const linkedFeatureLabel = fragment.featureId
            ? `Linked feature: ${getFeatureDisplayLabel(fragment.featureId)}`
            : 'Project-level PRD fragment';
          return `
            <article class="workspace-doc-item ${phase5State.selectedPrdFragmentId === fragment.id ? 'is-selected' : ''} ${fragment.merged ? 'is-archived' : ''}">
              <div class="workspace-doc-item-top">
                <div>
                  <strong>${escapeHtml(fragmentLabel)}</strong>
                  <span>${escapeHtml(fragment.status || 'draft')}</span>
                </div>
                <div class="workspace-doc-item-actions">
                  <button type="button" class="btn btn-small btn-secondary" data-prd-fragment-preview="${escapeAttr(fragment.id)}">Preview</button>
                  <button type="button" class="btn btn-small btn-secondary" data-prd-fragment-merge="${escapeAttr(fragment.id)}" ${fragment.status === 'integrated' ? 'disabled' : ''}>${fragment.merged ? 'Re-merge' : 'Merge'}</button>
                  <button type="button" class="btn btn-small btn-secondary" data-prd-fragment-integrate="${escapeAttr(fragment.id)}" ${fragment.status === 'integrated' ? 'disabled' : ''}>${fragment.status === 'integrated' ? 'Integrated' : 'Integrate'}</button>
                </div>
              </div>
              <p>${escapeHtml(fragmentTitle)}</p>
              <div class="workspace-doc-item-meta">
                <span>${escapeHtml(linkedFeatureLabel)}</span>
                <span>${escapeHtml(fragment.fileName || fragment.mergedFileName || 'No file yet')}</span>
                <span>${fragment.status === 'integrated' ? 'Applied to PRD' : (fragment.merged ? 'Merged into system' : 'Ready for PRD')}</span>
              </div>
            </article>
          `;
        }).join('')
      : '<div class="workspace-doc-empty">Feature-linked PRD fragments will appear here.</div>';

    el.prdFragmentList.querySelectorAll('[data-prd-fragment-preview]').forEach((button) => {
      button.addEventListener('click', () => {
        phase5State.selectedPrdFragmentId = button.dataset.prdFragmentPreview || null;
        void logUiEvent('prd', 'preview-fragment', { fragmentId: phase5State.selectedPrdFragmentId });
        const selectedFragment = getPrdFragments().find((fragment) => fragment.id === phase5State.selectedPrdFragmentId) || null;
        if (el.prdFragmentPreview) {
          renderMarkdownPreview(el.prdFragmentPreview, selectedFragment ? selectedFragment.markdown : '');
        }
        openFragmentPreviewModal('prd', selectedFragment);
      });
    });
    el.prdFragmentList.querySelectorAll('[data-prd-fragment-merge]').forEach((button) => {
      button.addEventListener('click', async () => {
        const fragmentId = button.dataset.prdFragmentMerge || '';
        if (!fragmentId || !taskState.project) return;
        try {
          syncPrdStateFromBuilder();
          void logUiEvent('prd', 'merge-fragment', { fragmentId });
          const result = await fetchJSON(`${API}/projects/${taskState.project.id}/prd/fragments/${fragmentId}/merge`, { method: 'POST' });
          phase5State.prd = result.prd;
          phase5State.selectedPrdFragmentId = fragmentId;
          renderPrdWorkspace();
          renderFeaturesWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to merge PRD fragment');
        }
      });
    });
    el.prdFragmentList.querySelectorAll('[data-prd-fragment-integrate]').forEach((button) => {
      button.addEventListener('click', async () => {
        const fragmentId = button.dataset.prdFragmentIntegrate || '';
        if (!fragmentId || !taskState.project) return;
        try {
          syncPrdStateFromBuilder();
          void logUiEvent('prd', 'integrate-fragment', { fragmentId });
          const result = await fetchJSON(`${API}/projects/${taskState.project.id}/prd/fragments/${fragmentId}/integrate`, { method: 'POST' });
          phase5State.prd = result.prd;
          phase5State.features = result.features;
          phase5State.selectedPrdFragmentId = fragmentId;
          renderPrdWorkspace();
          renderFeaturesWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to integrate PRD fragment');
        }
      });
    });
  }
  if (el.prdFragmentPreview) {
    const fragments = getPrdFragments();
    const selected = fragments.find((fragment) => fragment.id === phase5State.selectedPrdFragmentId) || fragments[0] || null;
    if (selected && !phase5State.selectedPrdFragmentId) phase5State.selectedPrdFragmentId = selected.id;
    renderMarkdownPreview(el.prdFragmentPreview, selected ? selected.markdown : '');
  }
  renderMermaidPreview(el.prdMermaidPreview, phase5State.prd && phase5State.prd.mermaid);
}

function renderPhaseFiveWorkspace() {
  updateWorkspacePluginTabs(taskState.project);
  populateRoadmapPhaseOptions(el.taskEditorRoadmapPhase);
  renderRoadmapWorkspace();
  renderFeaturesWorkspace();
  renderBugsWorkspace();
  renderPrdWorkspace();
  setTaskWorkspaceView(taskState.view || 'roadmap');
}

function openRoadmapPhaseModal(phase = null) {
  void logUiEvent('roadmap', phase ? 'open-edit-phase' : 'open-add-phase', phase ? { phaseId: phase.id } : {});
  if (el.roadmapPhaseId) el.roadmapPhaseId.value = phase ? phase.id : '';
  if (el.roadmapPhaseName) el.roadmapPhaseName.value = phase ? (phase.name || '') : '';
  if (el.roadmapPhaseGoal) el.roadmapPhaseGoal.value = phase ? (phase.goal || '') : '';
  if (el.roadmapPhaseSummary) el.roadmapPhaseSummary.value = phase ? (phase.summary || '') : '';
  if (el.roadmapPhaseStatus) el.roadmapPhaseStatus.value = phase ? (phase.status || 'planned') : 'planned';
  if (el.roadmapPhaseTargetDate) el.roadmapPhaseTargetDate.value = phase ? (phase.targetDate || '') : '';
  if (el.roadmapPhaseAfter) {
    const options = getRoadmapPhases()
      .filter((item) => !phase || item.id !== phase.id)
      .map((item) => `<option value="${escapeAttr(item.id)}" ${phase && item.id === phase.afterPhaseId ? 'selected' : ''}>${escapeHtml(`${item.code}: ${item.name}`)}</option>`)
      .join('');
    el.roadmapPhaseAfter.innerHTML = `<option value="">None</option>${options}`;
  }
  if (el.roadmapPhaseArchived) el.roadmapPhaseArchived.checked = phase ? !!phase.archived : false;
  if (el.modalRoadmapPhase) el.modalRoadmapPhase.showModal();
}

function openFeatureModal(feature = null) {
  void logUiEvent('features', feature ? 'open-edit-feature' : 'open-add-feature', feature ? { featureId: feature.id } : {});
  const task = feature ? getTaskForWorkItem(feature) : null;
  if (el.featureId) el.featureId.value = feature ? feature.id : '';
  if (el.featureTitle) el.featureTitle.value = feature ? (feature.title || '') : '';
  if (el.featureSummary) el.featureSummary.value = feature ? (feature.summary || '') : '';
  if (el.featureStatus) el.featureStatus.value = feature ? (feature.status || 'planned') : 'planned';
  if (el.featurePriority) el.featurePriority.value = task ? (task.priority || 'medium') : 'medium';
  if (el.featureCategory) el.featureCategory.value = feature ? (feature.category || '') : '';
  if (el.featureProgress) el.featureProgress.value = String(task ? Number(task.progress || 0) : 0);
  if (el.featureAssignedTo) el.featureAssignedTo.value = task ? (task.assignedTo || '') : '';
  if (el.featureDueDate) el.featureDueDate.value = task ? (task.dueDate || '') : '';
  if (el.featureMilestone) el.featureMilestone.checked = task ? task.milestone === true : false;
  if (el.featureStartDate) el.featureStartDate.value = task ? (task.startDate || '') : '';
  if (el.featureEndDate) el.featureEndDate.value = task ? (task.endDate || '') : '';
  populateRoadmapPhaseOptions(el.featureRoadmapPhase, feature ? feature.roadmapPhaseId : '');
  if (el.featurePlanningBucket) el.featurePlanningBucket.value = feature ? (feature.planningBucket || (feature.roadmapPhaseId ? 'phase' : 'considered')) : 'considered';
  populateDependencyOptions(el.featureDependencies, task ? task.id : '', task ? (task.dependencyIds || []) : []);
  if (el.featureArchived) el.featureArchived.checked = feature ? !!feature.archived : false;
  if (el.modalFeature) el.modalFeature.showModal();
}

function openBugModal(bug = null) {
  void logUiEvent('bugs', bug ? 'open-edit-bug' : 'open-add-bug', bug ? { bugId: bug.id } : {});
  const task = bug ? getTaskForWorkItem(bug) : null;
  if (el.bugId) el.bugId.value = bug ? bug.id : '';
  if (el.bugTitle) el.bugTitle.value = bug ? (bug.title || '') : '';
  if (el.bugCurrentBehavior) el.bugCurrentBehavior.value = bug ? (bug.currentBehavior || bug.summary || '') : '';
  if (el.bugExpectedBehavior) el.bugExpectedBehavior.value = bug ? (bug.expectedBehavior || '') : '';
  if (el.bugStatus) el.bugStatus.value = bug ? (bug.status || 'open') : 'open';
  if (el.bugSeverity) el.bugSeverity.value = bug ? (bug.severity || 'medium') : 'medium';
  if (el.bugCategory) el.bugCategory.value = bug ? (bug.category || '') : '';
  if (el.bugPlanningBucket) el.bugPlanningBucket.value = bug ? (bug.planningBucket || 'considered') : 'considered';
  populateRoadmapPhaseOptions(el.bugRoadmapPhase, bug ? bug.roadmapPhaseId : '');
  if (el.bugProgress) el.bugProgress.value = String(task ? Number(task.progress || 0) : 0);
  if (el.bugAssignedTo) el.bugAssignedTo.value = task ? (task.assignedTo || '') : '';
  if (el.bugDueDate) el.bugDueDate.value = task ? (task.dueDate || '') : '';
  if (el.bugMilestone) el.bugMilestone.checked = task ? task.milestone === true : false;
  if (el.bugStartDate) el.bugStartDate.value = task ? (task.startDate || '') : '';
  if (el.bugEndDate) el.bugEndDate.value = task ? (task.endDate || '') : '';
  populateDependencyOptions(el.bugDependencies, task ? task.id : '', task ? (task.dependencyIds || []) : []);
  if (el.bugCompleted) el.bugCompleted.checked = bug ? !!bug.completed : false;
  if (el.bugRegressed) el.bugRegressed.checked = bug ? !!bug.regressed : false;
  if (el.bugArchived) el.bugArchived.checked = bug ? !!bug.archived : false;
  if (el.modalBug) el.modalBug.showModal();
}

async function saveRoadmapPhaseFromModal() {
  if (!taskState.project) return;
  const phaseId = el.roadmapPhaseId ? el.roadmapPhaseId.value : '';
  const payload = {
    name: el.roadmapPhaseName ? el.roadmapPhaseName.value.trim() : '',
    goal: el.roadmapPhaseGoal ? el.roadmapPhaseGoal.value.trim() : '',
    summary: el.roadmapPhaseSummary ? el.roadmapPhaseSummary.value.trim() : '',
    status: el.roadmapPhaseStatus ? el.roadmapPhaseStatus.value : 'planned',
    targetDate: el.roadmapPhaseTargetDate ? (el.roadmapPhaseTargetDate.value || null) : null,
    afterPhaseId: el.roadmapPhaseAfter ? (el.roadmapPhaseAfter.value || null) : null,
    archived: !!(el.roadmapPhaseArchived && el.roadmapPhaseArchived.checked),
  };
  if (!payload.name) {
    alert('Phase name is required.');
    return;
  }
  const route = phaseId
    ? `${API}/projects/${taskState.project.id}/roadmap/phases/${phaseId}`
    : `${API}/projects/${taskState.project.id}/roadmap/phases`;
  await fetchJSON(route, {
    method: phaseId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
  void logUiEvent('roadmap', phaseId ? 'save-phase' : 'create-phase', { phaseId: phaseId || null, name: payload.name });
  if (el.modalRoadmapPhase) el.modalRoadmapPhase.close();
  await refreshTaskWorkspace();
}

async function saveFeatureFromModal() {
  if (!taskState.project) return;
  const featureId = el.featureId ? el.featureId.value : '';
  const payload = {
    title: el.featureTitle ? el.featureTitle.value.trim() : '',
    summary: el.featureSummary ? el.featureSummary.value.trim() : '',
    status: el.featureStatus ? el.featureStatus.value : 'planned',
    priority: el.featurePriority ? el.featurePriority.value : 'medium',
    category: el.featureCategory ? (el.featureCategory.value.trim() || null) : null,
    progress: el.featureProgress ? Number(el.featureProgress.value || 0) : 0,
    assignedTo: el.featureAssignedTo ? (el.featureAssignedTo.value.trim() || null) : null,
    dueDate: el.featureDueDate ? (el.featureDueDate.value || null) : null,
    milestone: el.featureMilestone ? el.featureMilestone.checked : false,
    startDate: el.featureStartDate ? (el.featureStartDate.value || null) : null,
    endDate: el.featureEndDate ? (el.featureEndDate.value || null) : null,
    roadmapPhaseId: el.featureRoadmapPhase ? (el.featureRoadmapPhase.value || null) : null,
    planningBucket: el.featurePlanningBucket ? el.featurePlanningBucket.value : 'considered',
    dependencyIds: el.featureDependencies
      ? [...el.featureDependencies.selectedOptions].map((option) => option.value)
      : [],
    archived: !!(el.featureArchived && el.featureArchived.checked),
  };
  if (payload.planningBucket !== 'phase') payload.roadmapPhaseId = null;
  if (!payload.title) {
    alert('Feature title is required.');
    return;
  }
  const route = featureId
    ? `${API}/projects/${taskState.project.id}/features/${featureId}`
    : `${API}/projects/${taskState.project.id}/features`;
  await fetchJSON(route, {
    method: featureId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
  void logUiEvent('features', featureId ? 'save-feature' : 'create-feature', { featureId: featureId || null, title: payload.title });
  if (el.modalFeature) el.modalFeature.close();
  await refreshTaskWorkspace();
}

async function saveBugFromModal() {
  if (!taskState.project) return;
  const bugId = el.bugId ? el.bugId.value : '';
  const payload = {
    title: el.bugTitle ? el.bugTitle.value.trim() : '',
    currentBehavior: el.bugCurrentBehavior ? el.bugCurrentBehavior.value.trim() : '',
    expectedBehavior: el.bugExpectedBehavior ? el.bugExpectedBehavior.value.trim() : '',
    status: el.bugStatus ? el.bugStatus.value : 'open',
    severity: el.bugSeverity ? el.bugSeverity.value : 'medium',
    category: el.bugCategory ? (el.bugCategory.value.trim() || null) : null,
    planningBucket: el.bugPlanningBucket ? el.bugPlanningBucket.value : 'considered',
    roadmapPhaseId: el.bugRoadmapPhase ? (el.bugRoadmapPhase.value || null) : null,
    progress: el.bugProgress ? Number(el.bugProgress.value || 0) : 0,
    assignedTo: el.bugAssignedTo ? (el.bugAssignedTo.value.trim() || null) : null,
    dueDate: el.bugDueDate ? (el.bugDueDate.value || null) : null,
    milestone: el.bugMilestone ? el.bugMilestone.checked : false,
    startDate: el.bugStartDate ? (el.bugStartDate.value || null) : null,
    endDate: el.bugEndDate ? (el.bugEndDate.value || null) : null,
    dependencyIds: el.bugDependencies
      ? [...el.bugDependencies.selectedOptions].map((option) => option.value)
      : [],
    completed: !!(el.bugCompleted && el.bugCompleted.checked),
    regressed: !!(el.bugRegressed && el.bugRegressed.checked),
    archived: !!(el.bugArchived && el.bugArchived.checked),
  };
  payload.summary = payload.currentBehavior;
  if (payload.planningBucket !== 'phase') payload.roadmapPhaseId = null;
  if (!payload.title) {
    alert('Bug title is required.');
    return;
  }
  const route = bugId
    ? `${API}/projects/${taskState.project.id}/bugs/${bugId}`
    : `${API}/projects/${taskState.project.id}/bugs`;
  await fetchJSON(route, {
    method: bugId ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  });
  void logUiEvent('bugs', bugId ? 'save-bug' : 'create-bug', { bugId: bugId || null, title: payload.title });
  if (el.modalBug) el.modalBug.close();
  await refreshTaskWorkspace();
}

async function savePrdDocument() {
  if (!taskState.project) return;
  const state = syncPrdStateFromBuilder();
  const markdown = buildClientPrdMarkdown(taskState.project, state, getPrdFragments());
  void logUiEvent('prd', 'save-prd', {
    markdownLength: markdown.length,
    mermaidLength: el.prdMermaid ? el.prdMermaid.value.length : 0,
  });
  const result = await fetchJSON(`${API}/projects/${taskState.project.id}/prd`, {
    method: 'PUT',
    body: JSON.stringify({
      markdown,
      mermaid: el.prdMermaid ? el.prdMermaid.value : '',
      editorState: state,
    }),
  });
  phase5State.prd = result;
  renderPrdWorkspace();
}

function getViewState() {
  return {
    search: (el.toolbarSearch && el.toolbarSearch.value) ? el.toolbarSearch.value.trim() : '',
    sortBy: (el.toolbarSort && el.toolbarSort.value) || 'alphabetical',
    viewMode: (el.toolbarView && el.toolbarView.value) || 'list',
    groupBy: (el.toolbarGroup && el.toolbarGroup.value) || 'none',
  };
}

function wildcardToRegex(q) {
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(escaped, 'i');
}

function projectMatchesSearch(project, regex) {
  if (regex.test(project.name || '')) return true;
  if (regex.test(project.description || '')) return true;
  const tags = project.tags || [];
  if (tags.some(t => regex.test(String(t).trim()))) return true;
  return false;
}

function filterProjects(projectList, searchQuery) {
  if (!searchQuery) return projectList;
  const regex = wildcardToRegex(searchQuery);
  return projectList.filter(p => projectMatchesSearch(p, regex));
}

function sortProjects(projectList, sortBy) {
  const sortFn = (a, b) => {
    if (sortBy === 'alphabetical') {
      return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    }
    if (sortBy === 'dateAdded') {
      const ta = a.dateAdded ? new Date(a.dateAdded).getTime() : 0;
      const tb = b.dateAdded ? new Date(b.dateAdded).getTime() : 0;
      return tb - ta;
    }
    if (sortBy === 'category') {
      return (a.category || '').localeCompare(b.category || '', undefined, { sensitivity: 'base' });
    }
    return 0;
  };
  const pinned = projectList.filter(p => p.pinned === true).sort(sortFn);
  const unpinned = projectList.filter(p => !p.pinned).sort(sortFn);
  return [...pinned, ...unpinned];
}

function groupProjects(projectList, groupBy) {
  if (!groupBy || groupBy === 'none') return { '': projectList };
  const groups = {};
  for (const p of projectList) {
    let key;
    if (groupBy === 'name') {
      const n = (p.name || '').trim();
      key = n.charAt(0).toUpperCase() || '—';
    } else if (groupBy === 'dateAdded') {
      if (p.dateAdded) {
        const d = new Date(p.dateAdded);
        key = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } else key = 'No date';
    } else if (groupBy === 'category') {
      key = (p.category && p.category.trim()) ? p.category.trim() : 'Uncategorized';
    } else key = '—';
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }
  return groups;
}

async function loadCredentials() {
  credentials = await fetchJSON(`${API}/credentials`);
}

function getSelectedProject() {
  return selectedProjectId ? projects.find((project) => project.id === selectedProjectId) || null : null;
}

function setAppView(viewName) {
  document.body.classList.toggle('project-screen-active', viewName === 'project');
  if (el.projectsList) el.projectsList.hidden = viewName === 'project';
  if (el.projectScreen) el.projectScreen.hidden = viewName !== 'project';
}

function scrollProjectViewToTop() {
  if (el.projectView) el.projectView.scrollTop = 0;
  if (typeof window !== 'undefined') window.scrollTo(0, 0);
}

function setTaskWorkspaceView(viewName = 'roadmap') {
  const definition = getWorkspaceViewDefinition(viewName || 'roadmap');
  taskState.view = definition && definition.id ? definition.id : 'roadmap';
  const renderedView = definition && (definition.surface === 'module-designer' || definition.implemented === false)
    ? 'module-designer'
    : taskState.view;
  void logUiEvent(taskState.view, 'nav-selected', { view: taskState.view });
  document.querySelectorAll('[data-task-view-nav]').forEach((item) => {
    item.classList.toggle('is-active', item.getAttribute('data-task-view-nav') === taskState.view);
  });
  document.querySelectorAll('[data-task-view]').forEach((item) => {
    item.classList.toggle('is-active', item.getAttribute('data-task-view') === renderedView);
  });
}

function renderProjects() {
  if (!el.projectsList) return;
  const projs = Array.isArray(projects) ? projects : [];
  const view = getViewState();
  const roots = projs.filter(p => p && !p.parentId);
  const filtered = filterProjects(roots, view.search);
  const sorted = sortProjects(filtered, view.sortBy);
  const byParent = projs.reduce((acc, p) => {
    if (!p || !p.parentId) return acc;
    (acc[p.parentId] = acc[p.parentId] || []).push(p);
    return acc;
  }, {});

  if (roots.length === 0) {
    el.projectsList.innerHTML = `
      <div class="empty-state">
        <p>No projects yet.</p>
        <p>Click <strong>+ Add project</strong> and choose a folder to get started.</p>
      </div>`;
    return;
  }

  if (filtered.length === 0) {
    el.projectsList.innerHTML = `<div class="empty-state"><p>No projects match your search.</p></div>`;
    return;
  }

  const pinned = sorted.filter(p => p.pinned === true);
  const unpinned = sorted.filter(p => !p.pinned);
  const parts = [];

  if (view.groupBy === 'none') {
    const combined = [...pinned, ...unpinned];
    if (view.viewMode === 'grid') {
      parts.push(`<div class="projects-grid">${combined.map(p => renderGridCard(p)).join('')}</div>`);
    } else {
      parts.push(combined.map(p => renderProjectCard(p, byParent[p.id])).join(''));
    }
  } else {
    const groupedPinned = groupProjects(pinned, view.groupBy);
    const groupedUnpinned = groupProjects(unpinned, view.groupBy);
    const renderSection = (grouped, sectionLabel) => {
      const keys = Object.keys(grouped).sort();
      for (const key of keys) {
        const items = grouped[key];
        if (items.length === 0) continue;
        const header = sectionLabel ? (key ? `${sectionLabel} — ${key}` : sectionLabel) : key;
        parts.push(`<div class="project-group-header">${escapeHtml(header)}</div><div class="project-group-line"></div>`);
        if (view.viewMode === 'grid') {
          parts.push(`<div class="projects-grid">${items.map(p => renderGridCard(p)).join('')}</div>`);
        } else {
          parts.push(items.map(p => renderProjectCard(p, byParent[p.id])).join(''));
        }
      }
    };
    if (pinned.length > 0) renderSection(groupedPinned, 'Pinned');
    if (unpinned.length > 0) renderSection(groupedUnpinned, 'Unpinned');
  }

  el.projectsList.innerHTML = parts.join('');

  el.projectsList.querySelectorAll('.project-name-link').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      openProjectScreen(a.dataset.id);
    });
  });
  el.projectsList.querySelectorAll('.project-open-primary-btn').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      const proj = projects.find((project) => project.id === event.currentTarget.dataset.id);
      if (!proj) return;
      try {
        await openProjectPrimaryAction(proj);
      } catch (err) {
        console.error(err);
      }
    });
  });
  el.projectsList.querySelectorAll('.btn-gear').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const proj = projects.find(p => p.id === e.target.dataset.id);
      if (proj) openProjectSettingsModal(proj);
    });
  });
  el.projectsList.querySelectorAll('.project-description').forEach(desc => {
    desc.addEventListener('blur', (e) => saveDescription(e.target));
  });
  el.projectsList.querySelectorAll('.btn-remove-project').forEach(btn => {
    btn.addEventListener('click', (e) => removeProject(e.target.dataset.id));
  });
  el.projectsList.querySelectorAll('.btn-add-subproject').forEach(btn => {
    btn.addEventListener('click', (e) => openAddProject(e.target.dataset.parentId));
  });
  el.projectsList.querySelectorAll('.btn-sftp-upload').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const b = e.currentTarget;
      const proj = projects.find(p => p.id === b.dataset.id);
      if (proj) openSFTPModal(proj);
    });
  });
  el.projectsList.querySelectorAll('.git-toggle').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.git-section').classList.toggle('collapsed'));
  });
  el.projectsList.querySelectorAll('.project-link-icon').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await openProjectLink(e.currentTarget);
      } catch (err) {
        console.error(err);
      }
    });
  });

  el.projectsList.addEventListener('contextmenu', (e) => {
    const card = e.target.closest('.project-card, .grid-card');
    if (!card) return;
    e.preventDefault();
    const id = card.dataset.id;
    const project = projects.find(p => p.id === id);
    if (!project) return;
    contextMenuProjectId = id;
    const isUrl = project.type === 'url';
    const hasPath = project.type === 'folder' && project.path;
    const hasSftp = hasPath && project.serverId;
    if (el.projectContextPin) el.projectContextPin.hidden = project.pinned === true;
    if (el.projectContextUnpin) el.projectContextUnpin.hidden = !project.pinned;
    if (el.projectContextOpenCursor) el.projectContextOpenCursor.hidden = isUrl || !hasPath;
    if (el.projectContextOpenExplorer) el.projectContextOpenExplorer.hidden = isUrl || !hasPath;
    if (el.projectContextSftp) el.projectContextSftp.hidden = !hasSftp;
    if (el.projectContextAddSubproject) el.projectContextAddSubproject.hidden = isUrl;
    if (el.projectContextMenu) {
      el.projectContextMenu.style.left = e.clientX + 'px';
      el.projectContextMenu.style.top = e.clientY + 'px';
      el.projectContextMenu.hidden = false;
    }
  });
}

function bindProjectScreenCardEvents(project) {
  if (!el.projectScreenCard || !project) return;
  el.projectScreenCard.querySelectorAll('.project-open-primary-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      await openProjectPrimaryAction(project);
    });
  });
  el.projectScreenCard.querySelectorAll('.project-link-icon').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      await openProjectLink(event.currentTarget);
    });
  });
  el.projectScreenCard.querySelectorAll('.btn-gear').forEach((button) => {
    button.addEventListener('click', () => openProjectSettingsModal(project));
  });
  el.projectScreenCard.querySelectorAll('.btn-sftp-upload').forEach((button) => {
    button.addEventListener('click', () => openSFTPModal(project));
  });
}

function renderProjectScreen() {
  const project = getSelectedProject();
  if (!project) {
    setAppView('list');
    return;
  }
  taskState.project = project;
  setAppView('project');
  if (el.projectScreenCard) {
    el.projectScreenCard.innerHTML = renderProjectScreenCard(project);
    bindProjectScreenCardEvents(project);
  }
  setTaskWorkspaceView(taskState.view || 'roadmap');
  renderTaskWorkspace();
}

function renderAppView() {
  if (getSelectedProject()) renderProjectScreen();
  else {
    setAppView('list');
    renderProjects();
  }
}

function openProjectScreen(projectId) {
  selectedProjectId = projectId;
  const project = getSelectedProject();
  if (!project) return;
  void logUiEvent('projects', 'open-project-screen', { projectId });
  taskState.project = project;
  integrationState.projectId = project.id;
  setTaskWorkspaceView('roadmap');
  renderProjectScreen();
  scrollProjectViewToTop();
  if (el.btnProjectScreenBack) el.btnProjectScreenBack.focus({ preventScroll: true });
  refreshTaskWorkspace().catch((error) => {
    console.error(error);
  });
}

function closeProjectContextMenu() {
  contextMenuProjectId = null;
  if (el.projectContextMenu) el.projectContextMenu.hidden = true;
}

async function loadLocalListing(path) {
  const base = (sftpState.project && sftpState.project.path) ? sftpState.project.path : '.';
  const reqPath = path != null && path !== '' ? path : base;
  const res = await fetch(`${API}/sftp/local-list?path=${encodeURIComponent(reqPath)}`);
  if (!res.ok) throw new Error((await res.json()).error || 'List failed');
  const data = await res.json();
  sftpState.localCurrentPath = data.path;
  sftpState.localListing = data;
  return data;
}

async function loadRemoteListing(path) {
  path = path == null || path === '' ? '/' : path.replace(/\\/g, '/');
  if (!path.startsWith('/')) path = '/' + path;
  const res = await fetch(`${API}/sftp/list?credId=${encodeURIComponent(sftpState.credId)}&path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error((await res.json()).error || 'List failed');
  const data = await res.json();
  sftpState.remoteCurrentPath = data.path;
  sftpState.remoteListing = data;
  return data;
}

function renderPathbar(elBar, currentPath, isLocal) {
  if (!elBar) return;
  const base = (sftpState.project && sftpState.project.path) ? sftpState.project.path : '.';
  const parts = currentPath == null || currentPath === '' ? [] : String(currentPath).replace(/\\/g, '/').split('/').filter(Boolean);
  const segs = isLocal ? (parts.length ? parts : [base || 'Project']) : (currentPath === '/' ? ['/'] : ['/', ...parts]);
  elBar.innerHTML = segs.map((seg, i) => {
    const pathUp = isLocal ? (parts.length ? parts.slice(0, i + 1).join('/') : base) : (i === 0 ? '/' : '/' + parts.slice(0, i).join('/'));
    const label = seg === '/' ? 'Root' : seg;
    return `<span class="sftp-path-seg" data-path="${escapeAttr(pathUp)}">${escapeHtml(label)}</span>${i < segs.length - 1 ? '<span class="sftp-path-sep">/</span>' : ''}`;
  }).join('');
  elBar.querySelectorAll('.sftp-path-seg').forEach(seg => {
    seg.addEventListener('click', async () => {
      const p = seg.dataset.path;
      if (isLocal) {
        try {
          await loadLocalListing(p);
          renderLocalList();
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          await loadRemoteListing(p);
          renderRemoteList();
        } catch (err) {
          console.error(err);
        }
      }
    });
  });
}

function renderLocalList() {
  if (!el.sftpListLocalBody) return;
  renderPathbar(el.sftpLocalPathbar, sftpState.localCurrentPath, true);
  const list = sftpState.localListing;
  if (!list) {
    el.sftpListLocalBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Loading…</td></tr>';
    return;
  }
  const base = (sftpState.project && sftpState.project.path) || '.';
  const isRoot = !list.path || list.path === base || list.path === '.';
  const parentPath = isRoot ? null : list.path.replace(/\/[^/]+$/, '') || null;
  const rows = [];
  if (!isRoot && parentPath !== null) {
    rows.push(`<tr class="sftp-row sftp-row-parent" data-path="${escapeAttr(parentPath)}" data-type="dir"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-dir" title="Parent folder">↩</span></td><td class="sftp-col-name">..</td></tr>`);
  }
  (list.dirs || []).forEach(d => {
    rows.push(`<tr class="sftp-row sftp-row-dir" data-path="${escapeAttr(d.path)}" data-type="dir"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-dir" title="Directory">📁</span></td><td class="sftp-col-name">${escapeHtml(d.name)}</td></tr>`);
  });
  (list.files || []).forEach(f => {
    rows.push(`<tr class="sftp-row sftp-row-file" data-path="${escapeAttr(f.path)}" data-type="file"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-file" title="File">📄</span></td><td class="sftp-col-name">${escapeHtml(f.name)}</td></tr>`);
  });
  el.sftpListLocalBody.innerHTML = rows.join('');
  el.sftpListLocalBody.querySelectorAll('.sftp-row').forEach(row => {
    row.addEventListener('click', () => {
      el.sftpListLocalBody.querySelectorAll('.sftp-row.selected').forEach(s => s.classList.remove('selected'));
      row.classList.add('selected');
      sftpState.localSelected = { path: row.dataset.path, type: row.dataset.type };
      if (el.sftpLocalActions) el.sftpLocalActions.hidden = false;
      if (row.dataset.type === 'file' && el.sftpDestOptions) {
        el.sftpDestOptions.hidden = false;
        const destLabel = el.sftpDestOptions.querySelector('.sftp-dest-label');
        if (destLabel) destLabel.textContent = `Copy to current server directory: ${sftpState.remoteCurrentPath || '/'}`;
      }
    });
    row.addEventListener('dblclick', async () => {
      if (row.classList.contains('sftp-row-parent')) {
        try {
          await loadLocalListing(row.dataset.path);
          renderLocalList();
        } catch (err) {
          console.error(err);
        }
        return;
      }
      if (row.dataset.type !== 'dir') return;
      try {
        await loadLocalListing(row.dataset.path);
        renderLocalList();
      } catch (err) {
        console.error(err);
      }
    });
  });
}

function renderRemoteList() {
  if (!el.sftpListRemoteBody) return;
  renderPathbar(el.sftpRemotePathbar, sftpState.remoteCurrentPath, false);
  const list = sftpState.remoteListing;
  if (!list) {
    el.sftpListRemoteBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Loading…</td></tr>';
    return;
  }
  const isRoot = list.path === '/';
  const parentPath = isRoot ? null : (list.path.replace(/\/[^/]+$/, '') || '/');
  const rows = [];
  if (!isRoot && parentPath !== null) {
    rows.push(`<tr class="sftp-row sftp-row-parent" data-path="${escapeAttr(parentPath)}" data-type="dir"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-dir" title="Parent folder">↩</span></td><td class="sftp-col-name">..</td></tr>`);
  }
  const entries = (list.entries || []).slice().sort((a, b) => {
    const aDir = (a.type || 'file') === 'dir' ? 0 : 1;
    const bDir = (b.type || 'file') === 'dir' ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return (a.name || '').localeCompare(b.name || '');
  });
  entries.forEach(e => {
    const type = e.type || 'file';
    const icon = type === 'dir' ? '📁' : '📄';
    const cls = type === 'dir' ? 'sftp-row-dir' : 'sftp-row-file';
    rows.push(`<tr class="sftp-row ${cls}" data-path="${escapeAttr(e.path)}" data-type="${escapeAttr(type)}"><td class="sftp-col-type"><span class="sftp-icon sftp-icon-${type}" title="${type === 'dir' ? 'Directory' : 'File'}">${icon}</span></td><td class="sftp-col-name">${escapeHtml(e.name)}</td></tr>`);
  });
  el.sftpListRemoteBody.innerHTML = rows.join('');
  el.sftpListRemoteBody.querySelectorAll('.sftp-row').forEach(row => {
    row.addEventListener('click', () => {
      el.sftpListRemoteBody.querySelectorAll('.sftp-row.selected').forEach(s => s.classList.remove('selected'));
      row.classList.add('selected');
      sftpState.remoteSelected = { path: row.dataset.path, type: row.dataset.type };
      if (el.sftpRemoteActions) el.sftpRemoteActions.hidden = row.classList.contains('sftp-row-parent');
      if (el.sftpDestOptions) {
        el.sftpDestOptions.hidden = false;
        const destLabel = el.sftpDestOptions.querySelector('.sftp-dest-label');
        if (destLabel) destLabel.textContent = '↓ Save here';
      }
    });
    row.addEventListener('contextmenu', (e) => {
      if (row.classList.contains('sftp-row-parent')) return;
      e.preventDefault();
      e.stopPropagation();
      sftpState.downloadRemotePath = row.dataset.path;
      sftpState.downloadRemoteType = row.dataset.type || 'file';
      if (el.sftpRemoteContextMenu) {
        el.sftpRemoteContextMenu.style.left = e.clientX + 'px';
        el.sftpRemoteContextMenu.style.top = e.clientY + 'px';
        el.sftpRemoteContextMenu.hidden = false;
      }
    });
    row.addEventListener('dblclick', async () => {
      if (row.classList.contains('sftp-row-parent')) {
        try {
          await loadRemoteListing(row.dataset.path);
          renderRemoteList();
        } catch (err) {
          console.error(err);
        }
        return;
      }
      if (row.dataset.type !== 'dir') return;
      try {
        await loadRemoteListing(row.dataset.path);
        renderRemoteList();
      } catch (err) {
        console.error(err);
      }
    });
  });
  if (sftpState.localSelected && sftpState.localSelected.type === 'file' && el.sftpDestOptions && !el.sftpDestOptions.hidden) {
    const destLabel = el.sftpDestOptions.querySelector('.sftp-dest-label');
    if (destLabel) destLabel.textContent = `Copy to current server directory: ${sftpState.remoteCurrentPath || '/'}`;
  }
}

function closeSftpRemoteContextMenu() {
  if (el.sftpRemoteContextMenu) el.sftpRemoteContextMenu.hidden = true;
}

function openSftpDownloadModal() {
  const remotePath = sftpState.downloadRemotePath;
  const baseDir = (sftpState.project && sftpState.project.path) ? sftpState.project.path : '.';
  closeSftpRemoteContextMenu();
  if (!remotePath || !el.modalSftpDownload) return;
  if (el.sftpDownloadLocalPath) el.sftpDownloadLocalPath.value = baseDir;
  if (el.sftpDownloadRemotePath) el.sftpDownloadRemotePath.textContent = remotePath;
  if (el.sftpDownloadBrowsePanel) el.sftpDownloadBrowsePanel.hidden = true;
  el.modalSftpDownload.showModal();
}

async function runSftpDownloadOne(remotePath, localPath) {
  const res = await fetch(`${API}/sftp/download`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      credId: sftpState.credId,
      remotePath,
      localPath,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Download failed');
  return data;
}

function renderSftpGroupSelect() {
  if (!el.sftpGroupSelect) return;
  const groups = sftpState.mappingGroups || [];
  el.sftpGroupSelect.innerHTML = groups.map(g => `<option value="${escapeAttr(g.id)}" ${g.id === sftpState.selectedGroupId ? 'selected' : ''}>${escapeHtml(g.name)}</option>`).join('');
}

function renderSftpMappings() {
  if (!el.sftpMappingsList) return;
  const uploadRows = (sftpState.mappings || []).map((m, i) => {
    const ov = m.overwrite ? '<span class="sftp-mapping-ico sftp-mapping-ico-on" title="Overwrite if present">O</span>' : '<span class="sftp-mapping-ico" title="Overwrite if present">O</span>';
    const ask = m.askBeforeOverwrite ? '<span class="sftp-mapping-ico sftp-mapping-ico-on" title="Ask before overwriting">A</span>' : '<span class="sftp-mapping-ico" title="Ask before overwriting">A</span>';
    const selected = sftpState.editingMappingIndex === i ? ' sftp-mapping-item-selected' : '';
    return `<div class="sftp-mapping-item sftp-mapping-upload${selected}" data-index="${i}" data-type="upload"><span class="sftp-mapping-clickable"><span class="sftp-mapping-badge sftp-mapping-badge-upload">↑</span> <span class="sftp-mapping-local">${escapeHtml(m.localPath)}</span> → <span class="sftp-mapping-remote">${escapeHtml(m.remotePath)}</span> <span class="sftp-mapping-icos">${ov}${ask}</span></span><button type="button" class="btn btn-ghost btn-small sftp-mapping-remove" data-index="${i}" data-type="upload" aria-label="Remove">×</button></div>`;
  });
  const downloadRows = (sftpState.downloadMappings || []).map((m, i) => {
    const selected = sftpState.editingDownloadMappingIndex === i ? ' sftp-mapping-item-selected' : '';
    return `<div class="sftp-mapping-item sftp-mapping-download${selected}" data-index="${i}" data-type="download"><span class="sftp-mapping-clickable"><span class="sftp-mapping-badge sftp-mapping-badge-download">↓</span> <span class="sftp-mapping-remote">${escapeHtml(m.remotePath)}</span> → <span class="sftp-mapping-local">${escapeHtml(m.localPath)}</span></span><button type="button" class="btn btn-ghost btn-small sftp-mapping-remove" data-index="${i}" data-type="download" aria-label="Remove">×</button></div>`;
  });
  el.sftpMappingsList.innerHTML = uploadRows.join('') + downloadRows.join('');
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-item[data-type="upload"] .sftp-mapping-clickable').forEach((clickable, i) => {
    clickable.addEventListener('click', () => selectMappingForEdit(parseInt(clickable.closest('.sftp-mapping-item').dataset.index, 10)));
  });
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-item[data-type="download"] .sftp-mapping-clickable').forEach((clickable) => {
    const item = clickable.closest('.sftp-mapping-item');
    const idx = parseInt(item.dataset.index, 10);
    clickable.addEventListener('click', () => {
      sftpState.editingMappingIndex = null;
      sftpState.editingDownloadMappingIndex = idx;
      if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
      renderSftpMappings();
    });
  });
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-remove[data-type="upload"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      sftpState.mappings.splice(idx, 1);
      if (sftpState.editingMappingIndex !== null && sftpState.editingMappingIndex >= sftpState.mappings.length) sftpState.editingMappingIndex = null;
      if (sftpState.editingMappingIndex !== null && sftpState.editingMappingIndex > idx) sftpState.editingMappingIndex--;
      renderSftpMappings();
      if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = sftpState.editingMappingIndex == null;
    });
  });
  el.sftpMappingsList.querySelectorAll('.sftp-mapping-remove[data-type="download"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      sftpState.downloadMappings.splice(idx, 1);
      if (sftpState.editingDownloadMappingIndex !== null && sftpState.editingDownloadMappingIndex >= sftpState.downloadMappings.length) sftpState.editingDownloadMappingIndex = null;
      if (sftpState.editingDownloadMappingIndex !== null && sftpState.editingDownloadMappingIndex > idx) sftpState.editingDownloadMappingIndex--;
      renderSftpMappings();
    });
  });
}

async function selectMappingForEdit(index) {
  const m = sftpState.mappings[index];
  if (!m) return;
  sftpState.editingMappingIndex = index;
  const base = (sftpState.project && sftpState.project.path) || '.';
  const localParent = m.localPath.replace(/\/[^/]+$/, '') || base;
  const remoteParent = m.remotePath === '/' || !m.remotePath ? '/' : m.remotePath.replace(/\/[^/]+$/, '') || '/';
  try {
    await loadLocalListing(localParent);
    renderLocalList();
  } catch (err) {
    console.error(err);
  }
  try {
    await loadRemoteListing(remoteParent);
    renderRemoteList();
  } catch (err) {
    console.error(err);
  }
  if (el.sftpListLocalBody) {
    el.sftpListLocalBody.querySelectorAll('tr.sftp-row.selected').forEach(r => r.classList.remove('selected'));
    for (const row of el.sftpListLocalBody.querySelectorAll('tr.sftp-row')) {
      if (row.dataset.path === m.localPath) {
        row.classList.add('selected');
        sftpState.localSelected = { path: m.localPath, type: row.dataset.type || 'file' };
        break;
      }
    }
  }
  if (el.sftpListRemoteBody) {
    el.sftpListRemoteBody.querySelectorAll('tr.sftp-row.selected').forEach(r => r.classList.remove('selected'));
    const normRemote = m.remotePath.startsWith('/') ? m.remotePath : '/' + m.remotePath;
    for (const row of el.sftpListRemoteBody.querySelectorAll('tr.sftp-row')) {
      if (row.dataset.path === normRemote) {
        row.classList.add('selected');
        sftpState.remoteSelected = { path: row.dataset.path, type: row.dataset.type || 'dir' };
        break;
      }
    }
  }
  if (el.sftpOverwrite) el.sftpOverwrite.checked = !!m.overwrite;
  if (el.sftpAskOverwrite) { el.sftpAskOverwrite.disabled = !m.overwrite; el.sftpAskOverwrite.checked = !!m.askBeforeOverwrite; }
  if (el.sftpLocalActions) el.sftpLocalActions.hidden = false;
  if (el.sftpDestOptions) el.sftpDestOptions.hidden = false;
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = false;
  renderSftpMappings();
}

function addSftpMapping() {
  if (!sftpState.localSelected) return;
  const localName = sftpState.localSelected.path.split('/').pop();
  let dest;
  if (sftpState.localSelected.type === 'file') {
    const base = (sftpState.remoteCurrentPath || '/').replace(/\\/g, '/').replace(/\/$/, '') || '';
    dest = base ? base + '/' + localName : '/' + localName;
    if (!dest.startsWith('/')) dest = '/' + dest;
  } else {
    if (!sftpState.remoteSelected) return;
    const remotePath = sftpState.remoteSelected.type === 'dir' ? sftpState.remoteSelected.path : sftpState.remoteSelected.path.replace(/\/[^/]+$/, '') || '/';
    const normRemote = remotePath.replace(/\/$/, '') || '/';
    const remoteEndsWithLocal = normRemote === '/' + localName || normRemote.endsWith('/' + localName);
    dest = remotePath === '/' ? localName : (remoteEndsWithLocal ? normRemote : (normRemote === '/' ? localName : normRemote + '/' + localName));
    if (!dest.startsWith('/')) dest = '/' + dest;
  }
  const overwrite = el.sftpOverwrite && el.sftpOverwrite.checked;
  const askBeforeOverwrite = el.sftpAskOverwrite && el.sftpAskOverwrite.checked;
  sftpState.editingMappingIndex = null;
  sftpState.mappings.push({ localPath: sftpState.localSelected.path, remotePath: dest, overwrite, askBeforeOverwrite });
  renderSftpMappings();
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
}

function getCurrentGroup() {
  const id = sftpState.selectedGroupId;
  return (sftpState.mappingGroups || []).find(g => g.id === id) || sftpState.mappingGroups[0];
}

function setCurrentGroupMappings() {
  const g = getCurrentGroup();
  if (g) {
    sftpState.mappings = Array.isArray(g.uploadMappings) ? g.uploadMappings.slice() : [];
    sftpState.downloadMappings = Array.isArray(g.downloadMappings) ? g.downloadMappings.slice() : [];
  } else {
    sftpState.mappings = [];
    sftpState.downloadMappings = [];
  }
}

function syncCurrentGroupFromState() {
  const g = getCurrentGroup();
  if (g) {
    g.uploadMappings = (sftpState.mappings || []).slice();
    g.downloadMappings = (sftpState.downloadMappings || []).slice();
  }
}

function showMappingGroupNameModal(title, initialValue) {
  return new Promise((resolve) => {
    if (el.mappingGroupNameTitle) el.mappingGroupNameTitle.textContent = title;
    if (el.mappingGroupNameInput) {
      el.mappingGroupNameInput.value = initialValue || '';
      el.mappingGroupNameInput.select();
    }
    sftpState.groupNameModalResolve = resolve;
    if (el.modalMappingGroupName) el.modalMappingGroupName.showModal();
    setTimeout(() => el.mappingGroupNameInput && el.mappingGroupNameInput.focus(), 50);
  });
}

async function openSFTPModal(project) {
  if (!project || !project.serverId || !project.path || el.modalSftp == null) return;
  sftpState.project = project;
  sftpState.credId = project.serverId;
  if (Array.isArray(project.mappingGroups) && project.mappingGroups.length) {
    sftpState.mappingGroups = project.mappingGroups.map(g => ({
      id: g.id,
      name: g.name || 'Unnamed',
      uploadMappings: (g.uploadMappings || []).slice(),
      downloadMappings: (g.downloadMappings || []).slice(),
    }));
  } else {
    sftpState.mappingGroups = [{
      id: 'default',
      name: 'Default',
      uploadMappings: Array.isArray(project.uploadMappings) ? project.uploadMappings.slice() : [],
      downloadMappings: [],
    }];
  }
  sftpState.selectedGroupId = sftpState.mappingGroups[0] ? sftpState.mappingGroups[0].id : null;
  setCurrentGroupMappings();
  sftpState.localCurrentPath = project.path || '.';
  sftpState.remoteCurrentPath = '/';
  sftpState.localListing = null;
  sftpState.remoteListing = null;
  sftpState.localSelected = null;
  sftpState.remoteSelected = null;
  sftpState.editingMappingIndex = null;
  sftpState.editingDownloadMappingIndex = null;
  if (el.sftpModalTitle) el.sftpModalTitle.textContent = 'SFTP upload — ' + (project.name || 'Project');
  if (el.sftpLocalActions) el.sftpLocalActions.hidden = true;
  if (el.sftpRemoteActions) el.sftpRemoteActions.hidden = true;
  if (el.sftpDestOptions) el.sftpDestOptions.hidden = true;
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  if (el.sftpOverwrite) el.sftpOverwrite.checked = false;
  if (el.sftpAskOverwrite) { el.sftpAskOverwrite.disabled = true; el.sftpAskOverwrite.checked = false; }
  setSftpStatus('connecting');
  renderSftpGroupSelect();
  renderSftpMappings();
  el.modalSftp.showModal();
  try {
    await loadLocalListing(project.path);
    renderLocalList();
  } catch (err) {
    console.error(err);
    if (el.sftpListLocalBody) el.sftpListLocalBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Error: ' + escapeHtml(err.message) + '</td></tr>';
    if (el.sftpLocalPathbar) el.sftpLocalPathbar.textContent = project.path || '';
  }
  try {
    await loadRemoteListing('/');
    setSftpStatus('connected');
    renderRemoteList();
  } catch (err) {
    console.error(err);
    setSftpStatus('disconnected');
    if (el.sftpListRemoteBody) el.sftpListRemoteBody.innerHTML = '<tr><td colspan="2" class="sftp-list-loading">Error: ' + escapeHtml(err.message) + '</td></tr>';
    if (el.sftpRemotePathbar) el.sftpRemotePathbar.textContent = '/';
  }
}

function sftpLog(msg) {
  if (!el.sftpProgressLog) return;
  const line = document.createElement('div');
  line.textContent = msg;
  el.sftpProgressLog.appendChild(line);
  el.sftpProgressLog.scrollTop = el.sftpProgressLog.scrollHeight;
}

async function runSftpUpload() {
  if (!sftpState.project || !sftpState.credId || sftpState.mappings.length === 0) return;
  if (el.modalSftpProgress) el.modalSftpProgress.showModal();
  const titleEl = document.getElementById('sftp-progress-title');
  if (titleEl) titleEl.textContent = 'Upload progress';
  if (el.sftpProgressLog) el.sftpProgressLog.innerHTML = '';
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = true;
  for (const m of sftpState.mappings) {
    let overwrite = m.askBeforeOverwrite ? false : m.overwrite;
    const o = m.overwrite ? 'O' : 'o';
    const a = m.askBeforeOverwrite ? 'A' : 'a';
    const settingsTag = `(${o} ${a})`;
    sftpLog(`Uploading ${m.localPath} → ${m.remotePath} ${settingsTag}…`);
    for (;;) {
      try {
        const res = await fetch(`${API}/sftp/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            credId: sftpState.credId,
            localPath: m.localPath,
            remotePath: m.remotePath,
            overwrite,
            askBeforeOverwrite: !!m.askBeforeOverwrite,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.needOverwriteConfirm && m.askBeforeOverwrite) {
          if (el.sftpOverwriteMessage) el.sftpOverwriteMessage.textContent = `Overwrite ${data.path || m.remotePath} on server?`;
          if (el.modalSftpOverwrite) el.modalSftpOverwrite.showModal();
          const choice = await new Promise((resolve) => {
            sftpState.overwriteResolve = resolve;
          });
          sftpState.overwriteResolve = null;
          if (el.modalSftpOverwrite) el.modalSftpOverwrite.close();
          if (choice) overwrite = true;
          else { sftpLog(`Skipped (no overwrite): ${m.remotePath}`); break; }
          continue;
        }
        if (!res.ok) {
          const errMsg = data.error || 'Upload failed';
          const verbose = data.verbose || errMsg;
          throw new Error(verbose);
        }
        if (data.skipped) {
          sftpLog(`No changes made, skipping: ${m.remotePath}`);
        } else {
          sftpLog(`Done: ${m.remotePath}`);
        }
        break;
      } catch (err) {
        const errMsg = err.message || 'Upload failed';
        sftpLog(`Error ${settingsTag}: ${errMsg}`);
        const logMessage = `sftp-upload ${settingsTag} ${m.localPath} → ${m.remotePath}: ${errMsg}`;
        try {
          fetch(API + '/log-client-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'sftp-upload', message: logMessage }),
          }).catch(() => {});
        } catch (e) {}
        break;
      }
    }
  }
  sftpLog('Upload run finished.');
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = false;
}

async function runSftpDownload() {
  const list = sftpState.downloadMappings || [];
  if (!sftpState.project || !sftpState.credId || list.length === 0) return;
  if (el.modalSftpProgress) el.modalSftpProgress.showModal();
  const titleEl = document.getElementById('sftp-progress-title');
  if (titleEl) titleEl.textContent = 'Download progress';
  if (el.sftpProgressLog) el.sftpProgressLog.innerHTML = '';
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = true;
  for (const m of list) {
    sftpLog(`Downloading ${m.remotePath} → ${m.localPath}…`);
    try {
      await runSftpDownloadOne(m.remotePath, m.localPath);
      sftpLog(`Done: ${m.localPath}`);
    } catch (err) {
      sftpLog(`Error: ${err.message || 'Download failed'}`);
    }
  }
  sftpLog('Download run finished.');
  if (el.sftpProgressClose) el.sftpProgressClose.disabled = false;
}

function addSftpDownloadMapping() {
  if (!sftpState.remoteSelected) return;
  const baseDir = (sftpState.project && sftpState.project.path) || '.';
  const remotePath = sftpState.remoteSelected.path;
  const remoteName = remotePath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'download';
  const localPath = baseDir.replace(/\/$/, '') + '/' + remoteName;
  sftpState.downloadMappings.push({ remotePath, localPath });
  sftpState.editingDownloadMappingIndex = null;
  renderSftpMappings();
}

async function setProjectPinned(projectId, pinned) {
  if (!projectId) return;
  try {
    await fetchJSON(`${API}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify({ pinned }),
    });
    await loadProjects();
    if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
  } catch (err) {
    alert(err.message || 'Failed to update pin');
  }
}

function getProjectPrimaryActionTitle(project) {
  const action = project.primaryAction || 'auto';
  if (action === 'cursor') return 'Open in Cursor';
  if (action === 'vscode') return 'Open in VS Code';
  if (action === 'chrome') return 'Open in Chrome';
  if (action === 'explorer') return 'Open in File Explorer';
  return project.type === 'url' ? 'Open URL' : 'Open in File Explorer';
}

function getClickActionLabel(action) {
  if (action === 'cursor') return 'Cursor';
  if (action === 'vscode') return 'VS Code';
  if (action === 'chrome') return 'Chrome';
  if (action === 'explorer') return 'File Explorer';
  return 'Auto';
}

function getClickActionTitle(action) {
  if (action === 'cursor') return 'Open in Cursor';
  if (action === 'vscode') return 'Open in VS Code';
  if (action === 'chrome') return 'Open in Chrome';
  if (action === 'explorer') return 'Open in File Explorer';
  return 'Open';
}

function renderProjectLaunchButton(project) {
  return `<button type="button" class="project-open-primary-btn" data-id="${project.id}" title="${escapeAttr(getProjectPrimaryActionTitle(project))}" aria-label="${escapeAttr(getProjectPrimaryActionTitle(project))}">&#128194;</button>`;
}

async function runClickAction(action, target) {
  const normalized = action || 'auto';
  if (normalized === 'cursor' && target.path) {
    await openInCursor(target.path);
    return true;
  }
  if (normalized === 'vscode' && target.path) {
    await openInVSCode(target.path);
    return true;
  }
  if (normalized === 'chrome' && target.url) {
    await openInChrome(target.url);
    return true;
  }
  if (normalized === 'chrome' && target.path) {
    await openInChrome(target.path);
    return true;
  }
  if (normalized === 'explorer' && target.path) {
    await openInExplorer(target.path);
    return true;
  }
  if (normalized === 'auto' && target.type === 'url' && target.url) {
    await fetchJSON(`${API}/open-url`, { method: 'POST', body: JSON.stringify({ url: target.url }) });
    return true;
  }
  if (normalized === 'auto' && target.path) {
    await openInExplorer(target.path);
    return true;
  }
  if (normalized === 'auto' && target.url) {
    await fetchJSON(`${API}/open-url`, { method: 'POST', body: JSON.stringify({ url: target.url }) });
    return true;
  }
  return false;
}

function renderProjectCard(project, subprojects = [], isSub = false) {
  const isUrlProject = project.type === 'url';
  const git = project.git || null;
  const subCards = (subprojects || []).map(sp => renderProjectCard(sp, null, true)).join('');
  const launchButtonHtml = renderProjectLaunchButton(project);

  function statusCodeClass(code) {
    if (!code || code === '  ') return '';
    const c = (code[0] !== ' ' ? code[0] : code[1]).toUpperCase();
    if (c === '?' || code.trim() === '??') return 'status-untracked';
    if (c === '!') return 'status-ignored';
    return 'status-' + c;
  }
  let gitBlock = '';
  if (git && git.isRepo) {
    if (git.error) {
      gitBlock = `<div class="git-section collapsed"><button type="button" class="git-toggle">Git</button><div class="git-body"><table class="git-table"><tr class="git-row-error"><th></th><td>${escapeHtml(git.error)}</td></tr></table></div></div>`;
    } else {
      const rows = [];
      if (git.branch) rows.push(['Branch', git.branch]);
      if (git.upstream) rows.push(['Tracking', git.upstream]);
      if (git.remoteHost) rows.push(['Host', git.remoteHost]);
      if (git.remoteAccount) rows.push(['Account', git.remoteAccount]);
      if (git.remoteRepo) rows.push(['Repo', git.remoteRepo]);
      if (git.remote) rows.push(['Origin URL', git.remote]);
      if (git.remotes && git.remotes.length) {
        const unique = [...new Map(git.remotes.map(r => [r.name, r.url])).entries()];
        rows.push(['Remotes', unique.map(([n, u]) => n + ' = ' + u).join(' | ')]);
      }
      if (git.userName) rows.push(['Config user', git.userName]);
      if (git.userEmail) rows.push(['Config email', git.userEmail]);
      if (git.lastCommit) rows.push(['Last commit', git.lastCommit]);
      if (git.lastCommitAuthor) rows.push(['Author', git.lastCommitAuthor]);
      if (git.lastCommitDate) rows.push(['Date', git.lastCommitDate]);
      let tableRows = rows.length
        ? rows.map(([k, v]) => '<tr><th>' + escapeHtml(k) + '</th><td>' + escapeHtml(v) + '</td></tr>').join('')
        : '<tr class="git-row-muted"><th></th><td>No git details available.</td></tr>';
      let statusRows = '';
      if (git.status) {
        const statusLines = git.status.split('\n').filter(Boolean);
        statusRows = '<table class="git-status-table"><thead><tr><th>Status</th><th>Path</th></tr></thead><tbody>' +
          statusLines.map(line => {
            const code = line.slice(0, 2);
            const path = line.slice(2).trim();
            const cls = statusCodeClass(code);
            const codeDisplay = code.trim() || '??';
            return '<tr><td><span class="git-status-code ' + cls + '">' + escapeHtml(codeDisplay) + '</span></td><td>' + escapeHtml(path) + '</td></tr>';
          }).join('') +
          '</tbody></table>';
      }
      gitBlock = `<div class="git-section collapsed"><button type="button" class="git-toggle">Git</button><div class="git-body"><table class="git-table">${tableRows}</table>${statusRows}</div></div>`;
    }
  }

  const hasImage = project.imagePath || project.imageUrl;
  const imageSrc = project.imagePath ? `${API}/project-image/${project.id}` : (project.imageUrl || '');
  const imageHtml = hasImage
    ? `<div class="project-card-image"><img src="${escapeAttr(imageSrc)}" alt="" /></div>`
    : '';

  const tagList = (project.tags || []).filter(t => t != null && String(t).trim());
  const tagsHtml = tagList.length
    ? tagList.map((t, i) => {
        const colorClass = 'tag-color-' + (Math.abs(hashCode(String(t).trim())) % 8);
        return `<span class="project-tag ${colorClass}">${escapeHtml(String(t).trim())}</span>`;
      }).join('')
    : '';

  const linksList = project.links || [];
  const linksHtml = linksList.length
    ? linksList.map(l => {
        const type = l.type === 'file' ? 'file' : 'url';
        const action = l.action || 'auto';
        const title = `${l.description || l.url || (type === 'file' ? 'Open folder' : 'Open link')} (${getClickActionTitle(action)})`;
        return `<button type="button" class="project-link-icon" title="${escapeAttr(title)}" data-type="${escapeAttr(type)}" data-action="${escapeAttr(action)}" data-url="${escapeAttr(l.url)}" data-path="${escapeAttr(project.path)}" aria-label="Open link">&#128279;</button>`;
      }).join('')
    : '';

  const pinIndicator = project.pinned ? '<span class="project-pin-indicator" title="Pinned">&#128204;</span>' : '';
  return `
    <div class="project-card ${isSub ? 'subproject' : ''} ${project.pinned ? 'is-pinned' : ''}" data-id="${project.id}">
      <div class="project-card-top">
        ${hasImage ? `<div class="project-card-top-left">${imageHtml}</div>` : ''}
        <div class="project-card-top-right">
          <div class="project-card-header">
            ${pinIndicator}
            ${launchButtonHtml}
            <a href="#" class="project-name-link" data-id="${project.id}" title="Open project workspace">${escapeHtml(project.name)}</a>
            ${linksHtml}
            <div class="project-actions">
              ${project.serverId && project.type === 'folder' && project.path ? `<button type="button" class="btn-sftp-upload" data-id="${project.id}" title="SFTP upload" aria-label="SFTP upload"><span class="sftp-arrow">↑</span>${!(project.uploadMappings && project.uploadMappings.length) ? '<sup class="sftp-new">+</sup>' : ''}</button>` : ''}
              <button type="button" class="btn-gear" data-id="${project.id}" title="Project settings" aria-label="Project settings">&#x2699;</button>
              <button type="button" class="btn-remove-x btn-remove-project" data-id="${project.id}" title="Remove from list" aria-label="Remove from list">&#x2715;</button>
            </div>
          </div>
          <div class="project-description" contenteditable="true" data-id="${project.id}">${escapeHtml(project.description || '')}</div>
          ${tagsHtml ? `<div class="project-tags">${tagsHtml}</div>` : ''}
          <div class="project-card-footer">
            <button type="button" class="btn btn-small btn-add-subproject" data-parent-id="${project.id}">+ Add subproject</button>
          </div>
        </div>
      </div>
      ${gitBlock || subCards ? `<div class="project-card-bottom">${gitBlock}${subCards ? `<div class="subprojects-list">${subCards}</div>` : ''}</div>` : ''}
    </div>`;
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return h;
}

function renderGridCard(project) {
  const isUrlProject = project.type === 'url';
  const hasImage = project.imagePath || project.imageUrl;
  const launchButtonHtml = renderProjectLaunchButton(project);
  const imageSrc = hasImage
    ? (project.imagePath ? `${API}/project-image/${project.id}` : (project.imageUrl || ''))
    : '';
  const bgStyle = imageSrc ? ` style="background-image: url('${escapeAttr(imageSrc).replace(/'/g, '&#39;')}');"` : '';
  const linksList = project.links || [];
  const linksHtml = linksList.length
    ? linksList.map(l => {
        const type = l.type === 'file' ? 'file' : 'url';
        const action = l.action || 'auto';
        const title = `${l.description || l.url || (type === 'file' ? 'Open folder' : 'Open link')} (${getClickActionTitle(action)})`;
        return `<button type="button" class="project-link-icon" title="${escapeAttr(title)}" data-type="${escapeAttr(type)}" data-action="${escapeAttr(action)}" data-url="${escapeAttr(l.url)}" data-path="${escapeAttr(project.path)}" aria-label="Open link">&#128279;</button>`;
      }).join('')
    : '';
  const pinIndicator = project.pinned ? '<span class="project-pin-indicator" title="Pinned">&#128204;</span>' : '';
  return `
    <div class="grid-card ${project.pinned ? 'is-pinned' : ''}" data-id="${project.id}">
      <div class="grid-card-bg"${bgStyle}></div>
      <div class="grid-card-top-panel">
        ${pinIndicator}
        ${launchButtonHtml}
        <a href="#" class="project-name-link" data-id="${project.id}" title="Open project workspace">${escapeHtml(project.name)}</a>
        ${linksHtml}
        <div class="grid-card-actions">
          ${project.serverId && project.type === 'folder' && project.path ? `<button type="button" class="btn-sftp-upload" data-id="${project.id}" title="SFTP upload" aria-label="SFTP upload"><span class="sftp-arrow">↑</span>${!(project.uploadMappings && project.uploadMappings.length) ? '<sup class="sftp-new">+</sup>' : ''}</button>` : ''}
          <button type="button" class="btn-gear" data-id="${project.id}" title="Project settings" aria-label="Project settings">&#x2699;</button>
          <button type="button" class="btn-remove-x btn-remove-project" data-id="${project.id}" title="Remove from list" aria-label="Remove from list">&#x2715;</button>
        </div>
      </div>
      <div class="grid-card-bottom-panel">
        <span class="grid-card-description">${escapeHtml((project.description || '').slice(0, 80))}${(project.description || '').length > 80 ? '…' : ''}</span>
      </div>
    </div>`;
}

function renderProjectScreenCard(project) {
  const hasImage = project.imagePath || project.imageUrl;
  const imageSrc = project.imagePath ? `${API}/project-image/${project.id}` : (project.imageUrl || '');
  const imageHtml = hasImage
    ? `<div class="project-card-image"><img src="${escapeAttr(imageSrc)}" alt="" /></div>`
    : '';
  const launchButtonHtml = renderProjectLaunchButton(project);
  const tagsHtml = (project.tags || []).filter((tag) => tag != null && String(tag).trim()).map((tag) => {
    const colorClass = 'tag-color-' + (Math.abs(hashCode(String(tag).trim())) % 8);
    return `<span class="project-tag ${colorClass}">${escapeHtml(String(tag).trim())}</span>`;
  }).join('');
  const linksHtml = (project.links || []).map((link) => {
    const type = link.type === 'file' ? 'file' : 'url';
    const action = link.action || 'auto';
    const title = `${link.description || link.url || 'Open link'} (${getClickActionTitle(action)})`;
    return `<button type="button" class="project-link-icon" title="${escapeAttr(title)}" data-type="${escapeAttr(type)}" data-action="${escapeAttr(action)}" data-url="${escapeAttr(link.url)}" data-path="${escapeAttr(project.path)}" aria-label="Open link">&#128279;</button>`;
  }).join('');
  const summaryBits = [
    project.category || '',
    project.type === 'folder' ? (project.path || '') : (project.url || ''),
    project.primaryAction ? getClickActionLabel(project.primaryAction) : '',
  ].filter(Boolean);

  return `
    <div class="project-card project-card-detail ${project.pinned ? 'is-pinned' : ''}" data-id="${project.id}">
      <div class="project-card-top">
        ${hasImage ? `<div class="project-card-top-left">${imageHtml}</div>` : ''}
        <div class="project-card-top-right">
          <div class="project-card-header">
            ${project.pinned ? '<span class="project-pin-indicator" title="Pinned">&#128204;</span>' : ''}
            ${launchButtonHtml}
            <span class="project-name-heading">${escapeHtml(project.name)}</span>
            ${linksHtml}
            <div class="project-actions">
              ${project.serverId && project.type === 'folder' && project.path ? `<button type="button" class="btn-sftp-upload" data-id="${project.id}" title="SFTP upload" aria-label="SFTP upload"><span class="sftp-arrow">â†‘</span>${!(project.uploadMappings && project.uploadMappings.length) ? '<sup class="sftp-new">+</sup>' : ''}</button>` : ''}
              <button type="button" class="btn-gear" data-id="${project.id}" title="Project settings" aria-label="Project settings">&#x2699;</button>
            </div>
          </div>
          ${summaryBits.length ? `<div class="project-detail-meta">${escapeHtml(summaryBits.join(' • '))}</div>` : ''}
          <div class="project-description project-description-static">${escapeHtml(project.description || '')}</div>
          ${tagsHtml ? `<div class="project-tags">${tagsHtml}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  if (s == null) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function escapeAttr(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function openInExplorer(path) {
  await fetchJSON(`${API}/open-explorer`, { method: 'POST', body: JSON.stringify({ path }) });
}

async function openInCursor(path) {
  await fetchJSON(`${API}/open-cursor`, { method: 'POST', body: JSON.stringify({ path }) });
}

async function openInCursorAdmin(path) {
  await fetchJSON(`${API}/open-cursor-admin`, { method: 'POST', body: JSON.stringify({ path }) });
}

async function openInVSCode(path) {
  await fetchJSON(`${API}/open-vscode`, { method: 'POST', body: JSON.stringify({ path }) });
}

async function openInChrome(url) {
  const value = String(url || '').trim();
  const payload = /^(https?:\/\/|file:\/\/)/i.test(value)
    ? { url: value }
    : { path: value };
  await fetchJSON(`${API}/open-chrome`, { method: 'POST', body: JSON.stringify(payload) });
}

function getProjectPrimaryUrl(project) {
  if (project && project.url) return project.url;
  const urlLink = (project && Array.isArray(project.links) ? project.links : [])
    .find((link) => link && link.type !== 'file' && link.url);
  return urlLink ? urlLink.url : '';
}

async function openProjectPrimaryAction(project) {
  if (!project) return;
  await runClickAction(project.primaryAction || 'auto', {
    type: project.type,
    path: project.path || '',
    url: getProjectPrimaryUrl(project),
  });
}

async function openProjectLink(linkButton) {
  const { type, url, path: projectPath, action } = linkButton.dataset;
  if (!url) return;
  const isFile = type === 'file';
  const isRelativeToProject = isFile && (url.startsWith('.') || ((!url.includes('/') && !url.includes('\\')) && !/^[a-zA-Z]:/.test(url)));
  const pathToOpen = isFile
    ? (isRelativeToProject && projectPath
        ? `${projectPath.replace(/\\/g, '/')}/${url}`.replace(/\/+/g, '/').replace(/^\//, '')
        : url.replace(/\\/g, '/'))
    : '';
  const opened = await runClickAction(action || 'auto', {
    type: isFile ? 'file' : 'url',
    path: pathToOpen,
    url: isFile ? '' : url,
  });
  if (!opened) {
    if (isFile && pathToOpen) await openInExplorer(pathToOpen);
    if (!isFile) await fetchJSON(`${API}/open-url`, { method: 'POST', body: JSON.stringify({ url }) });
  }
}

const TASK_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

function sortTasksForDisplay(items) {
  return [...(items || [])].sort((left, right) => {
    const sortDelta = Number(left.sortOrder || 0) - Number(right.sortOrder || 0);
    if (sortDelta !== 0) return sortDelta;
    return String(left.createdAt || '').localeCompare(String(right.createdAt || ''));
  });
}

function formatTaskDate(value) {
  if (!value) return '';
  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return value;
  }
}

function getTaskPriorityLabel(priority) {
  if (priority === 'critical') return 'Critical';
  if (priority === 'high') return 'High';
  if (priority === 'low') return 'Low';
  return 'Medium';
}

function getTaskBadges(task) {
  const badges = [
    task.itemType && task.itemType !== 'task'
      ? `<span class="task-badge">${escapeHtml(task.itemType)}</span>`
      : '',
    `<span class="task-badge task-badge-priority-${escapeAttr(task.priority || 'medium')}">${escapeHtml(getTaskPriorityLabel(task.priority))}</span>`,
  ];
  if (task.category) badges.push(`<span class="task-badge">${escapeHtml(task.category)}</span>`);
  if (task.milestone) badges.push('<span class="task-badge task-badge-milestone">Milestone</span>');
  if (task.dueDate) badges.push(`<span class="task-badge">${escapeHtml(formatTaskDate(task.dueDate))}</span>`);
  if (task.dependencyIds && task.dependencyIds.length) {
    const dependency = taskState.tasks.find((candidate) => candidate.id === task.dependencyIds[0]);
    const label = dependency ? `${dependency.id}: ${dependency.title}` : task.dependencyIds[0];
    badges.push(`<button type="button" class="task-badge dependency-chip" data-dependency-open="${escapeAttr(task.dependencyIds[0])}" title="${escapeAttr(label)}">Dependant on</button>`);
  }
  return badges.filter(Boolean).join('');
}

function getTaskSummaryText(task) {
  const parts = [];
  if (task.assignedTo) parts.push(task.assignedTo);
  if (task.startDate || task.endDate) {
    parts.push(`${formatTaskDate(task.startDate) || 'Start?'} - ${formatTaskDate(task.endDate) || 'End?'}`);
  } else if (task.dueDate) {
    parts.push(`Due ${formatTaskDate(task.dueDate)}`);
  }
  if (task.dependencyIds && task.dependencyIds.length) {
    parts.push(`${task.dependencyIds.length} dependenc${task.dependencyIds.length === 1 ? 'y' : 'ies'}`);
  }
  return parts.join(' • ');
}

async function loadTaskWorkspace(projectId) {
  taskState.tasks = sortTasksForDisplay(await fetchJSON(`${API}/projects/${projectId}/tasks`));
}

async function loadIntegrationWorkspace(project) {
  if (!project) return;
  integrationState.projectId = project.id;
  const path = project.path || '';
  const [gitResult, githubResult, eventsResult] = await Promise.all([
    path ? fetchJSON(`${API}/git-info?path=${encodeURIComponent(path)}`).catch((error) => ({ isRepo: false, error: error.message })) : Promise.resolve({ isRepo: false }),
    fetchJSON(`${API}/github/projects/${project.id}/summary`).catch((error) => ({ connected: false, issues: [], pullRequests: [], message: error.message })),
    fetchJSON(`${API}/projects/${project.id}/integration-events`).catch(() => []),
  ]);
  integrationState.git = gitResult;
  integrationState.github = githubResult;
  integrationState.events = Array.isArray(eventsResult) ? eventsResult : [];
}

function renderIntegrationWorkspace() {
  const project = taskState.project;
  if (!project) return;

  if (el.integrationGitSummary) {
    if (!integrationState.git || !integrationState.git.isRepo) {
      el.integrationGitSummary.innerHTML = '<div class="integration-empty">No git repository detected for this project.</div>';
    } else {
      const git = integrationState.git;
      el.integrationGitSummary.innerHTML = `
        <div class="integration-pill"><strong>Branch</strong><span>${escapeHtml(git.branch || 'Unknown')}</span></div>
        <div class="integration-pill"><strong>Remote</strong><span>${escapeHtml(git.remoteRepo ? `${git.remoteAccount}/${git.remoteRepo}` : (git.remote || 'Not set'))}</span></div>
        <div class="integration-pill"><strong>Status</strong><span>${escapeHtml(git.status ? `${git.status.split('\n').filter(Boolean).length} changed file(s)` : 'Clean')}</span></div>
        <div class="integration-pill"><strong>Sync</strong><span>${escapeHtml(`Ahead ${git.ahead || 0} / Behind ${git.behind || 0}`)}</span></div>
      `;
    }
  }

  const branches = integrationState.git && Array.isArray(integrationState.git.localBranches)
    ? integrationState.git.localBranches
    : [];
  if (el.integrationBranchSelect) {
    el.integrationBranchSelect.innerHTML = branches.length
      ? branches.map((branch) => `<option value="${escapeAttr(branch.name)}" ${branch.name === (integrationState.git && integrationState.git.branch) ? 'selected' : ''}>${escapeHtml(branch.name)}${branch.upstream ? ` (${escapeHtml(branch.upstream)})` : ''}</option>`).join('')
      : '<option value="">No branches</option>';
  }
  if (el.integrationMergeBranch) {
    const currentBranch = integrationState.git && integrationState.git.branch;
    const mergeBranches = branches.filter((branch) => branch.name !== currentBranch);
    el.integrationMergeBranch.innerHTML = mergeBranches.length
      ? mergeBranches.map((branch) => `<option value="${escapeAttr(branch.name)}">${escapeHtml(branch.name)}</option>`).join('')
      : '<option value="">No branches available</option>';
  }

  if (el.integrationGitConflicts) {
    const conflicted = integrationState.git && Array.isArray(integrationState.git.conflictedFiles)
      ? integrationState.git.conflictedFiles
      : [];
    if (!conflicted.length) {
      el.integrationGitConflicts.innerHTML = '';
      el.integrationGitConflicts.hidden = true;
    } else {
      el.integrationGitConflicts.hidden = false;
      el.integrationGitConflicts.innerHTML = `
        <div class="integration-conflict-banner">
          <strong>Merge conflicts detected</strong>
          <span>${escapeHtml(conflicted.join(', '))}</span>
          <div class="integration-actions">
            <button type="button" class="btn btn-small btn-secondary" data-git-resolve="ours">Use ours</button>
            <button type="button" class="btn btn-small btn-secondary" data-git-resolve="theirs">Use theirs</button>
          </div>
        </div>
      `;
      el.integrationGitConflicts.querySelectorAll('[data-git-resolve]').forEach((button) => {
        button.addEventListener('click', async () => {
          try {
            await runGitAction('/api/git/merge', {
              strategy: button.dataset.gitResolve,
              files: conflicted,
              complete: true,
            });
          } catch (error) {
            alert(error.message || 'Failed to resolve conflicts');
          }
        });
      });
    }
  }

  const github = integrationState.github || { connected: false, issues: [], pullRequests: [] };
  if (el.integrationGithubSummary) {
    el.integrationGithubSummary.innerHTML = github.connected
      ? `
          <div class="integration-pill"><strong>Repository</strong><span>${escapeHtml(`${github.repository.owner}/${github.repository.repo}`)}</span></div>
          <div class="integration-pill"><strong>Issues</strong><span>${escapeHtml(String((github.issues || []).length))}</span></div>
          <div class="integration-pill"><strong>Pull Requests</strong><span>${escapeHtml(String((github.pullRequests || []).length))}</span></div>
        `
      : `<div class="integration-empty">${escapeHtml(github.message || 'Configure GitHub in settings or connect a repository remote.')}</div>`;
  }
  if (el.integrationGithubIssues) {
    el.integrationGithubIssues.innerHTML = github.connected && github.issues && github.issues.length
      ? github.issues.map((issue) => `<li><a href="${escapeAttr(issue.html_url || '#')}" target="_blank" rel="noreferrer">${escapeHtml(`#${issue.number} ${issue.title}`)}</a></li>`).join('')
      : '<li class="integration-empty">No open issues.</li>';
  }
  if (el.integrationGithubPulls) {
    el.integrationGithubPulls.innerHTML = github.connected && github.pullRequests && github.pullRequests.length
      ? github.pullRequests.map((pull) => `<li><a href="${escapeAttr(pull.html_url || '#')}" target="_blank" rel="noreferrer">${escapeHtml(`#${pull.number} ${pull.title}`)}</a></li>`).join('')
      : '<li class="integration-empty">No open pull requests.</li>';
  }

  if (el.integrationWebhookSummary) {
    const webhookSettings = (project.integrations && project.integrations.webhooks) || { autoCreateTasks: false, taskStatus: 'todo' };
    el.integrationWebhookSummary.innerHTML = `
      <div class="integration-pill"><strong>Automation</strong><span>${webhookSettings.autoCreateTasks ? 'Creates tasks' : 'Logs events only'}</span></div>
      <div class="integration-pill"><strong>Task status</strong><span>${escapeHtml(webhookSettings.taskStatus || 'todo')}</span></div>
      <div class="integration-pill"><strong>Prefix</strong><span>${escapeHtml(webhookSettings.taskPrefix || 'Webhook')}</span></div>
    `;
  }
  if (el.integrationWebhookUrl) {
    el.integrationWebhookUrl.textContent = `${window.location.origin}${API}/webhooks/${project.id}/default`;
  }
  if (el.integrationPluginList) {
    const plugins = project.integrations && Array.isArray(project.integrations.plugins)
      ? project.integrations.plugins
      : [];
    el.integrationPluginList.innerHTML = plugins.length
      ? plugins.map((plugin) => `
          <li class="integration-plugin-item">
            <div>
              <strong>${escapeHtml(plugin.name || plugin.id || 'Plugin')}</strong>
              <span>${escapeHtml((plugin.type || 'webhook_forward').replace(/_/g, ' '))}</span>
            </div>
            <button type="button" class="btn btn-small btn-secondary" data-plugin-run="${escapeAttr(plugin.id)}">Run</button>
          </li>
        `).join('')
      : '<li class="integration-empty">No custom integrations configured.</li>';
    el.integrationPluginList.querySelectorAll('[data-plugin-run]').forEach((button) => {
      button.addEventListener('click', async () => {
        try {
          await fetchJSON(`${API}/projects/${project.id}/integrations/${button.dataset.pluginRun}/execute`, {
            method: 'POST',
            body: JSON.stringify({}),
          });
          await refreshIntegrationWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to execute integration');
        }
      });
    });
  }
  if (el.integrationEventsList) {
    el.integrationEventsList.innerHTML = integrationState.events.length
      ? integrationState.events.map((event) => `
          <li class="integration-event-row">
            <div>
              <strong>${escapeHtml(event.eventType)}</strong>
              <span>${escapeHtml(event.source || 'integration')} • ${escapeHtml(event.deliveryStatus || 'received')}</span>
            </div>
            <span>${escapeHtml(new Date(event.createdAt).toLocaleString())}</span>
          </li>
        `).join('')
      : '<li class="integration-empty">No integration events yet.</li>';
  }
}

async function refreshIntegrationWorkspace() {
  if (!taskState.project) return;
  void logUiEvent('integrations', 'refresh-workspace', { projectId: taskState.project.id });
  await loadIntegrationWorkspace(taskState.project);
  renderIntegrationWorkspace();
}

async function runGitAction(route, extraBody = {}) {
  if (!taskState.project || !taskState.project.path) throw new Error('Project has no folder path');
  void logUiEvent('integrations', 'git-action', { route, ...extraBody });
  const result = await fetchJSON(route, {
    method: 'POST',
    body: JSON.stringify({
      path: taskState.project.path,
      ...extraBody,
    }),
  });
  integrationState.git = result && result.info ? result.info : result;
  renderIntegrationWorkspace();
  await loadProjects();
  if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
  return result;
}

async function runBuiltInIntegration(integrationId) {
  if (!taskState.project) return;
  void logUiEvent('integrations', 'run-built-in-tool', { integrationId });
  const result = await fetchJSON(`${API}/projects/${taskState.project.id}/integrations/${integrationId}/execute`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  if (integrationId === 'github') {
    integrationState.github = result;
    renderIntegrationWorkspace();
  }
  return result;
}

function renderWorkspaceDesignerNav() {
  if (!el.workspaceDesignerNav) return;
  const project = taskState.project;
  const views = getWorkspaceViews(project);
  const grouped = views.reduce((acc, view) => {
    const key = view.group || 'core';
    (acc[key] = acc[key] || []).push(view);
    return acc;
  }, {});

  if (el.workspaceDesignerKicker) {
    el.workspaceDesignerKicker.textContent = project && project.projectType === 'software'
      ? 'Software Project Designer'
      : 'Project Designer';
  }
  if (el.workspaceDesignerTitle) {
    el.workspaceDesignerTitle.textContent = project && project.name ? project.name : 'Project Workspace';
  }
  if (el.workspaceDesignerSummary) {
    const enabledModules = getEnabledProjectModules(project);
    const coreModuleCount = enabledModules.filter((module) => module.group === 'core').length;
    const softwareModuleCount = enabledModules.filter((module) => module.group === 'software').length;
    el.workspaceDesignerSummary.textContent = project && project.projectType === 'software'
      ? `Design the software as a product, with documents generated as outputs of the design process. ${coreModuleCount} core modules and ${softwareModuleCount} software modules are enabled.`
      : `Use the core planning workspace to shape the project before specializing it further. ${coreModuleCount} core modules are enabled.`;
  }

  el.workspaceDesignerNav.innerHTML = Object.entries(grouped).map(([group, items]) => `
    <section class="workspace-designer-nav-group">
      <div class="workspace-designer-nav-label">${escapeHtml(DESIGNER_GROUP_LABELS[group] || group)}</div>
      <div class="workspace-designer-nav-items">
        ${items.map((item) => `
          <button type="button" class="workspace-designer-nav-item ${item.id === taskState.view ? 'is-active' : ''}" data-task-view-nav="${escapeAttr(item.id)}">
            <span class="workspace-designer-nav-item-title">${escapeHtml(item.label)}</span>
            <span class="workspace-designer-nav-item-copy">${escapeHtml(item.description)}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `).join('');

  el.workspaceDesignerNav.querySelectorAll('[data-task-view-nav]').forEach((button) => {
    button.addEventListener('click', async () => {
      const viewName = button.getAttribute('data-task-view-nav') || 'roadmap';
      setTaskWorkspaceView(viewName);
      renderWorkspaceHeader();
      renderModuleDesignerSurface();
      if (viewName === 'integrations') {
        try {
          await refreshIntegrationWorkspace();
        } catch (error) {
          alert(error.message || 'Failed to load integrations');
        }
      }
    });
  });
}

function renderWorkspaceHeader() {
  const project = taskState.project;
  const view = getWorkspaceViewDefinition(taskState.view, project);
  if (el.taskWorkspaceKicker) {
    el.taskWorkspaceKicker.textContent = project && project.projectType === 'software'
      ? 'Software Project Designer'
      : 'Project Designer';
  }
  if (el.taskWorkspaceTitle) {
    el.taskWorkspaceTitle.textContent = view && view.label ? view.label : 'Workspace';
  }
  if (el.taskWorkspaceViewDescription) {
    const suffix = project && project.projectType === 'software'
      ? 'This is a product-design surface that can generate structured, AI-consumable outputs.'
      : 'This is part of the shared project-planning workspace.';
    el.taskWorkspaceViewDescription.textContent = `${view && view.description ? view.description : ''} ${suffix}`;
  }
  if (el.btnTaskAdd) {
    el.btnTaskAdd.hidden = !['roadmap', 'board', 'gantt'].includes(taskState.view);
  }
}

function renderTaskWorkspaceSummary() {
  if (!el.taskWorkspaceSummary) return;
  const total = taskState.tasks.length;
  const done = taskState.tasks.filter((task) => task.status === 'done').length;
  const inProgress = taskState.tasks.filter((task) => task.status === 'in_progress').length;
  const milestones = taskState.tasks.filter((task) => task.milestone).length;
  const phases = getRoadmapPhases().length;
  const features = getFeaturesList().filter((item) => !item.archived).length;
  const bugs = getBugsList().filter((item) => !item.archived).length;
  const enabledModules = getEnabledProjectModules();
  const coreModules = enabledModules.filter((module) => module.group === 'core').length;
  const softwareModules = enabledModules.filter((module) => module.group === 'software').length;
  el.taskWorkspaceSummary.innerHTML = `
    <div class="task-summary-pill"><strong>${total}</strong> work items</div>
    <div class="task-summary-pill"><strong>${phases}</strong> phases</div>
    <div class="task-summary-pill"><strong>${coreModules}</strong> core modules</div>
    ${taskState.project && taskState.project.projectType === 'software' ? `<div class="task-summary-pill"><strong>${softwareModules}</strong> software modules</div>` : ''}
    <div class="task-summary-pill"><strong>${inProgress}</strong> active</div>
    <div class="task-summary-pill"><strong>${done}</strong> done</div>
    <div class="task-summary-pill"><strong>${milestones}</strong> milestones</div>
    ${taskState.project && taskState.project.projectType === 'software' ? `<div class="task-summary-pill"><strong>${features}</strong> features</div>` : ''}
    ${taskState.project && taskState.project.projectType === 'software' ? `<div class="task-summary-pill"><strong>${bugs}</strong> bugs</div>` : ''}
  `;
}

function normalizeDesignerDetailEntry(entry) {
  if (!entry || typeof entry !== 'object') return createDesignerDetailEntry();
  return {
    title: entry.title || '',
    description: entry.description || '',
    versionDate: entry.versionDate || createDesignerTimestamp(),
  };
}

function normalizeArchitectureConnectionEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    return {
      source: '',
      target: '',
      label: '',
      versionDate: createDesignerTimestamp(),
    };
  }
  return {
    source: entry.source || '',
    target: entry.target || '',
    label: entry.label || '',
    versionDate: entry.versionDate || createDesignerTimestamp(),
  };
}

function normalizeArchitectureEditorState(state) {
  const base = state && typeof state === 'object' ? state : {};
  const overview = base.overview && typeof base.overview === 'object' ? base.overview : {};
  const deployment = base.deployment && typeof base.deployment === 'object' ? base.deployment : {};
  return {
    overview: {
      systemPurpose: typeof overview.systemPurpose === 'string' ? overview.systemPurpose : '',
      architecturalVision: typeof overview.architecturalVision === 'string' ? overview.architecturalVision : '',
      architecturalStyle: typeof overview.architecturalStyle === 'string' ? overview.architecturalStyle : '',
      versionDate: typeof overview.versionDate === 'string' ? overview.versionDate : createDesignerTimestamp(),
    },
    components: Array.isArray(base.components) ? base.components.map((item) => normalizeDesignerDetailEntry(item)) : [],
    componentConnections: Array.isArray(base.componentConnections) ? base.componentConnections.map((item) => normalizeArchitectureConnectionEntry(item)) : [],
    boundaries: Array.isArray(base.boundaries) ? base.boundaries.map((item) => normalizeDesignerDetailEntry(item)) : [],
    integrations: Array.isArray(base.integrations) ? base.integrations.map((item) => normalizeDesignerDetailEntry(item)) : [],
    runtimeScenarios: Array.isArray(base.runtimeScenarios) ? base.runtimeScenarios.map((item) => normalizeDesignerDetailEntry(item)) : [],
    operationalConcerns: Array.isArray(base.operationalConcerns) ? base.operationalConcerns.map((item) => normalizeDesignerDetailEntry(item)) : [],
    decisions: Array.isArray(base.decisions) ? base.decisions.map((item) => normalizeDesignerDetailEntry(item)) : [],
    constraints: Array.isArray(base.constraints) ? base.constraints.map((item) => normalizeDesignerDetailEntry(item)) : [],
    deployment: {
      runtimeTopology: typeof deployment.runtimeTopology === 'string' ? deployment.runtimeTopology : '',
      environmentNotes: typeof deployment.environmentNotes === 'string' ? deployment.environmentNotes : '',
      versionDate: typeof deployment.versionDate === 'string' ? deployment.versionDate : createDesignerTimestamp(),
    },
  };
}

function renderDesignerDetailEditor(label, path, items, options = {}) {
  const icon = options.icon ? `<span class="prd-icon">${escapeHtml(options.icon)}</span>` : '';
  const help = options.help ? renderPrdHelp(options.help) : '';
  const normalized = Array.isArray(items) ? items.map((item) => normalizeDesignerDetailEntry(item)) : [];
  return `
    <div class="prd-list-editor">
      <div class="prd-list-editor-header">
        <h4>${icon}${escapeHtml(label)} ${help}</h4>
        <button type="button" class="btn btn-small btn-secondary" data-designer-add-list="${escapeAttr(path)}">Add</button>
      </div>
      <div class="prd-list-editor-items">
        ${normalized.length ? normalized.map((item, index) => `
          <article class="prd-list-editor-item">
            <div class="prd-list-editor-item-header">
              <strong>${escapeHtml(item.title || `${label} ${index + 1}`)}</strong>
              <button type="button" class="btn btn-small btn-ghost" data-designer-remove-list="${escapeAttr(path)}" data-designer-index="${index}">Remove</button>
            </div>
            <div class="prd-editor-grid">
              <label class="field">
                <span>Title</span>
                <input type="text" data-designer-field="${escapeAttr(`${path}.${index}.title`)}" value="${escapeAttr(item.title || '')}" placeholder="${escapeAttr(options.titlePlaceholder || 'Title')}" />
              </label>
              <label class="field prd-editor-grid-full">
                <span>Description</span>
                <textarea rows="4" data-designer-field="${escapeAttr(`${path}.${index}.description`)}" placeholder="${escapeAttr(options.descriptionPlaceholder || 'Description')}">${escapeHtml(item.description || '')}</textarea>
              </label>
            </div>
            <div class="workspace-doc-inline-note">Updated ${escapeHtml(formatPrdDateLabel(item.versionDate))}</div>
          </article>
        `).join('') : '<div class="workspace-doc-empty">No entries yet.</div>'}
      </div>
    </div>
  `;
}

function renderArchitectureConnectionEditor(items) {
  const normalized = Array.isArray(items) ? items.map((item) => normalizeArchitectureConnectionEntry(item)) : [];
  return `
    <div class="prd-list-editor">
      <div class="prd-list-editor-header">
        <h4><span class="prd-icon">MAP</span>Component Connections ${renderPrdHelp('Connect components and integrations so the architecture view can generate a system map and Mermaid flowchart.')}</h4>
        <button type="button" class="btn btn-small btn-secondary" data-architecture-add-connection>Add</button>
      </div>
      <div class="prd-list-editor-items">
        ${normalized.length ? normalized.map((item, index) => `
          <article class="prd-list-editor-item">
            <div class="prd-list-editor-item-header">
              <strong>${escapeHtml(item.source || item.target ? `${item.source || 'Unknown source'} -> ${item.target || 'Unknown target'}` : `Connection ${index + 1}`)}</strong>
              <button type="button" class="btn btn-small btn-ghost" data-architecture-remove-connection="${index}">Remove</button>
            </div>
            <div class="prd-editor-grid">
              <label class="field">
                <span>Source</span>
                <input type="text" data-architecture-connection-field="componentConnections.${index}.source" value="${escapeAttr(item.source || '')}" placeholder="Desktop App" />
              </label>
              <label class="field">
                <span>Target</span>
                <input type="text" data-architecture-connection-field="componentConnections.${index}.target" value="${escapeAttr(item.target || '')}" placeholder="Local API" />
              </label>
              <label class="field prd-editor-grid-full">
                <span>Connection Label</span>
                <input type="text" data-architecture-connection-field="componentConnections.${index}.label" value="${escapeAttr(item.label || '')}" placeholder="Serves, syncs, persists, invokes..." />
              </label>
            </div>
            <div class="workspace-doc-inline-note">Updated ${escapeHtml(formatPrdDateLabel(item.versionDate))}</div>
          </article>
        `).join('') : '<div class="workspace-doc-empty">No component connections defined yet.</div>'}
      </div>
    </div>
  `;
}

function encodeSchemaReferenceValue(entityId, fieldId) {
  return entityId && fieldId ? `${entityId}::${fieldId}` : '';
}

function decodeSchemaReferenceValue(value) {
  const [entityId, fieldId] = String(value || '').split('::');
  return {
    entityId: entityId || '',
    fieldId: fieldId || '',
  };
}

function renderSchemaSelectOptions(options, selectedValue = '') {
  return options.map((option) => `
    <option value="${escapeAttr(option.value)}"${String(option.value) === String(selectedValue) ? ' selected' : ''}>${escapeHtml(option.label)}</option>
  `).join('');
}

function getDatabaseSchemaEntityOptions(schemaModel) {
  return [
    { value: '', label: 'Select entity' },
    ...schemaModel.entities.map((entity) => ({
      value: entity.id,
      label: entity.name || entity.id || 'Unnamed entity',
    })),
  ];
}

function getDatabaseSchemaFieldReferenceOptions(schemaModel) {
  const options = [{ value: '', label: 'Select field' }];
  schemaModel.entities.forEach((entity) => {
    const entityLabel = entity.name || entity.id || 'Unnamed entity';
    (Array.isArray(entity.fields) ? entity.fields : []).forEach((field) => {
      const fieldLabel = field.name || field.id || 'field';
      options.push({
        value: encodeSchemaReferenceValue(entity.id, field.id || field.name),
        label: `${entityLabel}.${fieldLabel}`,
      });
    });
  });
  return options;
}

function renderDatabaseSchemaEntityEditor(schemaModel) {
  return `
    <div class="prd-list-editor">
      <div class="prd-list-editor-header">
        <h4><span class="prd-icon">ENT</span>Entities ${renderPrdHelp('Define the schema entities that exist in this software project and the fields each one owns.')}</h4>
        <button type="button" class="btn btn-small btn-secondary" data-schema-add-entity>Add Entity</button>
      </div>
      <div class="prd-list-editor-items">
        ${schemaModel.entities.length ? schemaModel.entities.map((entity, entityIndex) => `
          <article class="prd-list-editor-item schema-entity-editor">
            <div class="prd-list-editor-item-header">
              <strong>${escapeHtml(entity.name || entity.id || `Entity ${entityIndex + 1}`)}</strong>
              <button type="button" class="btn btn-small btn-ghost" data-schema-remove-entity="${entityIndex}">Remove</button>
            </div>
            <div class="prd-editor-grid">
              <label class="field">
                <span>Entity Name</span>
                <input type="text" data-schema-entity-field="${entityIndex}.name" value="${escapeAttr(entity.name || '')}" placeholder="projects" />
              </label>
              <label class="field">
                <span>Kind</span>
                <select data-schema-entity-field="${entityIndex}.kind">
                  ${renderSchemaSelectOptions([
                    { value: 'table', label: 'Table' },
                    { value: 'view', label: 'View' },
                    { value: 'join_table', label: 'Join Table' },
                    { value: 'lookup', label: 'Lookup' },
                  ], entity.kind)}
                </select>
              </label>
              <label class="field">
                <span>Status</span>
                <select data-schema-entity-field="${entityIndex}.status">
                  ${renderSchemaSelectOptions([
                    { value: 'draft', label: 'Draft' },
                    { value: 'observed', label: 'Observed' },
                    { value: 'proposed', label: 'Proposed' },
                    { value: 'active', label: 'Active' },
                    { value: 'archived', label: 'Archived' },
                  ], entity.status)}
                </select>
              </label>
              <label class="field prd-editor-grid-full">
                <span>Notes</span>
                <textarea rows="3" data-schema-entity-field="${entityIndex}.notes" placeholder="What responsibility does this entity own?">${escapeHtml(entity.notes || '')}</textarea>
              </label>
            </div>
            <div class="schema-fields-editor">
              <div class="prd-list-editor-header">
                <h5>Fields</h5>
                <button type="button" class="btn btn-small btn-secondary" data-schema-add-field="${entityIndex}">Add Field</button>
              </div>
              ${entity.fields.length ? entity.fields.map((field, fieldIndex) => `
                <div class="schema-field-row">
                  <div class="schema-field-row-header">
                    <strong>${escapeHtml(field.name || field.id || `Field ${fieldIndex + 1}`)}</strong>
                    <button type="button" class="btn btn-small btn-ghost" data-schema-remove-field="${entityIndex}.${fieldIndex}">Remove</button>
                  </div>
                  <div class="prd-editor-grid">
                    <label class="field">
                      <span>Field Name</span>
                      <input type="text" data-schema-column-field="${entityIndex}.${fieldIndex}.name" value="${escapeAttr(field.name || '')}" placeholder="id" />
                    </label>
                    <label class="field">
                      <span>Type</span>
                      <input type="text" data-schema-column-field="${entityIndex}.${fieldIndex}.type" value="${escapeAttr(field.type || '')}" placeholder="integer" />
                    </label>
                    <label class="field">
                      <span>Status</span>
                      <select data-schema-column-field="${entityIndex}.${fieldIndex}.status">
                        ${renderSchemaSelectOptions([
                          { value: 'draft', label: 'Draft' },
                          { value: 'observed', label: 'Observed' },
                          { value: 'proposed', label: 'Proposed' },
                          { value: 'active', label: 'Active' },
                          { value: 'archived', label: 'Archived' },
                        ], field.status)}
                      </select>
                    </label>
                    <label class="field">
                      <span>Default</span>
                      <input type="text" data-schema-column-field="${entityIndex}.${fieldIndex}.defaultValue" value="${escapeAttr(field.defaultValue || '')}" placeholder="CURRENT_TIMESTAMP" />
                    </label>
                    <label class="field">
                      <span>References</span>
                      <select data-schema-column-field="${entityIndex}.${fieldIndex}.reference">
                        ${renderSchemaSelectOptions(getDatabaseSchemaFieldReferenceOptions(schemaModel), encodeSchemaReferenceValue(field.referencesEntityId, field.referencesFieldId))}
                      </select>
                    </label>
                    <label class="field prd-editor-grid-full">
                      <span>Notes</span>
                      <textarea rows="2" data-schema-column-field="${entityIndex}.${fieldIndex}.notes" placeholder="What does this field store?">${escapeHtml(field.notes || '')}</textarea>
                    </label>
                  </div>
                  <div class="schema-field-flags">
                    <label><input type="checkbox" data-schema-column-field="${entityIndex}.${fieldIndex}.nullable" ${field.nullable ? 'checked' : ''} /> Nullable</label>
                    <label><input type="checkbox" data-schema-column-field="${entityIndex}.${fieldIndex}.primaryKey" ${field.primaryKey ? 'checked' : ''} /> Primary key</label>
                    <label><input type="checkbox" data-schema-column-field="${entityIndex}.${fieldIndex}.unique" ${field.unique ? 'checked' : ''} /> Unique</label>
                  </div>
                </div>
              `).join('') : '<div class="workspace-doc-empty">No fields defined yet.</div>'}
            </div>
          </article>
        `).join('') : '<div class="workspace-doc-empty">No entities defined yet.</div>'}
      </div>
    </div>
  `;
}

function renderDatabaseSchemaRelationshipEditor(schemaModel) {
  const fieldOptions = getDatabaseSchemaFieldReferenceOptions(schemaModel);
  return `
    <div class="prd-list-editor">
      <div class="prd-list-editor-header">
        <h4><span class="prd-icon">REL</span>Relationships ${renderPrdHelp('Connect entity fields so the generated DBML and Mermaid diagrams can describe how the data model joins together.')}</h4>
        <button type="button" class="btn btn-small btn-secondary" data-schema-add-relationship>Add Relationship</button>
      </div>
      <div class="prd-list-editor-items">
        ${schemaModel.relationships.length ? schemaModel.relationships.map((relationship, index) => `
          <article class="prd-list-editor-item">
            <div class="prd-list-editor-item-header">
              <strong>${escapeHtml(relationship.id || `Relationship ${index + 1}`)}</strong>
              <button type="button" class="btn btn-small btn-ghost" data-schema-remove-relationship="${index}">Remove</button>
            </div>
            <div class="prd-editor-grid">
              <label class="field">
                <span>ID</span>
                <input type="text" data-schema-relationship-field="${index}.id" value="${escapeAttr(relationship.id || '')}" placeholder="rel_projects_tasks" />
              </label>
              <label class="field">
                <span>From Field</span>
                <select data-schema-relationship-field="${index}.fromRef">
                  ${renderSchemaSelectOptions(fieldOptions, encodeSchemaReferenceValue(relationship.fromEntityId, relationship.fromFieldId))}
                </select>
              </label>
              <label class="field">
                <span>To Field</span>
                <select data-schema-relationship-field="${index}.toRef">
                  ${renderSchemaSelectOptions(fieldOptions, encodeSchemaReferenceValue(relationship.toEntityId, relationship.toFieldId))}
                </select>
              </label>
              <label class="field">
                <span>Cardinality</span>
                <select data-schema-relationship-field="${index}.cardinality">
                  ${renderSchemaSelectOptions([
                    { value: 'one-to-many', label: 'One to many' },
                    { value: 'many-to-one', label: 'Many to one' },
                    { value: 'one-to-one', label: 'One to one' },
                    { value: 'many-to-many', label: 'Many to many' },
                  ], relationship.cardinality)}
                </select>
              </label>
              <label class="field">
                <span>Status</span>
                <select data-schema-relationship-field="${index}.status">
                  ${renderSchemaSelectOptions([
                    { value: 'draft', label: 'Draft' },
                    { value: 'observed', label: 'Observed' },
                    { value: 'proposed', label: 'Proposed' },
                    { value: 'active', label: 'Active' },
                    { value: 'archived', label: 'Archived' },
                  ], relationship.status)}
                </select>
              </label>
              <label class="field prd-editor-grid-full">
                <span>Notes</span>
                <textarea rows="3" data-schema-relationship-field="${index}.notes" placeholder="Why does this relationship exist?">${escapeHtml(relationship.notes || '')}</textarea>
              </label>
            </div>
          </article>
        `).join('') : '<div class="workspace-doc-empty">No relationships defined yet.</div>'}
      </div>
    </div>
  `;
}

function renderDatabaseSchemaIndexEditor(schemaModel) {
  return `
    <div class="prd-list-editor">
      <div class="prd-list-editor-header">
        <h4><span class="prd-icon">IDX</span>Indexes ${renderPrdHelp('Capture lookup paths and performance-oriented index decisions tied to the schema model.')}</h4>
        <button type="button" class="btn btn-small btn-secondary" data-schema-add-index>Add Index</button>
      </div>
      <div class="prd-list-editor-items">
        ${schemaModel.indexes.length ? schemaModel.indexes.map((indexEntry, index) => `
          <article class="prd-list-editor-item">
            <div class="prd-list-editor-item-header">
              <strong>${escapeHtml(indexEntry.name || indexEntry.id || `Index ${index + 1}`)}</strong>
              <button type="button" class="btn btn-small btn-ghost" data-schema-remove-index="${index}">Remove</button>
            </div>
            <div class="prd-editor-grid">
              <label class="field">
                <span>Name</span>
                <input type="text" data-schema-index-field="${index}.name" value="${escapeAttr(indexEntry.name || '')}" placeholder="idx_tasks_status" />
              </label>
              <label class="field">
                <span>Entity</span>
                <select data-schema-index-field="${index}.entityId">
                  ${renderSchemaSelectOptions(getDatabaseSchemaEntityOptions(schemaModel), indexEntry.entityId)}
                </select>
              </label>
              <label class="field">
                <span>Fields</span>
                <input type="text" data-schema-index-field="${index}.fields" value="${escapeAttr((indexEntry.fields || []).join(', '))}" placeholder="status, due_date" />
              </label>
              <label class="field">
                <span>Status</span>
                <select data-schema-index-field="${index}.status">
                  ${renderSchemaSelectOptions([
                    { value: 'draft', label: 'Draft' },
                    { value: 'observed', label: 'Observed' },
                    { value: 'proposed', label: 'Proposed' },
                    { value: 'active', label: 'Active' },
                    { value: 'archived', label: 'Archived' },
                  ], indexEntry.status)}
                </select>
              </label>
              <label class="field prd-editor-grid-full">
                <span>Notes</span>
                <textarea rows="3" data-schema-index-field="${index}.notes" placeholder="Why is this index needed?">${escapeHtml(indexEntry.notes || '')}</textarea>
              </label>
            </div>
            <div class="schema-field-flags">
              <label><input type="checkbox" data-schema-index-field="${index}.unique" ${indexEntry.unique ? 'checked' : ''} /> Unique index</label>
            </div>
          </article>
        `).join('') : '<div class="workspace-doc-empty">No indexes defined yet.</div>'}
      </div>
    </div>
  `;
}

function renderDatabaseSchemaConstraintEditor(schemaModel) {
  return `
    <div class="prd-list-editor">
      <div class="prd-list-editor-header">
        <h4><span class="prd-icon">CONS</span>Constraints ${renderPrdHelp('Capture integrity rules that should hold true regardless of implementation details.')}</h4>
        <button type="button" class="btn btn-small btn-secondary" data-schema-add-constraint>Add Constraint</button>
      </div>
      <div class="prd-list-editor-items">
        ${schemaModel.constraints.length ? schemaModel.constraints.map((constraint, index) => `
          <article class="prd-list-editor-item">
            <div class="prd-list-editor-item-header">
              <strong>${escapeHtml(constraint.name || constraint.id || `Constraint ${index + 1}`)}</strong>
              <button type="button" class="btn btn-small btn-ghost" data-schema-remove-constraint="${index}">Remove</button>
            </div>
            <div class="prd-editor-grid">
              <label class="field">
                <span>Name</span>
                <input type="text" data-schema-constraint-field="${index}.name" value="${escapeAttr(constraint.name || '')}" placeholder="chk_tasks_status" />
              </label>
              <label class="field">
                <span>Entity</span>
                <select data-schema-constraint-field="${index}.entityId">
                  ${renderSchemaSelectOptions(getDatabaseSchemaEntityOptions(schemaModel), constraint.entityId)}
                </select>
              </label>
              <label class="field">
                <span>Type</span>
                <select data-schema-constraint-field="${index}.type">
                  ${renderSchemaSelectOptions([
                    { value: 'check', label: 'Check' },
                    { value: 'foreign_key', label: 'Foreign key' },
                    { value: 'unique', label: 'Unique' },
                    { value: 'not_null', label: 'Not null' },
                  ], constraint.type)}
                </select>
              </label>
              <label class="field">
                <span>Status</span>
                <select data-schema-constraint-field="${index}.status">
                  ${renderSchemaSelectOptions([
                    { value: 'draft', label: 'Draft' },
                    { value: 'observed', label: 'Observed' },
                    { value: 'proposed', label: 'Proposed' },
                    { value: 'active', label: 'Active' },
                    { value: 'archived', label: 'Archived' },
                  ], constraint.status)}
                </select>
              </label>
              <label class="field prd-editor-grid-full">
                <span>Definition</span>
                <textarea rows="3" data-schema-constraint-field="${index}.definition" placeholder="status IN ('todo', 'done')">${escapeHtml(constraint.definition || '')}</textarea>
              </label>
              <label class="field prd-editor-grid-full">
                <span>Notes</span>
                <textarea rows="2" data-schema-constraint-field="${index}.notes" placeholder="Why does this constraint matter?">${escapeHtml(constraint.notes || '')}</textarea>
              </label>
            </div>
          </article>
        `).join('') : '<div class="workspace-doc-empty">No constraints defined yet.</div>'}
      </div>
    </div>
  `;
}

function syncArchitectureStateFromBuilder(container = el.moduleDesignerSurface) {
  const state = normalizeArchitectureEditorState(structuredClone(getArchitectureState()));
  container.querySelectorAll('[data-architecture-field]').forEach((node) => {
    const fieldPath = node.dataset.architectureField || '';
    if (!fieldPath) return;
    const value = node.value || '';
    if (fieldPath === 'overview.systemPurpose') state.overview.systemPurpose = value;
    else if (fieldPath === 'overview.architecturalVision') state.overview.architecturalVision = value;
    else if (fieldPath === 'overview.architecturalStyle') state.overview.architecturalStyle = value;
    else if (fieldPath === 'deployment.runtimeTopology') state.deployment.runtimeTopology = value;
    else if (fieldPath === 'deployment.environmentNotes') state.deployment.environmentNotes = value;
  });
  state.overview.versionDate = createDesignerTimestamp();
  state.deployment.versionDate = createDesignerTimestamp();
  container.querySelectorAll('[data-designer-field]').forEach((node) => {
    const [listKey, indexValue, property] = String(node.dataset.designerField || '').split('.');
    const index = Number(indexValue);
    if (!listKey || !property || !Array.isArray(state[listKey]) || !Number.isFinite(index) || !state[listKey][index]) return;
    state[listKey][index] = normalizeDesignerDetailEntry(state[listKey][index]);
    state[listKey][index][property] = node.value || '';
    state[listKey][index].versionDate = createDesignerTimestamp();
  });
  container.querySelectorAll('[data-architecture-connection-field]').forEach((node) => {
    const [listKey, indexValue, property] = String(node.dataset.architectureConnectionField || '').split('.');
    const index = Number(indexValue);
    if (listKey !== 'componentConnections' || !property || !Array.isArray(state.componentConnections) || !Number.isFinite(index) || !state.componentConnections[index]) return;
    state.componentConnections[index] = normalizeArchitectureConnectionEntry(state.componentConnections[index]);
    state.componentConnections[index][property] = node.value || '';
    state.componentConnections[index].versionDate = createDesignerTimestamp();
  });
  phase5State.architecture.editorState = state;
  return state;
}

function syncDatabaseSchemaStateFromBuilder(container = el.moduleDesignerSurface) {
  const state = structuredClone(getDatabaseSchemaState());
  const schemaModel = normalizeDatabaseSchemaModel(state.schemaModel, state);
  container.querySelectorAll('[data-schema-field]').forEach((node) => {
    const fieldPath = node.dataset.schemaField || '';
    if (!fieldPath) return;
    const value = node.value || '';
    if (fieldPath === 'overview.purpose') state.overview.purpose = value;
    else if (fieldPath === 'overview.storageStrategy') state.overview.storageStrategy = value;
  });
  state.overview.versionDate = createDesignerTimestamp();
  container.querySelectorAll('[data-schema-entity-field]').forEach((node) => {
    const [entityIndexValue, property] = String(node.dataset.schemaEntityField || '').split('.');
    const entityIndex = Number(entityIndexValue);
    if (!Number.isFinite(entityIndex) || !schemaModel.entities[entityIndex] || !property) return;
    schemaModel.entities[entityIndex][property] = node.value || '';
  });
  container.querySelectorAll('[data-schema-column-field]').forEach((node) => {
    const [entityIndexValue, fieldIndexValue, property] = String(node.dataset.schemaColumnField || '').split('.');
    const entityIndex = Number(entityIndexValue);
    const fieldIndex = Number(fieldIndexValue);
    const entity = schemaModel.entities[entityIndex];
    const field = entity && Array.isArray(entity.fields) ? entity.fields[fieldIndex] : null;
    if (!entity || !field || !property) return;
    if (property === 'nullable' || property === 'primaryKey' || property === 'unique') {
      field[property] = Boolean(node.checked);
      return;
    }
    if (property === 'reference') {
      const reference = decodeSchemaReferenceValue(node.value || '');
      field.referencesEntityId = reference.entityId;
      field.referencesFieldId = reference.fieldId;
      return;
    }
    field[property] = node.value || '';
  });
  container.querySelectorAll('[data-schema-relationship-field]').forEach((node) => {
    const [relationshipIndexValue, property] = String(node.dataset.schemaRelationshipField || '').split('.');
    const relationshipIndex = Number(relationshipIndexValue);
    const relationship = schemaModel.relationships[relationshipIndex];
    if (!relationship || !property) return;
    if (property === 'fromRef' || property === 'toRef') {
      const reference = decodeSchemaReferenceValue(node.value || '');
      if (property === 'fromRef') {
        relationship.fromEntityId = reference.entityId;
        relationship.fromFieldId = reference.fieldId;
      } else {
        relationship.toEntityId = reference.entityId;
        relationship.toFieldId = reference.fieldId;
      }
      return;
    }
    relationship[property] = node.value || '';
  });
  container.querySelectorAll('[data-schema-index-field]').forEach((node) => {
    const [indexValue, property] = String(node.dataset.schemaIndexField || '').split('.');
    const itemIndex = Number(indexValue);
    const indexEntry = schemaModel.indexes[itemIndex];
    if (!indexEntry || !property) return;
    if (property === 'unique') {
      indexEntry.unique = Boolean(node.checked);
      return;
    }
    if (property === 'fields') {
      indexEntry.fields = String(node.value || '').split(',').map((value) => value.trim()).filter(Boolean);
      return;
    }
    indexEntry[property] = node.value || '';
  });
  container.querySelectorAll('[data-schema-constraint-field]').forEach((node) => {
    const [indexValue, property] = String(node.dataset.schemaConstraintField || '').split('.');
    const itemIndex = Number(indexValue);
    const constraint = schemaModel.constraints[itemIndex];
    if (!constraint || !property) return;
    constraint[property] = node.value || '';
  });
  container.querySelectorAll('[data-designer-field]').forEach((node) => {
    const [listKey, indexValue, property] = String(node.dataset.designerField || '').split('.');
    const index = Number(indexValue);
    if (!listKey || !property || !Array.isArray(state[listKey]) || !Number.isFinite(index) || !state[listKey][index]) return;
    state[listKey][index] = normalizeDesignerDetailEntry(state[listKey][index]);
    state[listKey][index][property] = node.value || '';
    state[listKey][index].versionDate = createDesignerTimestamp();
  });
  state.schemaModel = schemaModel;
  const derivedDetails = buildSchemaDetailCollectionsFromModel(schemaModel);
  state.entities = derivedDetails.entities;
  state.relationships = derivedDetails.relationships;
  state.indexes = derivedDetails.indexes;
  state.constraints = derivedDetails.constraints;
  state.dbml = buildClientDatabaseSchemaDbml(taskState.project, state);
  phase5State.databaseSchema.editorState = state;
  return state;
}

function mutateArchitectureList(path, mode, index = -1) {
  const state = syncArchitectureStateFromBuilder();
  const list = Array.isArray(state[path]) ? state[path] : [];
  if (mode === 'add') list.push(createDesignerDetailEntry());
  if (mode === 'remove' && index >= 0 && index < list.length) list.splice(index, 1);
  state[path] = list;
  phase5State.architecture.editorState = state;
}

function mutateArchitectureConnectionList(mode, index = -1) {
  const state = syncArchitectureStateFromBuilder();
  const list = Array.isArray(state.componentConnections) ? state.componentConnections : [];
  if (mode === 'add') list.push(normalizeArchitectureConnectionEntry());
  if (mode === 'remove' && index >= 0 && index < list.length) list.splice(index, 1);
  state.componentConnections = list;
  phase5State.architecture.editorState = state;
}

function mutateDatabaseSchemaList(path, mode, index = -1) {
  const state = syncDatabaseSchemaStateFromBuilder();
  const list = Array.isArray(state[path]) ? state[path] : [];
  if (mode === 'add') list.push(createDesignerDetailEntry());
  if (mode === 'remove' && index >= 0 && index < list.length) list.splice(index, 1);
  state[path] = list;
  phase5State.databaseSchema.editorState = state;
}

function mutateDatabaseSchemaEntityList(mode, index = -1) {
  const state = syncDatabaseSchemaStateFromBuilder();
  const schemaModel = normalizeDatabaseSchemaModel(state.schemaModel, state);
  if (mode === 'add') schemaModel.entities.push(createDatabaseSchemaEntity());
  if (mode === 'remove' && index >= 0 && index < schemaModel.entities.length) schemaModel.entities.splice(index, 1);
  state.schemaModel = schemaModel;
  phase5State.databaseSchema.editorState = normalizeDatabaseSchemaEditorState(state, taskState.project);
}

function mutateDatabaseSchemaFieldList(entityIndex, mode, fieldIndex = -1) {
  const state = syncDatabaseSchemaStateFromBuilder();
  const schemaModel = normalizeDatabaseSchemaModel(state.schemaModel, state);
  const entity = schemaModel.entities[entityIndex];
  if (!entity) return;
  if (mode === 'add') entity.fields.push(createDatabaseSchemaField());
  if (mode === 'remove' && fieldIndex >= 0 && fieldIndex < entity.fields.length) entity.fields.splice(fieldIndex, 1);
  if (!entity.fields.length) entity.fields.push(createDatabaseSchemaField());
  state.schemaModel = schemaModel;
  phase5State.databaseSchema.editorState = normalizeDatabaseSchemaEditorState(state, taskState.project);
}

function mutateDatabaseSchemaRelationshipList(mode, index = -1) {
  const state = syncDatabaseSchemaStateFromBuilder();
  const schemaModel = normalizeDatabaseSchemaModel(state.schemaModel, state);
  if (mode === 'add') schemaModel.relationships.push(createDatabaseSchemaRelationship());
  if (mode === 'remove' && index >= 0 && index < schemaModel.relationships.length) schemaModel.relationships.splice(index, 1);
  state.schemaModel = schemaModel;
  phase5State.databaseSchema.editorState = normalizeDatabaseSchemaEditorState(state, taskState.project);
}

function mutateDatabaseSchemaIndexList(mode, index = -1) {
  const state = syncDatabaseSchemaStateFromBuilder();
  const schemaModel = normalizeDatabaseSchemaModel(state.schemaModel, state);
  if (mode === 'add') schemaModel.indexes.push(createDatabaseSchemaIndex());
  if (mode === 'remove' && index >= 0 && index < schemaModel.indexes.length) schemaModel.indexes.splice(index, 1);
  state.schemaModel = schemaModel;
  phase5State.databaseSchema.editorState = normalizeDatabaseSchemaEditorState(state, taskState.project);
}

function mutateDatabaseSchemaConstraintList(mode, index = -1) {
  const state = syncDatabaseSchemaStateFromBuilder();
  const schemaModel = normalizeDatabaseSchemaModel(state.schemaModel, state);
  if (mode === 'add') schemaModel.constraints.push(createDatabaseSchemaConstraint());
  if (mode === 'remove' && index >= 0 && index < schemaModel.constraints.length) schemaModel.constraints.splice(index, 1);
  state.schemaModel = schemaModel;
  phase5State.databaseSchema.editorState = normalizeDatabaseSchemaEditorState(state, taskState.project);
}

function escapeMermaidLabel(value) {
  return String(value || '').replace(/"/g, '\\"');
}

function toMermaidNodeId(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'node';
}

function buildClientArchitectureGeneratedMermaid(project, state) {
  const normalized = normalizeArchitectureEditorState(state);
  const nodes = new Map();
  const lines = ['flowchart TD'];
  const addNode = (label, prefix = 'node') => {
    const trimmed = String(label || '').trim();
    if (!trimmed) return null;
    if (!nodes.has(trimmed)) {
      const nodeId = `${prefix}_${toMermaidNodeId(trimmed)}`;
      nodes.set(trimmed, nodeId);
      lines.push(`  ${nodeId}["${escapeMermaidLabel(trimmed)}"]`);
    }
    return nodes.get(trimmed);
  };
  const systemLabel = project && project.name ? project.name : 'System';
  addNode(systemLabel, 'system');
  normalized.components.forEach((item) => addNode(item.title, 'component'));
  normalized.integrations.forEach((item) => addNode(item.title, 'integration'));
  normalized.componentConnections.forEach((connection) => {
    const sourceId = addNode(connection.source, 'component');
    const targetId = addNode(connection.target, 'component');
    if (!sourceId || !targetId) return;
    lines.push(`  ${sourceId} -->|${escapeMermaidLabel(connection.label || 'flows to')}| ${targetId}`);
  });
  if (lines.length === 1) {
    const usersId = addNode('Users', 'actor');
    const systemId = addNode(systemLabel, 'system');
    if (usersId && systemId) lines.push(`  ${usersId} --> ${systemId}`);
  }
  return [...new Set(lines)].join('\n');
}

function buildClientArchitectureMarkdown(project, state) {
  const renderList = (items, emptyLabel) => {
    const normalized = (Array.isArray(items) ? items : []).map((item) => normalizeDesignerDetailEntry(item)).filter((item) => item.title || item.description);
    return normalized.length
      ? normalized.map((item, index) => [
          `### ${index + 1}. ${item.title || 'Untitled entry'}`,
          '',
          item.description || '',
          item.versionDate ? `- Version Date: ${new Date(item.versionDate).toISOString().slice(0, 10)}` : '',
          '',
        ].filter(Boolean).join('\n')).join('\n')
      : emptyLabel;
  };
  const renderConnections = (items, emptyLabel) => {
    const normalized = (Array.isArray(items) ? items : []).map((item) => normalizeArchitectureConnectionEntry(item)).filter((item) => item.source || item.target || item.label);
    return normalized.length
      ? normalized.map((item, index) => [
          `### ${index + 1}. ${item.source || 'Unknown source'} -> ${item.target || 'Unknown target'}${item.label ? ` (${item.label})` : ''}`,
          '',
          item.versionDate ? `- Version Date: ${new Date(item.versionDate).toISOString().slice(0, 10)}` : '',
          '',
        ].filter(Boolean).join('\n')).join('\n')
      : emptyLabel;
  };
  const normalized = normalizeArchitectureEditorState(state);
  return [
    `# Architecture: ${project ? project.name : 'Project'}`,
    '',
    '## 1. System Overview',
    '',
    '### 1.1 System Purpose',
    '',
    normalized.overview.systemPurpose || 'Pending system purpose.',
    '',
    '### 1.2 Architectural Vision',
    '',
    normalized.overview.architecturalVision || 'Pending architectural vision.',
    '',
    '### 1.3 Architectural Style',
    '',
    normalized.overview.architecturalStyle || 'Pending architectural style.',
    '',
    '## 2. System Map',
    '',
    '### 2.1 Core Components',
    '',
    renderList(normalized.components, 'No components defined yet.'),
    '',
    '### 2.2 Component Connections',
    '',
    renderConnections(normalized.componentConnections, 'No component connections defined yet.'),
    '## 3. Boundaries and Responsibilities',
    '',
    renderList(normalized.boundaries, 'No boundaries defined yet.'),
    '## 4. Integration Points',
    '',
    renderList(normalized.integrations, 'No integrations defined yet.'),
    '## 5. Runtime Scenarios',
    '',
    renderList(normalized.runtimeScenarios, 'No runtime scenarios defined yet.'),
    '## 6. Operational Concerns',
    '',
    renderList(normalized.operationalConcerns, 'No operational concerns defined yet.'),
    '## 7. Architectural Decisions',
    '',
    renderList(normalized.decisions, 'No architectural decisions captured yet.'),
    '## 8. Constraints and Tradeoffs',
    '',
    renderList(normalized.constraints, 'No constraints captured yet.'),
    '## 9. Runtime and Deployment',
    '',
    '### 9.1 Runtime Topology',
    '',
    normalized.deployment.runtimeTopology || 'Pending runtime topology.',
    '',
    '### 9.2 Environment Notes',
    '',
    normalized.deployment.environmentNotes || 'Pending environment notes.',
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n').trim();
}

function buildClientDatabaseSchemaGeneratedMermaid(project, state) {
  const schemaModel = normalizeDatabaseSchemaModel(state && state.schemaModel, state);
  const lines = ['erDiagram'];
  if (!schemaModel.entities.length) {
    lines.push('  PROJECT ||--o{ ENTITY : contains');
    lines.push('  ENTITY ||--o{ FIELD : defines');
    return lines.join('\n');
  }
  const entityLabelById = new Map();
  schemaModel.entities.forEach((entity) => {
    const label = toMermaidNodeId(entity.name || entity.id || 'entity').toUpperCase();
    entityLabelById.set(entity.id, label);
    lines.push(`  ${label} {`);
    (Array.isArray(entity.fields) ? entity.fields : []).forEach((field) => {
      const facts = [];
      if (field.primaryKey) facts.push('PK');
      if (field.referencesEntityId && field.referencesFieldId) facts.push('FK');
      if (field.unique) facts.push('UK');
      const suffix = facts.length ? ` ${facts.join(', ')}` : '';
      lines.push(`    ${field.type || 'text'} ${toMermaidNodeId(field.name || field.id || 'field')}${suffix}`);
    });
    lines.push('  }');
  });

  const cardinalityMap = {
    'one-to-many': '||--o{',
    'many-to-one': '}o--||',
    'one-to-one': '||--||',
    'many-to-many': '}o--o{',
  };
  schemaModel.relationships.forEach((relationship) => {
    const fromEntity = entityLabelById.get(relationship.fromEntityId);
    const toEntity = entityLabelById.get(relationship.toEntityId);
    if (!fromEntity || !toEntity) return;
    const connector = cardinalityMap[relationship.cardinality] || '||--o{';
    const label = [relationship.fromFieldId, relationship.toFieldId].filter(Boolean).join('_to_') || relationship.id || 'relates';
    lines.push(`  ${fromEntity} ${connector} ${toEntity} : ${toMermaidNodeId(label)}`);
  });
  return lines.join('\n');
}

function buildClientDatabaseSchemaMarkdown(project, state) {
  const renderList = (items, emptyLabel) => {
    const normalized = (Array.isArray(items) ? items : []).map((item) => normalizeDesignerDetailEntry(item)).filter((item) => item.title || item.description);
    return normalized.length
      ? normalized.map((item, index) => [
          `### ${index + 1}. ${item.title || 'Untitled entry'}`,
          '',
          item.description || '',
          item.versionDate ? `- Version Date: ${new Date(item.versionDate).toISOString().slice(0, 10)}` : '',
          '',
        ].filter(Boolean).join('\n')).join('\n')
      : emptyLabel;
  };
  const schemaModel = normalizeDatabaseSchemaModel(state && state.schemaModel, state);
  const importSourceSummary = state.importSource
    ? [
        `- Source Type: ${state.importSource.sourceType || 'unknown'}`,
        `- Source Label: ${state.importSource.sourceLabel || 'unknown source'}`,
        `- Dialect: ${state.importSource.dialect || 'unknown'}`,
        `- Confidence: ${state.importSource.confidence || 'unknown'}`,
        state.importSource.observedAt ? `- Observed At: ${state.importSource.observedAt}` : '',
        state.importSource.schemaFingerprint ? `- Schema Fingerprint: ${state.importSource.schemaFingerprint}` : '',
      ].filter(Boolean).join('\n')
    : 'No import source metadata captured yet.';
  const entitySection = schemaModel.entities.length
    ? schemaModel.entities.map((entity, index) => [
        `### ${index + 1}. ${entity.name || entity.id || 'Unnamed entity'}${entity.kind ? ` (${entity.kind})` : ''}`,
        '',
        entity.notes || 'No entity notes captured yet.',
        '',
        entity.status ? `- Status: ${entity.status}` : '',
        '',
        '#### Fields',
        '',
        ...(Array.isArray(entity.fields) && entity.fields.length
          ? entity.fields.map((field) => {
              const facts = [
                `Type: ${field.type || 'text'}`,
                `Nullable: ${field.nullable ? 'yes' : 'no'}`,
                field.primaryKey ? 'Primary key' : '',
                field.unique ? 'Unique' : '',
                field.defaultValue ? `Default: ${field.defaultValue}` : '',
                field.referencesEntityId && field.referencesFieldId ? `References: ${field.referencesEntityId}.${field.referencesFieldId}` : '',
                field.status ? `Status: ${field.status}` : '',
              ].filter(Boolean);
              return `- \`${field.name || field.id || 'field'}\`${facts.length ? `: ${facts.join('; ')}` : ''}${field.notes ? ` (${field.notes})` : ''}`;
            })
          : ['- No fields defined yet.']),
        '',
      ].filter(Boolean).join('\n')).join('\n')
    : 'No entities defined yet.';

  const relationshipSection = schemaModel.relationships.length
    ? schemaModel.relationships.map((relationship, index) => [
        `### ${index + 1}. ${relationship.id || 'Relationship'}`,
        '',
        `- From: ${relationship.fromEntityId || '?'}${relationship.fromFieldId ? `.${relationship.fromFieldId}` : ''}`,
        `- To: ${relationship.toEntityId || '?'}${relationship.toFieldId ? `.${relationship.toFieldId}` : ''}`,
        relationship.cardinality ? `- Cardinality: ${relationship.cardinality}` : '',
        relationship.status ? `- Status: ${relationship.status}` : '',
        relationship.notes ? `- Notes: ${relationship.notes}` : '',
        '',
      ].filter(Boolean).join('\n')).join('\n')
    : 'No relationships defined yet.';

  const indexSection = schemaModel.indexes.length
    ? schemaModel.indexes.map((indexEntry, index) => [
        `### ${index + 1}. ${indexEntry.name || indexEntry.id || 'Unnamed index'}`,
        '',
        `- Entity: ${indexEntry.entityId || 'unknown'}`,
        Array.isArray(indexEntry.fields) && indexEntry.fields.length ? `- Fields: ${indexEntry.fields.join(', ')}` : '',
        `- Unique: ${indexEntry.unique ? 'yes' : 'no'}`,
        indexEntry.status ? `- Status: ${indexEntry.status}` : '',
        indexEntry.notes ? `- Notes: ${indexEntry.notes}` : '',
        '',
      ].filter(Boolean).join('\n')).join('\n')
    : 'No indexes defined yet.';

  const constraintSection = schemaModel.constraints.length
    ? schemaModel.constraints.map((constraint, index) => [
        `### ${index + 1}. ${constraint.name || constraint.id || 'Unnamed constraint'}`,
        '',
        `- Entity: ${constraint.entityId || 'unknown'}`,
        constraint.type ? `- Type: ${constraint.type}` : '',
        constraint.definition ? `- Definition: ${constraint.definition}` : '',
        constraint.status ? `- Status: ${constraint.status}` : '',
        constraint.notes ? `- Notes: ${constraint.notes}` : '',
        '',
      ].filter(Boolean).join('\n')).join('\n')
    : 'No constraints defined yet.';
  return [
    `# Database Schema: ${project ? project.name : 'Project'}`,
    '',
    '## 1. Schema Overview',
    '',
    '### 1.1 Purpose',
    '',
    state.overview.purpose || 'Pending schema purpose.',
    '',
    '### 1.2 Storage Strategy',
    '',
    state.overview.storageStrategy || 'Pending storage strategy.',
    '',
    '### 1.3 Import Source',
    '',
    importSourceSummary,
    '',
    '## 2. Entities',
    '',
    entitySection,
    '## 3. Relationships',
    '',
    relationshipSection,
    '## 4. Constraints',
    '',
    constraintSection,
    '## 5. Indexes',
    '',
    indexSection,
    '## 6. Migration Notes',
    '',
    renderList(state.migrations, 'No migration notes defined yet.'),
    '## 7. Open Questions',
    '',
    renderList(state.openQuestions, 'No open questions captured yet.'),
    '## 8. Source-of-Truth and Sync Rules',
    '',
    renderList(state.synchronizationRules, 'No source-of-truth rules defined yet.'),
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n').trim();
}

function buildClientDatabaseSchemaDbml(project, state) {
  const schemaModel = normalizeDatabaseSchemaModel(state && state.schemaModel, state);
  if (!schemaModel.entities.length && String(state.dbml || '').trim()) return String(state.dbml || '').trim();
  if (!schemaModel || !Array.isArray(schemaModel.entities) || !schemaModel.entities.length) {
    return [
      `Project "${String((project && project.name) || 'Project').replace(/"/g, '\\"')}" {`,
      '  database_type: "Generic"',
      '}',
      '',
      '// No schema entities defined yet.',
    ].join('\n');
  }

  const entityById = new Map(schemaModel.entities.map((entity) => [entity.id, entity]));
  const fieldByEntity = new Map(
    schemaModel.entities.map((entity) => [entity.id, new Map((Array.isArray(entity.fields) ? entity.fields : []).map((field) => [field.id || field.name, field]))])
  );
  const lines = [
    `Project "${String((project && project.name) || 'Project').replace(/"/g, '\\"')}" {`,
    '  database_type: "Generic"',
    '}',
    '',
  ];
  schemaModel.entities.forEach((entity) => {
    lines.push(`Table ${entity.name} {`);
    const fields = Array.isArray(entity.fields) ? entity.fields : [];
    if (!fields.length) {
      lines.push('  id text');
    } else {
      fields.forEach((field) => {
        const attributes = [];
        if (field.primaryKey) attributes.push('pk');
        if (field.unique) attributes.push('unique');
        if (field.nullable === false) attributes.push('not null');
        if (field.defaultValue !== undefined && field.defaultValue !== null && String(field.defaultValue).trim() !== '') {
          attributes.push(`default: ${String(field.defaultValue).trim()}`);
        }
        const suffix = attributes.length ? ` [${attributes.join(', ')}]` : '';
        lines.push(`  ${field.name} ${field.type || 'text'}${suffix}`);
      });
    }
    if (entity.notes) lines.push(`  Note: '${String(entity.notes).replace(/'/g, "\\'")}'`);
    lines.push('}');
    lines.push('');
  });
  (Array.isArray(schemaModel.relationships) ? schemaModel.relationships : []).forEach((relationship) => {
    const fromEntity = entityById.get(relationship.fromEntityId);
    const toEntity = entityById.get(relationship.toEntityId);
    if (!fromEntity || !toEntity) return;
    const fromField = fieldByEntity.get(fromEntity.id)?.get(relationship.fromFieldId) || { name: relationship.fromFieldId };
    const toField = fieldByEntity.get(toEntity.id)?.get(relationship.toFieldId) || { name: relationship.toFieldId };
    const operator = relationship.cardinality === 'one-to-many'
      ? '>'
      : relationship.cardinality === 'many-to-one'
        ? '<'
        : relationship.cardinality === 'one-to-one'
          ? '-'
          : '>';
    lines.push(`Ref: ${fromEntity.name}.${fromField.name} ${operator} ${toEntity.name}.${toField.name}`);
  });
  return lines.join('\n').trim();
}

function renderModuleDependencyStatus(view, project = taskState.project) {
  const module = view && view.id ? getProjectModule(view.id, project) : null;
  const dependencies = module && Array.isArray(module.dependsOn) ? module.dependsOn : [];
  if (!dependencies.length) {
    return '<div class="workspace-doc-inline-note">This module has no prerequisite modules.</div>';
  }
  const items = dependencies.map((key) => {
    const dependency = getProjectModule(key, project);
    const label = dependency ? dependency.label : key;
    const state = dependency && dependency.enabled ? 'Connected' : 'Missing';
    return `<span>${escapeHtml(label)}: ${escapeHtml(state)}</span>`;
  }).join('');
  return `<div class="workspace-doc-inline-note workspace-doc-item-meta">${items}</div>`;
}

function refreshArchitectureMarkdownPreview(container = el.moduleDesignerSurface) {
  const state = syncArchitectureStateFromBuilder(container);
  const markdown = buildClientArchitectureMarkdown(taskState.project, state);
  if (phase5State.architecture) phase5State.architecture.markdown = markdown;
  const markdownPreview = container.querySelector('[data-architecture-markdown-preview]');
  const mermaidPreview = container.querySelector('[data-architecture-mermaid-preview]');
  const mermaidInput = container.querySelector('[data-architecture-mermaid]');
  if (phase5State.architecture) {
    phase5State.architecture.mermaid = mermaidInput && String(mermaidInput.value || '').trim()
      ? mermaidInput.value
      : buildClientArchitectureGeneratedMermaid(taskState.project, state);
  }
  renderMarkdownPreview(markdownPreview, markdown);
  renderMermaidPreview(mermaidPreview, phase5State.architecture && phase5State.architecture.mermaid);
}

function refreshDatabaseSchemaMarkdownPreview(container = el.moduleDesignerSurface) {
  const state = syncDatabaseSchemaStateFromBuilder(container);
  const markdown = buildClientDatabaseSchemaMarkdown(taskState.project, state);
  const dbml = buildClientDatabaseSchemaDbml(taskState.project, state);
  const mermaid = buildClientDatabaseSchemaGeneratedMermaid(taskState.project, state);
  if (phase5State.databaseSchema) phase5State.databaseSchema.markdown = markdown;
  if (phase5State.databaseSchema) phase5State.databaseSchema.dbml = dbml;
  if (phase5State.databaseSchema) phase5State.databaseSchema.mermaid = mermaid;
  const markdownPreview = container.querySelector('[data-schema-markdown-preview]');
  const mermaidPreview = container.querySelector('[data-schema-mermaid-preview]');
  const dbmlPreview = container.querySelector('[data-schema-dbml-preview]');
  const mermaidSource = container.querySelector('[data-schema-mermaid-source]');
  renderMarkdownPreview(markdownPreview, markdown);
  renderMarkdownPreview(dbmlPreview, dbml);
  renderMarkdownPreview(mermaidSource, mermaid);
  renderMermaidPreview(mermaidPreview, mermaid);
}

async function saveArchitectureDocument(container = el.moduleDesignerSurface) {
  if (!taskState.project) return;
  const state = syncArchitectureStateFromBuilder(container);
  const mermaidInput = container.querySelector('[data-architecture-mermaid]');
  const mermaid = mermaidInput && String(mermaidInput.value || '').trim()
    ? mermaidInput.value
    : buildClientArchitectureGeneratedMermaid(taskState.project, state);
  const result = await fetchJSON(`${API}/projects/${taskState.project.id}/architecture`, {
    method: 'PUT',
    body: JSON.stringify({
      markdown: buildClientArchitectureMarkdown(taskState.project, state),
      mermaid,
      editorState: state,
    }),
  });
  phase5State.architecture = result;
  renderModuleDesignerSurface();
}

async function saveDatabaseSchemaDocument(container = el.moduleDesignerSurface) {
  if (!taskState.project) return;
  const state = syncDatabaseSchemaStateFromBuilder(container);
  const dbml = buildClientDatabaseSchemaDbml(taskState.project, state);
  const mermaid = buildClientDatabaseSchemaGeneratedMermaid(taskState.project, state);
  const result = await fetchJSON(`${API}/projects/${taskState.project.id}/database-schema`, {
    method: 'PUT',
    body: JSON.stringify({
      markdown: buildClientDatabaseSchemaMarkdown(taskState.project, state),
      mermaid,
      dbml,
      editorState: state,
    }),
  });
  phase5State.databaseSchema = result;
  renderModuleDesignerSurface();
}

async function importDatabaseSchemaFragment(file) {
  if (!taskState.project || !file) return;
  const markdown = await file.text();
  const result = await fetchJSON(`${API}/projects/${taskState.project.id}/database-schema/import-fragment`, {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name || '',
      markdown,
    }),
  });
  phase5State.databaseSchema = result;
  renderModuleDesignerSurface();
}

function renderArchitectureDesignerSurface(view) {
  const state = getArchitectureState();
  const mermaid = phase5State.architecture && phase5State.architecture.mermaid
    ? phase5State.architecture.mermaid
    : buildClientArchitectureGeneratedMermaid(taskState.project, state);
  el.moduleDesignerSurface.innerHTML = `
    <article class="workspace-doc-card module-designer-hero">
      <div class="module-designer-kicker">Software Design Surface</div>
      <h3>${escapeHtml(view.label)}</h3>
      <p>${escapeHtml(view.description)}</p>
    </article>
    <div class="workspace-doc-layout">
      <div class="workspace-doc-main">
        <article class="workspace-doc-card">
          <div class="workspace-doc-sidebar-header">
            <h3>Architecture Designer</h3>
            <div class="workspace-doc-actions">
              <button type="button" class="btn btn-ghost" data-architecture-refresh>Refresh</button>
              <button type="button" class="btn btn-primary" data-architecture-save>Save</button>
            </div>
          </div>
          ${renderModuleDependencyStatus(view)}
          <div class="prd-editor-builder">
            <div class="prd-editor-section">
              <div class="prd-editor-section-header">
                <h4>System Overview ${renderPrdHelp('Describe the purpose of the system and the architectural direction it should follow.')}</h4>
                <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.overview.versionDate))}</span>
              </div>
              <label class="field">
                <span>System purpose</span>
                <textarea rows="4" data-architecture-field="overview.systemPurpose" placeholder="What problem does this system solve?">${escapeHtml(state.overview.systemPurpose || '')}</textarea>
              </label>
              <label class="field">
                <span>Architectural vision</span>
                <textarea rows="4" data-architecture-field="overview.architecturalVision" placeholder="How should the system be shaped at a high level?">${escapeHtml(state.overview.architecturalVision || '')}</textarea>
              </label>
              <label class="field">
                <span>Architectural style</span>
                <input type="text" data-architecture-field="overview.architecturalStyle" value="${escapeAttr(state.overview.architecturalStyle || '')}" placeholder="Local-first desktop app, service-oriented workspace, modular plugin architecture..." />
              </label>
            </div>
            <div class="prd-editor-section prd-editor-grid">
              ${renderDesignerDetailEditor('Core Components', 'components', state.components, { icon: 'CMP', help: 'Describe the major components or services in the system.', titlePlaceholder: 'Component name', descriptionPlaceholder: 'Responsibilities, boundaries, and interfaces.' })}
              ${renderArchitectureConnectionEditor(state.componentConnections)}
              ${renderDesignerDetailEditor('Boundaries and Responsibilities', 'boundaries', state.boundaries, { icon: 'BND', help: 'Capture ownership boundaries and which parts of the system each area is responsible for.', titlePlaceholder: 'Boundary name', descriptionPlaceholder: 'Describe the boundary and responsibility split.' })}
              ${renderDesignerDetailEditor('Integration Points', 'integrations', state.integrations, { icon: 'INT', help: 'Describe external services, plugins, APIs, or runtime integrations.', titlePlaceholder: 'Integration name', descriptionPlaceholder: 'Describe the interface and responsibility.' })}
              ${renderDesignerDetailEditor('Runtime Scenarios', 'runtimeScenarios', state.runtimeScenarios, { icon: 'RUN', help: 'Capture key end-to-end runtime scenarios that this architecture has to support.', titlePlaceholder: 'Scenario', descriptionPlaceholder: 'Describe the runtime path, participating components, and expectations.' })}
              ${renderDesignerDetailEditor('Operational Concerns', 'operationalConcerns', state.operationalConcerns, { icon: 'OPS', help: 'Capture migrations, logging, resilience, sync, deployment, support, and recovery concerns.', titlePlaceholder: 'Concern', descriptionPlaceholder: 'Describe the operational concern and expected handling.' })}
              ${renderDesignerDetailEditor('Architectural Decisions', 'decisions', state.decisions, { icon: 'DEC', help: 'Capture the major decisions the system is being designed around.', titlePlaceholder: 'Decision', descriptionPlaceholder: 'Describe the decision and why it matters.' })}
              ${renderDesignerDetailEditor('Constraints and Tradeoffs', 'constraints', state.constraints, { icon: 'CONS', help: 'Capture constraints, limits, and known tradeoffs.', titlePlaceholder: 'Constraint', descriptionPlaceholder: 'Describe the tradeoff or limitation.' })}
            </div>
            <div class="prd-editor-section">
              <div class="prd-editor-section-header">
                <h4>Runtime and Deployment ${renderPrdHelp('Describe how the system should run and any environment-specific notes.')}</h4>
                <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.deployment.versionDate))}</span>
              </div>
              <label class="field">
                <span>Runtime topology</span>
                <textarea rows="4" data-architecture-field="deployment.runtimeTopology" placeholder="How do the pieces run together?">${escapeHtml(state.deployment.runtimeTopology || '')}</textarea>
              </label>
              <label class="field">
                <span>Environment notes</span>
                <textarea rows="4" data-architecture-field="deployment.environmentNotes" placeholder="What environment-specific notes matter for this design?">${escapeHtml(state.deployment.environmentNotes || '')}</textarea>
              </label>
            </div>
          </div>
        </article>
      </div>
      <div class="workspace-doc-sidebar">
        <article class="workspace-doc-card">
          <div class="workspace-doc-sidebar-header">
            <h3>Markdown Preview</h3>
          </div>
          <div class="workspace-doc-markdown" data-architecture-markdown-preview></div>
        </article>
        <article class="workspace-doc-card">
          <div class="workspace-doc-sidebar-header">
            <h3>Mermaid</h3>
            <div class="workspace-doc-actions">
              <button type="button" class="btn btn-small btn-secondary" data-architecture-generate-mermaid>Generate from system map</button>
            </div>
          </div>
          <div class="workspace-doc-inline-note">The generated system map uses your components, integrations, and component connections.</div>
          <textarea rows="8" data-architecture-mermaid>${escapeHtml(mermaid)}</textarea>
          <div class="workspace-doc-markdown" data-architecture-mermaid-preview></div>
        </article>
      </div>
    </div>
  `;
  el.moduleDesignerSurface.querySelectorAll('[data-architecture-field], [data-designer-field], [data-architecture-connection-field], [data-architecture-mermaid]').forEach((node) => {
    node.addEventListener('input', () => refreshArchitectureMarkdownPreview(el.moduleDesignerSurface));
    node.addEventListener('change', () => refreshArchitectureMarkdownPreview(el.moduleDesignerSurface));
  });
  el.moduleDesignerSurface.querySelectorAll('[data-designer-add-list]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateArchitectureList(button.dataset.designerAddList || '', 'add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-designer-remove-list]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateArchitectureList(button.dataset.designerRemoveList || '', 'remove', Number(button.dataset.designerIndex || 0));
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-architecture-add-connection]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateArchitectureConnectionList('add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-architecture-remove-connection]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateArchitectureConnectionList('remove', Number(button.dataset.architectureRemoveConnection || 0));
      renderModuleDesignerSurface();
    });
  });
  const refreshButton = el.moduleDesignerSurface.querySelector('[data-architecture-refresh]');
  if (refreshButton) refreshButton.addEventListener('click', () => refreshArchitectureMarkdownPreview(el.moduleDesignerSurface));
  const generateMermaidButton = el.moduleDesignerSurface.querySelector('[data-architecture-generate-mermaid]');
  if (generateMermaidButton) {
    generateMermaidButton.addEventListener('click', () => {
      const currentState = syncArchitectureStateFromBuilder(el.moduleDesignerSurface);
      const mermaidInput = el.moduleDesignerSurface.querySelector('[data-architecture-mermaid]');
      if (mermaidInput) mermaidInput.value = buildClientArchitectureGeneratedMermaid(taskState.project, currentState);
      refreshArchitectureMarkdownPreview(el.moduleDesignerSurface);
    });
  }
  const saveButton = el.moduleDesignerSurface.querySelector('[data-architecture-save]');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      try {
        void logUiEvent('architecture', 'save-architecture');
        await saveArchitectureDocument(el.moduleDesignerSurface);
      } catch (error) {
        alert(error.message || 'Failed to save Architecture');
      }
    });
  }
  refreshArchitectureMarkdownPreview(el.moduleDesignerSurface);
}

function renderDatabaseSchemaDesignerSurface(view) {
  const state = getDatabaseSchemaState();
  const schemaModel = normalizeDatabaseSchemaModel(state.schemaModel, state);
  const mermaid = buildClientDatabaseSchemaGeneratedMermaid(taskState.project, state);
  const dbml = phase5State.databaseSchema && String(phase5State.databaseSchema.dbml || '').trim()
    ? phase5State.databaseSchema.dbml
    : buildClientDatabaseSchemaDbml(taskState.project, state);
  const importSourceSummary = state.importSource
    ? `${state.importSource.sourceLabel || 'Imported schema'} · ${state.importSource.dialect || 'unknown dialect'} · ${state.importSource.confidence || 'unknown confidence'}`
    : 'No fragment imported yet.';
  el.moduleDesignerSurface.innerHTML = `
    <article class="workspace-doc-card module-designer-hero">
      <div class="module-designer-kicker">Software Design Surface</div>
      <h3>${escapeHtml(view.label)}</h3>
      <p>${escapeHtml(view.description)}</p>
    </article>
    <div class="workspace-doc-layout">
      <div class="workspace-doc-main">
        <article class="workspace-doc-card">
          <div class="workspace-doc-sidebar-header">
            <h3>Database Schema Designer</h3>
            <div class="workspace-doc-actions">
              <input type="file" accept=".md,.txt" data-schema-import-file hidden />
              <button type="button" class="btn btn-secondary" data-schema-import>Upload Fragment</button>
              <button type="button" class="btn btn-ghost" data-schema-refresh>Refresh</button>
              <button type="button" class="btn btn-primary" data-schema-save>Save</button>
            </div>
          </div>
          ${renderModuleDependencyStatus(view)}
          <div class="workspace-doc-inline-note">${escapeHtml(importSourceSummary)}</div>
          <div class="schema-model-summary">
            <div class="task-summary-pill"><strong>${schemaModel.entities.length}</strong> entities</div>
            <div class="task-summary-pill"><strong>${schemaModel.entities.reduce((count, entity) => count + ((entity.fields || []).length), 0)}</strong> fields</div>
            <div class="task-summary-pill"><strong>${schemaModel.relationships.length}</strong> relationships</div>
            <div class="task-summary-pill"><strong>${schemaModel.indexes.length}</strong> indexes</div>
            <div class="task-summary-pill"><strong>${schemaModel.constraints.length}</strong> constraints</div>
          </div>
          <div class="prd-editor-builder">
            <div class="prd-editor-section">
              <div class="prd-editor-section-header">
                <h4>Schema Overview ${renderPrdHelp('Describe what data the software needs and how the storage strategy should work.')}</h4>
                <span class="prd-editor-version">${escapeHtml(formatPrdDateLabel(state.overview.versionDate))}</span>
              </div>
              <label class="field">
                <span>Purpose</span>
                <textarea rows="4" data-schema-field="overview.purpose" placeholder="What is this schema responsible for?">${escapeHtml(state.overview.purpose || '')}</textarea>
              </label>
              <label class="field">
                <span>Storage strategy</span>
                <textarea rows="4" data-schema-field="overview.storageStrategy" placeholder="How should the data be stored and evolved?">${escapeHtml(state.overview.storageStrategy || '')}</textarea>
              </label>
            </div>
            <div class="prd-editor-section prd-editor-grid">
              ${renderDatabaseSchemaEntityEditor(schemaModel)}
              ${renderDatabaseSchemaRelationshipEditor(schemaModel)}
              ${renderDatabaseSchemaIndexEditor(schemaModel)}
              ${renderDatabaseSchemaConstraintEditor(schemaModel)}
              ${renderDesignerDetailEditor('Migration Notes', 'migrations', state.migrations, { icon: 'MIG', help: 'Capture migration sequencing or compatibility notes.', titlePlaceholder: 'Migration note', descriptionPlaceholder: 'Describe the migration or compatibility concern.' })}
              ${renderDesignerDetailEditor('Open Questions', 'openQuestions', state.openQuestions, { icon: 'Q', help: 'Capture uncertainty that still needs to be resolved before the schema should be treated as final.', titlePlaceholder: 'Open question', descriptionPlaceholder: 'Explain the uncertainty, impact, and proposed follow-up.' })}
              ${renderDesignerDetailEditor('Source-of-Truth and Sync Rules', 'synchronizationRules', state.synchronizationRules, { icon: 'SYNC', help: 'Capture rules for how schema-related files and database state stay aligned.', titlePlaceholder: 'Sync rule', descriptionPlaceholder: 'Describe the source-of-truth expectation.' })}
            </div>
          </div>
        </article>
      </div>
      <div class="workspace-doc-sidebar">
        <article class="workspace-doc-card">
          <div class="workspace-doc-sidebar-header">
            <h3>Markdown Preview</h3>
          </div>
          <div class="workspace-doc-markdown" data-schema-markdown-preview></div>
        </article>
        <article class="workspace-doc-card">
          <div class="workspace-doc-sidebar-header">
            <h3>Generated DBML</h3>
          </div>
          <div class="workspace-doc-markdown" data-schema-dbml-preview>${escapeHtml(dbml)}</div>
        </article>
        <article class="workspace-doc-card">
          <div class="workspace-doc-sidebar-header">
            <h3>Generated Mermaid</h3>
          </div>
          <div class="workspace-doc-markdown" data-schema-mermaid-source>${escapeHtml(mermaid)}</div>
          <div class="workspace-doc-markdown" data-schema-mermaid-preview></div>
        </article>
      </div>
    </div>
  `;
  el.moduleDesignerSurface.querySelectorAll('[data-schema-field], [data-designer-field], [data-schema-entity-field], [data-schema-column-field], [data-schema-relationship-field], [data-schema-index-field], [data-schema-constraint-field]').forEach((node) => {
    node.addEventListener('input', () => refreshDatabaseSchemaMarkdownPreview(el.moduleDesignerSurface));
    node.addEventListener('change', () => refreshDatabaseSchemaMarkdownPreview(el.moduleDesignerSurface));
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-add-entity]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaEntityList('add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-remove-entity]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaEntityList('remove', Number(button.dataset.schemaRemoveEntity || 0));
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-add-field]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaFieldList(Number(button.dataset.schemaAddField || 0), 'add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-remove-field]').forEach((button) => {
    button.addEventListener('click', () => {
      const [entityIndex, fieldIndex] = String(button.dataset.schemaRemoveField || '0.0').split('.').map((value) => Number(value));
      mutateDatabaseSchemaFieldList(entityIndex, 'remove', fieldIndex);
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-add-relationship]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaRelationshipList('add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-remove-relationship]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaRelationshipList('remove', Number(button.dataset.schemaRemoveRelationship || 0));
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-add-index]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaIndexList('add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-remove-index]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaIndexList('remove', Number(button.dataset.schemaRemoveIndex || 0));
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-add-constraint]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaConstraintList('add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-schema-remove-constraint]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaConstraintList('remove', Number(button.dataset.schemaRemoveConstraint || 0));
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-designer-add-list]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaList(button.dataset.designerAddList || '', 'add');
      renderModuleDesignerSurface();
    });
  });
  el.moduleDesignerSurface.querySelectorAll('[data-designer-remove-list]').forEach((button) => {
    button.addEventListener('click', () => {
      mutateDatabaseSchemaList(button.dataset.designerRemoveList || '', 'remove', Number(button.dataset.designerIndex || 0));
      renderModuleDesignerSurface();
    });
  });
  const refreshButton = el.moduleDesignerSurface.querySelector('[data-schema-refresh]');
  if (refreshButton) refreshButton.addEventListener('click', () => refreshDatabaseSchemaMarkdownPreview(el.moduleDesignerSurface));
  const importInput = el.moduleDesignerSurface.querySelector('[data-schema-import-file]');
  const importButton = el.moduleDesignerSurface.querySelector('[data-schema-import]');
  if (importButton && importInput) {
    importButton.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0] ? importInput.files[0] : null;
      if (!file) return;
      try {
        void logUiEvent('database_schema', 'import-fragment', { fileName: file.name || '' });
        await importDatabaseSchemaFragment(file);
      } catch (error) {
        alert(error.message || 'Failed to import schema fragment');
      } finally {
        importInput.value = '';
      }
    });
  }
  const saveButton = el.moduleDesignerSurface.querySelector('[data-schema-save]');
  if (saveButton) {
    saveButton.addEventListener('click', async () => {
      try {
        void logUiEvent('database_schema', 'save-database-schema');
        await saveDatabaseSchemaDocument(el.moduleDesignerSurface);
      } catch (error) {
        alert(error.message || 'Failed to save Database Schema');
      }
    });
  }
  refreshDatabaseSchemaMarkdownPreview(el.moduleDesignerSurface);
}

function renderModuleDesignerPlaceholder(view) {
  const inputs = Array.isArray(view.inputs) ? view.inputs : ['Roadmap phases', 'Work items', 'Generated project documents'];
  const outputs = Array.isArray(view.outputs) ? view.outputs : ['Managed markdown output', 'Mermaid diagram output', 'AI-readable structure'];
  el.moduleDesignerSurface.innerHTML = `
    <article class="workspace-doc-card module-designer-hero">
      <div class="module-designer-kicker">Software Design Surface</div>
      <h3>${escapeHtml(view.label)}</h3>
      <p>${escapeHtml(view.description)}</p>
    </article>
    ${renderModuleDependencyStatus(view)}
    <div class="module-designer-grid">
      <article class="workspace-doc-card">
        <div class="workspace-doc-sidebar-header">
          <h3>Design Focus</h3>
        </div>
        <p class="module-designer-copy">
          This module is planned as part of the Software Project Designer. The goal is to help you design the product and system, then generate structured human-readable and AI-consumable artifacts from that work.
        </p>
      </article>
      <article class="workspace-doc-card">
        <div class="workspace-doc-sidebar-header">
          <h3>Connected Inputs</h3>
        </div>
        <ul class="module-designer-list">${inputs.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </article>
      <article class="workspace-doc-card">
        <div class="workspace-doc-sidebar-header">
          <h3>Planned Outputs</h3>
        </div>
        <ul class="module-designer-list">${outputs.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
      </article>
      <article class="workspace-doc-card">
        <div class="workspace-doc-sidebar-header">
          <h3>Build Status</h3>
        </div>
        <p class="module-designer-copy">
          The platform foundations are in place: project typing, module registry, typed work items, fragments, and database-first document metadata. This designer surface is ready for the next implementation pass.
        </p>
      </article>
    </div>
  `;
}

function renderModuleDesignerSurface() {
  if (!el.moduleDesignerSurface) return;
  const view = getWorkspaceViewDefinition(taskState.view);
  if (!view || view.surface !== 'module-designer') {
    el.moduleDesignerSurface.innerHTML = '';
    return;
  }
  if (view.id === 'architecture') {
    renderArchitectureDesignerSurface(view);
    return;
  }
  if (view.id === 'database_schema') {
    renderDatabaseSchemaDesignerSurface(view);
    return;
  }
  renderModuleDesignerPlaceholder(view);
}

function compareTaskDates(left, right) {
  const leftValue = left ? new Date(`${left}T00:00:00`).getTime() : Number.POSITIVE_INFINITY;
  const rightValue = right ? new Date(`${right}T00:00:00`).getTime() : Number.POSITIVE_INFINITY;
  return leftValue - rightValue;
}

function buildPhaseThreeAlerts(tasks) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const upcomingWindow = new Date(now);
  upcomingWindow.setDate(upcomingWindow.getDate() + 7);
  const tasksById = new Map(tasks.map((task) => [task.id, task]));

  return tasks.flatMap((task) => {
    const alerts = [];
    if (task.dueDate) {
      const due = new Date(`${task.dueDate}T00:00:00`);
      if (task.status !== 'done' && due < now) {
        alerts.push({ level: 'danger', title: `${task.title} is overdue`, message: `Due ${formatTaskDate(task.dueDate)}` });
      } else if (task.status !== 'done' && due.getTime() === now.getTime()) {
        alerts.push({ level: 'warning', title: `${task.title} is due today`, message: `Deadline ${formatTaskDate(task.dueDate)}` });
      } else if (task.status !== 'done' && due <= upcomingWindow) {
        alerts.push({ level: 'info', title: `${task.title} is due soon`, message: `Deadline ${formatTaskDate(task.dueDate)}` });
      }
    }

    const blockedBy = (task.dependencyIds || [])
      .map((dependencyId) => tasksById.get(dependencyId))
      .filter(Boolean)
      .filter((dependency) => dependency.status !== 'done');
    if (blockedBy.length) {
      alerts.push({
        level: 'warning',
        title: `${task.title} is blocked`,
        message: `Waiting on ${blockedBy.map((dependency) => dependency.title).join(', ')}`,
      });
    }

    return alerts.map((alert) => ({ ...alert, taskId: task.id }));
  }).sort((left, right) => left.title.localeCompare(right.title));
}

function buildDependencySequence(tasks) {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const pending = new Set(tasks.map((task) => task.id));
  const sequence = [];

  while (pending.size) {
    const ready = [...pending]
      .map((id) => byId.get(id))
      .filter((task) => (task.dependencyIds || []).every((dependencyId) => !pending.has(dependencyId)))
      .sort((left, right) => compareTaskDates(left.startDate || left.dueDate, right.startDate || right.dueDate) || String(left.title).localeCompare(String(right.title)));

    if (!ready.length) {
      ready.push(...[...pending].map((id) => byId.get(id)).sort((left, right) => String(left.title).localeCompare(String(right.title))));
    }

    for (const task of ready) {
      if (!pending.has(task.id)) continue;
      pending.delete(task.id);
      sequence.push(task);
    }
  }

  return sequence;
}

function renderTaskDeadlineAlerts() {
  if (!el.taskDeadlineAlerts) return;
  const alerts = buildPhaseThreeAlerts(taskState.tasks);
  if (!alerts.length) {
    el.taskDeadlineAlerts.innerHTML = '';
    el.taskDeadlineAlerts.hidden = true;
    return;
  }

  el.taskDeadlineAlerts.hidden = false;
  el.taskDeadlineAlerts.innerHTML = alerts.slice(0, 6).map((alert) => `
    <article class="task-alert task-alert-${escapeAttr(alert.level)}">
      <div class="task-alert-title">${escapeHtml(alert.title)}</div>
      <div class="task-alert-message">${escapeHtml(alert.message)}</div>
    </article>
  `).join('');
}

async function maybeNotifyDeadlineAlerts(project, tasks) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }
  if (Notification.permission !== 'granted') return;

  const alerts = buildPhaseThreeAlerts(tasks).slice(0, 3);
  window.__apmDeadlineNoticeKeys = window.__apmDeadlineNoticeKeys || new Set();
  alerts.forEach((alert) => {
    const key = `${project.id}:${alert.taskId}:${alert.title}:${alert.message}`;
    if (window.__apmDeadlineNoticeKeys.has(key)) return;
    window.__apmDeadlineNoticeKeys.add(key);
    new Notification(project.name, { body: `${alert.title}. ${alert.message}` });
  });
}

function renderTaskBoard() {
  if (!el.taskBoard) return;
  const columnsHtml = TASK_COLUMNS.map((column) => {
    const tasks = sortTasksForDisplay(taskState.tasks.filter((task) => (task.status || 'todo') === column.key));
    const cardsHtml = tasks.length
      ? tasks.map((task) => `
          <article class="task-card" draggable="true" data-task-id="${task.id}">
            <div class="task-card-top">
              <div class="task-card-title">${escapeHtml(task.title)}</div>
              <div class="task-card-actions">
                <button type="button" class="btn-icon btn-task-edit" data-task-id="${task.id}" aria-label="Edit task">✎</button>
                <button type="button" class="btn-icon btn-icon-danger btn-task-delete" data-task-id="${task.id}" aria-label="Delete task">🗑</button>
              </div>
            </div>
            <div class="task-card-badges">${getTaskBadges(task)}</div>
            ${task.description ? `<div class="task-card-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-progress-row">
              <div class="task-progress-bar"><span style="width:${Math.max(0, Math.min(100, Number(task.progress || 0)))}%"></span></div>
              <span class="task-progress-value">${Math.round(Number(task.progress || 0))}%</span>
            </div>
            ${getTaskSummaryText(task) ? `<div class="task-card-meta">${escapeHtml(getTaskSummaryText(task))}</div>` : ''}
          </article>
        `).join('')
      : '<div class="task-column-empty">Nothing here yet.</div>';
    return `
      <section class="task-column" data-task-status="${column.key}">
        <header class="task-column-header">
          <div>
            <h3>${column.label}</h3>
            <span>${tasks.length} item${tasks.length === 1 ? '' : 's'}</span>
          </div>
          <button type="button" class="btn btn-small btn-secondary btn-task-add-inline" data-task-new-status="${column.key}">+ Add</button>
        </header>
        <div class="task-column-body">${cardsHtml}</div>
      </section>
    `;
  }).join('');

  el.taskBoard.innerHTML = columnsHtml;

  el.taskBoard.querySelectorAll('.task-card').forEach((card) => {
    card.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', card.dataset.taskId);
      card.classList.add('is-dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
  });

  el.taskBoard.querySelectorAll('.task-column').forEach((columnEl) => {
    columnEl.addEventListener('dragover', (event) => {
      event.preventDefault();
      columnEl.classList.add('is-drop-target');
    });
    columnEl.addEventListener('dragleave', () => columnEl.classList.remove('is-drop-target'));
    columnEl.addEventListener('drop', async (event) => {
      event.preventDefault();
      columnEl.classList.remove('is-drop-target');
      const taskId = event.dataTransfer.getData('text/plain');
      const status = columnEl.dataset.taskStatus;
      if (taskId && status) await moveTaskToStatus(taskId, status);
    });
  });

  el.taskBoard.querySelectorAll('.btn-task-add-inline').forEach((button) => {
    button.addEventListener('click', () => openTaskEditor(null, button.dataset.taskNewStatus || 'todo'));
  });
  bindTaskActionButtons(el.taskBoard);
}

function renderTaskTimeline() {
  if (!el.taskTimeline) return;
  const scheduled = sortTasksForDisplay(taskState.tasks.filter((task) => task.startDate || task.endDate || task.dueDate));
  if (!scheduled.length) {
    el.taskTimeline.innerHTML = '<div class="task-timeline-empty">Add start, end, or due dates to see the Phase 3 timeline view.</div>';
    if (el.taskPhase3Sidebar) el.taskPhase3Sidebar.innerHTML = '';
    return;
  }

  const points = scheduled.flatMap((task) => [task.startDate || task.dueDate || task.endDate, task.endDate || task.dueDate || task.startDate]).filter(Boolean);
  const timestamps = points.map((value) => new Date(`${value}T00:00:00`).getTime()).filter(Number.isFinite);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);
  const totalDays = Math.max(1, Math.round((maxTime - minTime) / 86400000) + 1);

  const axisLabels = Array.from({ length: Math.min(totalDays, 8) }, (_, index) => {
    const offset = totalDays === 1 ? 0 : Math.round(index * (totalDays - 1) / Math.max(1, Math.min(totalDays, 8) - 1));
    const date = new Date(minTime + (offset * 86400000));
    return `<span>${escapeHtml(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }))}</span>`;
  }).join('');

  const rowsHtml = scheduled.map((task) => {
    const startValue = task.startDate || task.dueDate || task.endDate;
    const endValue = task.endDate || task.dueDate || task.startDate;
    const startTime = new Date(`${startValue}T00:00:00`).getTime();
    const endTime = new Date(`${endValue}T00:00:00`).getTime();
    const left = ((startTime - minTime) / Math.max(1, maxTime - minTime || 86400000)) * 100;
    const width = task.milestone
      ? 0
      : Math.max(4, ((endTime - startTime) / Math.max(1, maxTime - minTime || 86400000)) * 100);
    const dueText = task.dueDate ? `Due ${formatTaskDate(task.dueDate)}` : '';
    return `
      <div class="task-timeline-row">
        <div class="task-timeline-meta">
          <div class="task-timeline-title">${escapeHtml(task.title)}</div>
          <div class="task-timeline-caption">${escapeHtml([getTaskPriorityLabel(task.priority), dueText, task.assignedTo || ''].filter(Boolean).join(' • '))}</div>
        </div>
        <div class="task-timeline-track-wrap">
          <div class="task-timeline-track">
            <div class="task-timeline-bar ${task.milestone ? 'is-milestone' : ''}" style="left:${Math.max(0, Math.min(96, left))}%;${task.milestone ? '' : `width:${Math.max(4, Math.min(100, width))}%;`}"></div>
            <div class="task-timeline-progress" style="left:${Math.max(0, Math.min(96, left))}%;width:${Math.max(2, Math.min(100, width * (Math.max(0, Math.min(100, Number(task.progress || 0))) / 100)))}%;"></div>
          </div>
        </div>
        <div class="task-timeline-actions">
          <span class="task-badge">${Math.round(Number(task.progress || 0))}%</span>
          <button type="button" class="btn-icon btn-task-edit" data-task-id="${task.id}" aria-label="Edit task">✎</button>
        </div>
      </div>
    `;
  }).join('');

  el.taskTimeline.innerHTML = `
    <div class="task-timeline-axis">${axisLabels}</div>
    <div class="task-timeline-rows">${rowsHtml}</div>
  `;
  bindTaskActionButtons(el.taskTimeline);
  renderPhaseThreeSidebar();
}

function renderTaskWorkspace() {
  if (!taskState.project) return;
  if (el.taskWorkspaceTitle) el.taskWorkspaceTitle.textContent = `${taskState.project.name} tasks`;
  if (el.taskWorkspaceSubtitle) {
    el.taskWorkspaceSubtitle.textContent = taskState.project.path
      ? `${taskState.project.path} • SQLite-backed kanban and timeline planning`
      : 'SQLite-backed kanban and timeline planning';
  }
  renderTaskWorkspaceSummary();
  renderTaskBoard();
  renderTaskTimeline();
}

function bindTaskActionButtons(container) {
  if (!container) return;
  container.querySelectorAll('.btn-task-edit').forEach((button) => {
    button.addEventListener('click', () => {
      const task = taskState.tasks.find((item) => item.id === button.dataset.taskId);
      if (task) openTaskEditor(task);
    });
  });
  container.querySelectorAll('.btn-task-delete').forEach((button) => {
    button.addEventListener('click', async () => {
      const task = taskState.tasks.find((item) => item.id === button.dataset.taskId);
      if (task) await removeTask(task);
    });
  });
  container.querySelectorAll('[data-dependency-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = findDetailTargetByTaskId(button.dataset.dependencyOpen);
      if (target) openWorkItemDetail(target.kind, target.item.id);
    });
  });
}

async function refreshTaskWorkspace() {
  if (!taskState.project) return;
  await loadTaskWorkspace(taskState.project.id);
  renderTaskWorkspace();
}

function renderPhaseThreeSidebar() {
  if (!el.taskPhase3Sidebar) return;
  const sequence = buildDependencySequence(taskState.tasks);
  const milestones = sequence.filter((task) => task.milestone);
  const blocked = buildPhaseThreeAlerts(taskState.tasks).filter((alert) => alert.title.includes('blocked'));
  const deadlines = buildPhaseThreeAlerts(taskState.tasks).filter((alert) => alert.title.includes('due'));

  el.taskPhase3Sidebar.innerHTML = `
    <section class="phase3-panel">
      <h3>Dependency Sequence</h3>
      ${sequence.length ? `<ol class="phase3-sequence-list">
        ${sequence.map((task) => `<li><strong>${escapeHtml(task.title)}</strong><span>${escapeHtml((task.dependencyIds || []).length ? `${task.dependencyIds.length} deps` : 'Ready')}</span></li>`).join('')}
      </ol>` : '<div class="phase3-empty">Add tasks to build the delivery sequence.</div>'}
    </section>
    <section class="phase3-panel">
      <h3>Milestones</h3>
      ${milestones.length ? `<ul class="phase3-meta-list">${milestones.map((task) => `<li>${escapeHtml(task.title)}<span>${escapeHtml(formatTaskDate(task.dueDate || task.endDate || task.startDate) || 'No date')}</span></li>`).join('')}</ul>` : '<div class="phase3-empty">No milestones yet.</div>'}
    </section>
    <section class="phase3-panel">
      <h3>Deadlines</h3>
      ${deadlines.length ? `<ul class="phase3-meta-list">${deadlines.map((alert) => `<li>${escapeHtml(alert.title)}<span>${escapeHtml(alert.message)}</span></li>`).join('')}</ul>` : '<div class="phase3-empty">No deadline alerts.</div>'}
    </section>
    <section class="phase3-panel">
      <h3>Dependency Alerts</h3>
      ${blocked.length ? `<ul class="phase3-meta-list">${blocked.map((alert) => `<li>${escapeHtml(alert.title)}<span>${escapeHtml(alert.message)}</span></li>`).join('')}</ul>` : '<div class="phase3-empty">No dependency conflicts.</div>'}
    </section>
  `;
}

function renderTaskWorkspace() {
  if (!taskState.project) return;
  updateWorkspacePluginTabs(taskState.project);
  renderWorkspaceDesignerNav();
  renderWorkspaceHeader();
  renderTaskWorkspaceSummary();
  renderTaskDeadlineAlerts();
  renderTaskBoard();
  renderTaskTimeline();
  renderPhaseThreeSidebar();
  renderModuleDesignerSurface();
  renderPhaseFiveWorkspace();
}

async function refreshTaskWorkspace() {
  if (!taskState.project) return;
  await loadTaskWorkspace(taskState.project.id);
  await loadPhaseFiveWorkspace(taskState.project);
  if (taskState.view === 'integrations') {
    await loadIntegrationWorkspace(taskState.project);
  }
  renderTaskWorkspace();
  await maybeNotifyDeadlineAlerts(taskState.project, taskState.tasks);
}

function populateTaskDependencyOptions(currentTaskId = '') {
  const currentDependencies = (taskState.tasks.find((task) => task.id === currentTaskId) || {}).dependencyIds || [];
  populateDependencyOptions(el.taskEditorDependencies, currentTaskId, currentDependencies);
}

function openTaskEditor(task = null, preferredStatus = 'todo') {
  void logUiEvent(taskState.view === 'gantt' ? 'gantt' : 'board', task ? 'open-edit-task' : 'open-add-task', task ? { taskId: task.id } : { preferredStatus });
  const isEdit = !!task;
  if (el.taskEditorTitle) el.taskEditorTitle.textContent = isEdit ? 'Edit task' : 'Add task';
  if (el.taskEditorId) el.taskEditorId.value = isEdit ? task.id : '';
  if (el.taskEditorTitleInput) el.taskEditorTitleInput.value = isEdit ? (task.title || '') : '';
  if (el.taskEditorDescription) el.taskEditorDescription.value = isEdit ? (task.description || '') : '';
  if (el.taskEditorStatus) el.taskEditorStatus.value = isEdit ? (task.status || 'todo') : preferredStatus;
  if (el.taskEditorPriority) el.taskEditorPriority.value = isEdit ? (task.priority || 'medium') : 'medium';
  if (el.taskEditorCategory) el.taskEditorCategory.value = isEdit ? (task.category || '') : '';
  if (el.taskEditorProgress) el.taskEditorProgress.value = String(isEdit ? Number(task.progress || 0) : 0);
  if (el.taskEditorAssignee) el.taskEditorAssignee.value = isEdit ? (task.assignedTo || '') : '';
  if (el.taskEditorDueDate) el.taskEditorDueDate.value = isEdit ? (task.dueDate || '') : '';
  if (el.taskEditorMilestone) el.taskEditorMilestone.checked = isEdit ? task.milestone === true : false;
  if (el.taskEditorStartDate) el.taskEditorStartDate.value = isEdit ? (task.startDate || '') : '';
  if (el.taskEditorEndDate) el.taskEditorEndDate.value = isEdit ? (task.endDate || '') : '';
  populateRoadmapPhaseOptions(el.taskEditorRoadmapPhase, isEdit ? task.roadmapPhaseId : '');
  if (el.taskEditorPlanningBucket) el.taskEditorPlanningBucket.value = isEdit ? (task.planningBucket || (task.roadmapPhaseId ? 'phase' : 'considered')) : 'considered';
  populateTaskDependencyOptions(isEdit ? task.id : '');
  if (el.taskEditorDependencies) {
    const selected = new Set(isEdit ? (task.dependencyIds || []) : []);
    [...el.taskEditorDependencies.options].forEach((option) => {
      option.selected = selected.has(option.value);
    });
  }
  if (el.modalTaskEditor) el.modalTaskEditor.showModal();
}

async function saveTaskFromEditor() {
  if (!taskState.project) return;
  const id = el.taskEditorId ? el.taskEditorId.value : '';
  const payload = {
    title: el.taskEditorTitleInput ? el.taskEditorTitleInput.value.trim() : '',
    description: el.taskEditorDescription ? el.taskEditorDescription.value.trim() : '',
    status: el.taskEditorStatus ? el.taskEditorStatus.value : 'todo',
    priority: el.taskEditorPriority ? el.taskEditorPriority.value : 'medium',
    category: el.taskEditorCategory ? (el.taskEditorCategory.value.trim() || null) : null,
    progress: el.taskEditorProgress ? Number(el.taskEditorProgress.value || 0) : 0,
    assignedTo: el.taskEditorAssignee ? (el.taskEditorAssignee.value.trim() || null) : null,
    dueDate: el.taskEditorDueDate ? (el.taskEditorDueDate.value || null) : null,
    milestone: el.taskEditorMilestone ? el.taskEditorMilestone.checked : false,
    startDate: el.taskEditorStartDate ? (el.taskEditorStartDate.value || null) : null,
    endDate: el.taskEditorEndDate ? (el.taskEditorEndDate.value || null) : null,
    roadmapPhaseId: el.taskEditorRoadmapPhase ? (el.taskEditorRoadmapPhase.value || null) : null,
    planningBucket: el.taskEditorPlanningBucket ? el.taskEditorPlanningBucket.value : 'considered',
    dependencyIds: el.taskEditorDependencies
      ? [...el.taskEditorDependencies.selectedOptions].map((option) => option.value)
      : [],
  };
  if (payload.planningBucket !== 'phase') payload.roadmapPhaseId = null;
  if (!payload.title) {
    alert('Task title is required.');
    return;
  }
  if (id) {
    await fetchJSON(`${API}/projects/${taskState.project.id}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } else {
    await fetchJSON(`${API}/projects/${taskState.project.id}/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  void logUiEvent(taskState.view === 'gantt' ? 'gantt' : 'board', id ? 'save-task' : 'create-task', { taskId: id || null, title: payload.title, status: payload.status });
  if (el.modalTaskEditor) el.modalTaskEditor.close();
  await refreshTaskWorkspace();
}

async function removeTask(task) {
  if (!taskState.project || !task) return;
  if (!confirm(`Delete task "${task.title}"?`)) return;
  void logUiEvent(taskState.view === 'gantt' ? 'gantt' : 'board', 'delete-task', { taskId: task.id, title: task.title });
  await fetchJSON(`${API}/projects/${taskState.project.id}/tasks/${task.id}`, { method: 'DELETE' });
  await refreshTaskWorkspace();
}

async function moveTaskToStatus(taskId, status) {
  const task = taskState.tasks.find((item) => item.id === taskId);
  if (!task || task.status === status) return;
  const nextSortOrder = taskState.tasks
    .filter((item) => item.status === status)
    .reduce((max, item) => Math.max(max, Number(item.sortOrder || 0)), -1) + 1;
  await fetchJSON(`${API}/projects/${taskState.project.id}/tasks/${task.id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, sortOrder: nextSortOrder }),
  });
  void logUiEvent('board', 'move-task-status', { taskId: task.id, from: task.status, to: status });
  await refreshTaskWorkspace();
}

async function saveDescription(el) {
  const id = el.dataset.id;
  const description = el.textContent.trim();
  await fetchJSON(`${API}/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ description }),
  });
}

async function removeProject(id) {
  if (!confirm('Remove this project from the list? (The folder is not deleted.)')) return;
  await fetchJSON(`${API}/projects/${id}`, { method: 'DELETE' });
  await loadProjects();
}

async function associateServer(projectId, serverId) {
  await fetchJSON(`${API}/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ serverId: serverId || null }),
  });
  await loadProjects();
}

function updateAddProjectFieldsVisibility() {
  const isEdit = !!el.projectId.value;
  const isUrl = el.projectTypeUrl && el.projectTypeUrl.checked;
  if (el.fieldProjectType) el.fieldProjectType.hidden = isEdit;
  if (el.fieldProjectPath) el.fieldProjectPath.hidden = isEdit || isUrl;
  if (el.fieldProjectUrl) el.fieldProjectUrl.hidden = isEdit || !isUrl;
  if (el.browsePanel) el.browsePanel.hidden = true;
}

function openAddProject(parentId = null) {
  el.projectId.value = '';
  el.projectParentId.value = parentId || '';
  el.projectPath.value = '';
  if (el.projectUrl) el.projectUrl.value = '';
  if (el.projectTypeFolder) el.projectTypeFolder.checked = true;
  if (el.projectTypeUrl) el.projectTypeUrl.checked = false;
  el.projectName.value = '';
  el.projectDescription.value = '';
  if (el.projectCategory) { el.projectCategory.value = ''; populateCategoryDatalist(el.projectCategoryList, ''); }
  replaceArrayContents(projectTagsArray, []);
  if (el.projectTagsChips) renderTagsChips(el.projectTagsChips, projectTagsArray, makeTagsRemoveFn(el.projectTagsChips, projectTagsArray));
  if (el.projectTagsInput) el.projectTagsInput.value = '';
  if (el.projectTagsSuggestions) { el.projectTagsSuggestions.hidden = true; el.projectTagsSuggestions.innerHTML = ''; }
  el.modalProjectTitle.textContent = parentId ? 'Add subproject' : 'Add project';
  el.browsePanel.hidden = true;
  updateAddProjectFieldsVisibility();
  el.modalProject.showModal();
}

function openEditProject(project) {
  el.projectId.value = project.id;
  el.projectParentId.value = project.parentId || '';
  el.projectPath.value = project.path || '';
  if (el.projectUrl) el.projectUrl.value = project.url || '';
  el.projectName.value = project.name;
  el.projectDescription.value = project.description || '';
  el.modalProjectTitle.textContent = 'Edit project';
  el.browsePanel.hidden = true;
  updateAddProjectFieldsVisibility();
  el.modalProject.showModal();
}

async function openProjectSettingsModal(project) {
  await loadCredentials();
  el.projectSettingsId.value = project.id;
  const isUrlProject = project.type === 'url';
  const integrations = project.integrations || {};
  const githubIntegration = integrations.github || {};
  const webhookIntegration = integrations.webhooks || {};
  if (el.projectSettingsPrimaryAction) el.projectSettingsPrimaryAction.value = project.primaryAction || 'auto';
  el.projectSettingsPath.value = project.path || '';
  if (el.projectSettingsUrl) el.projectSettingsUrl.value = project.url || '';
  if (el.fieldProjectSettingsPath) el.fieldProjectSettingsPath.hidden = isUrlProject;
  if (el.fieldProjectSettingsUrl) el.fieldProjectSettingsUrl.hidden = !isUrlProject;
  const imageFromUrl = !!project.imageUrl;
  if (el.projectSettingsImageSourceLocal) el.projectSettingsImageSourceLocal.checked = !imageFromUrl;
  if (el.projectSettingsImageSourceUrl) el.projectSettingsImageSourceUrl.checked = imageFromUrl;
  if (el.projectSettingsImageUrl) el.projectSettingsImageUrl.value = project.imageUrl || '';
  updateProjectSettingsImageFieldsVisibility();
  el.projectSettingsDescription.value = project.description || '';
  if (el.projectSettingsCategory) { el.projectSettingsCategory.value = project.category || ''; populateCategoryDatalist(el.projectSettingsCategoryList, project.category || ''); }
  replaceArrayContents(projectSettingsTagsArray, project.tags || []);
  if (el.projectSettingsTagsChips) renderTagsChips(el.projectSettingsTagsChips, projectSettingsTagsArray, makeTagsRemoveFn(el.projectSettingsTagsChips, projectSettingsTagsArray));
  if (el.projectSettingsTagsInput) el.projectSettingsTagsInput.value = '';
  projectSettingsLinks = (project.links || []).map(l => ({
    type: l.type === 'file' ? 'file' : 'url',
    description: l.description || '',
    url: l.url || '',
    action: l.action || 'auto',
  }));
  renderSettingsLinksList();
  if (el.projectSettingsGithubEnabled) el.projectSettingsGithubEnabled.checked = githubIntegration.enabled !== false;
  if (el.projectSettingsGithubOwner) el.projectSettingsGithubOwner.value = githubIntegration.owner || '';
  if (el.projectSettingsGithubRepo) el.projectSettingsGithubRepo.value = githubIntegration.repo || '';
  if (el.projectSettingsWebhookAutoTasks) el.projectSettingsWebhookAutoTasks.checked = !!webhookIntegration.autoCreateTasks;
  if (el.projectSettingsWebhookStatus) el.projectSettingsWebhookStatus.value = webhookIntegration.taskStatus || 'todo';
  if (el.projectSettingsWebhookPrefix) el.projectSettingsWebhookPrefix.value = webhookIntegration.taskPrefix || 'Webhook';
  projectSettingsPlugins = Array.isArray(integrations.plugins)
    ? integrations.plugins.map((plugin) => ({
        id: plugin.id || '',
        name: plugin.name || '',
        type: plugin.type || 'webhook_forward',
        targetUrl: plugin.targetUrl || '',
        method: plugin.method || 'POST',
        headers: plugin.headers && typeof plugin.headers === 'object' ? { ...plugin.headers } : {},
        includeProjectContext: plugin.includeProjectContext !== false,
      }))
    : [];
  projectSettingsSoftwareModulesOriginal = Array.isArray(project.modules)
    ? project.modules.filter((module) => module && module.group === 'software' && module.enabled).map((module) => module.moduleKey)
    : [];
  renderProjectSettingsSoftwareModules(project);
  renderProjectSettingsPluginsList();
  el.projectSettingsServer.innerHTML = '<option value="">— No server —</option>' +
    credentials.map(c => `<option value="${c.id}" ${project.serverId === c.id ? 'selected' : ''}>${escapeHtml(c.name)} (${escapeHtml(c.host)})</option>`).join('');
  el.projectSettingsBrowsePanel.hidden = true;
  el.modalProjectSettings.showModal();
}

async function loadBrowseForProjectSettings(dirPath) {
  const normalized = dirPath.replace(/\\/g, '/');
  const data = await fetchJSON(`${API}/browse?path=${encodeURIComponent(normalized)}`);
  browseStateSettings = data;
  el.projectSettingsBrowseCurrent.textContent = data.absolute || data.path || dirPath;
  const sep = '/';
  el.projectSettingsBrowseDirs.innerHTML = data.dirs.map(d => {
    const subPath = data.path ? data.path + sep + d.name : d.name;
    return `<li data-path="${escapeAttr(subPath)}">${escapeHtml(d.name)}</li>`;
  }).join('');
  el.projectSettingsBrowseDirs.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', async () => loadBrowseForProjectSettings(li.dataset.path));
  });
}

function getCurrentSettingsProject() {
  const projectId = el.projectSettingsId && el.projectSettingsId.value;
  if (!projectId) return null;
  return projects.find((project) => project.id === projectId) || null;
}

function describeLinkBrowseSelection() {
  const selectedPath = browseStateLink.selectedPath || browseStateLink.path || '.';
  const selectedType = browseStateLink.selectedType === 'file' ? 'file' : 'folder';
  return `Selected ${selectedType}: ${selectedPath}`;
}

function updateLinkBrowseSelection(pathValue, type = 'directory') {
  browseStateLink.selectedPath = (pathValue || '').replace(/\\/g, '/');
  browseStateLink.selectedType = type === 'file' ? 'file' : 'directory';
  if (el.linkBrowseSelection) {
    el.linkBrowseSelection.textContent = describeLinkBrowseSelection();
  }
}

function getLinkBrowseStartPath() {
  const currentValue = (el.linkPath && el.linkPath.value ? el.linkPath.value.trim() : '').replace(/\\/g, '/');
  if (currentValue) {
    const parts = currentValue.split('/').filter(Boolean);
    if (parts.length > 1) return parts.slice(0, -1).join('/');
    return '.';
  }
  const project = getCurrentSettingsProject();
  if (project && project.path) return String(project.path).replace(/\\/g, '/');
  return '.';
}

async function loadBrowseForLink(dirPath) {
  const normalized = (dirPath || '.').replace(/\\/g, '/');
  const data = await fetchJSON(`${API}/browse?path=${encodeURIComponent(normalized)}&includeFiles=1`);
  browseStateLink = {
    ...data,
    files: Array.isArray(data.files) ? data.files : [],
    selectedPath: '',
    selectedType: 'directory',
  };
  if (el.linkBrowseCurrent) el.linkBrowseCurrent.textContent = data.absolute || data.path || normalized;
  const dirItems = (data.dirs || []).map((dir) => `
    <li class="browse-entry" data-kind="directory" data-path="${escapeAttr(dir.path)}">
      <button type="button" class="browse-entry-main" data-action="open-directory" data-path="${escapeAttr(dir.path)}">📁 ${escapeHtml(dir.name)}</button>
      <button type="button" class="btn btn-small btn-secondary browse-entry-select" data-action="select-directory" data-path="${escapeAttr(dir.path)}">Select</button>
    </li>
  `);
  const fileItems = (data.files || []).map((file) => `
    <li class="browse-entry" data-kind="file" data-path="${escapeAttr(file.path)}">
      <button type="button" class="browse-entry-main" data-action="select-file" data-path="${escapeAttr(file.path)}">📄 ${escapeHtml(file.name)}</button>
      <button type="button" class="btn btn-small btn-secondary browse-entry-select" data-action="select-file" data-path="${escapeAttr(file.path)}">Select</button>
    </li>
  `);
  if (el.linkBrowseDirs) {
    el.linkBrowseDirs.innerHTML = [...dirItems, ...fileItems].join('') || '<li class="browse-empty">No files or folders here.</li>';
    el.linkBrowseDirs.querySelectorAll('[data-action="open-directory"]').forEach((button) => {
      button.addEventListener('click', async () => {
        await logUiEvent('project-settings-links', 'browse-open-directory', { path: button.dataset.path || '' });
        await loadBrowseForLink(button.dataset.path || '.');
      });
    });
    el.linkBrowseDirs.querySelectorAll('[data-action="select-directory"], [data-action="select-file"]').forEach((button) => {
      button.addEventListener('click', () => {
        const isFile = button.dataset.action === 'select-file';
        updateLinkBrowseSelection(button.dataset.path || '', isFile ? 'file' : 'directory');
      });
    });
  }
  updateLinkBrowseSelection(data.path || '.', 'directory');
}

function initEventListeners() {
  if (el.projectContextPin) el.projectContextPin.addEventListener('click', async (e) => {
    e.stopPropagation();
    await setProjectPinned(contextMenuProjectId, true);
    closeProjectContextMenu();
  });
  if (el.projectContextUnpin) el.projectContextUnpin.addEventListener('click', async (e) => {
    e.stopPropagation();
    await setProjectPinned(contextMenuProjectId, false);
    closeProjectContextMenu();
  });
  if (el.projectContextOpenCursor) el.projectContextOpenCursor.addEventListener('click', async (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj && proj.path) {
      const admin = proj.openInCursorAdmin === true;
      if (admin) await openInCursorAdmin(proj.path);
      else await openInCursor(proj.path);
    }
    closeProjectContextMenu();
  });
  if (el.projectContextOpenExplorer) el.projectContextOpenExplorer.addEventListener('click', async (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj && proj.path) openInExplorer(proj.path);
    closeProjectContextMenu();
  });
  if (el.projectContextSettings) el.projectContextSettings.addEventListener('click', (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj) openProjectSettingsModal(proj);
    closeProjectContextMenu();
  });
  if (el.projectContextSftp) el.projectContextSftp.addEventListener('click', (e) => {
    e.stopPropagation();
    const proj = projects.find(p => p.id === contextMenuProjectId);
    if (proj) openSFTPModal(proj);
    closeProjectContextMenu();
  });
  if (el.projectContextAddSubproject) el.projectContextAddSubproject.addEventListener('click', (e) => {
    e.stopPropagation();
    if (contextMenuProjectId) openAddProject(contextMenuProjectId);
    closeProjectContextMenu();
  });
  if (el.projectContextRemove) el.projectContextRemove.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (contextMenuProjectId) await removeProject(contextMenuProjectId);
    closeProjectContextMenu();
  });
  document.addEventListener('click', () => closeProjectContextMenu());

  if (el.btnAddProject) el.btnAddProject.addEventListener('click', () => openAddProject());
  if (el.btnProjectScreenBack) {
    el.btnProjectScreenBack.addEventListener('click', () => {
      void logUiEvent(taskState.view || 'project', 'back-to-projects', { projectId: selectedProjectId });
      selectedProjectId = null;
      taskState.project = null;
      taskState.tasks = [];
      resetPhaseFiveState();
      integrationState.projectId = null;
      integrationState.git = null;
      integrationState.github = null;
      integrationState.events = [];
      setAppView('list');
      renderProjects();
      scrollProjectViewToTop();
    });
  }

  function attachToolbarListeners() {
    if (el.toolbarSearch) el.toolbarSearch.addEventListener('input', () => renderProjects());
    if (el.toolbarSearch) el.toolbarSearch.addEventListener('change', () => renderProjects());
    if (el.toolbarSort) el.toolbarSort.addEventListener('change', () => renderProjects());
    if (el.toolbarView) el.toolbarView.addEventListener('change', () => renderProjects());
    if (el.toolbarGroup) el.toolbarGroup.addEventListener('change', () => renderProjects());
  }
  attachToolbarListeners();

  setupCategoryInput(el.projectCategory, el.projectCategoryList);
  setupTagsInput(el.projectTagsChips, el.projectTagsInput, el.projectTagsSuggestions, projectTagsArray);
  setupCategoryInput(el.projectSettingsCategory, el.projectSettingsCategoryList);
  setupTagsInput(el.projectSettingsTagsChips, el.projectSettingsTagsInput, el.projectSettingsTagsSuggestions, projectSettingsTagsArray);

  if (el.btnCancelProject) el.btnCancelProject.addEventListener('click', () => el.modalProject && el.modalProject.close());

    if (el.btnProjectSettingsBrowse) el.btnProjectSettingsBrowse.addEventListener('click', async () => {
      if (el.projectSettingsBrowsePanel) el.projectSettingsBrowsePanel.hidden = false;
      await loadBrowseForProjectSettings('.');
    });

  if (el.projectSettingsBrowseUp) el.projectSettingsBrowseUp.addEventListener('click', async () => {
    if (!browseStateSettings.path) return;
    const parts = browseStateSettings.path.replace(/\\/g, '/').split('/').filter(Boolean);
    const up = parts.length ? parts.slice(0, -1).join('/') : '.';
    await loadBrowseForProjectSettings(up);
  });

    if (el.projectSettingsBrowseSelect) el.projectSettingsBrowseSelect.addEventListener('click', () => {
      if (el.projectSettingsPath) el.projectSettingsPath.value = browseStateSettings.path || browseStateSettings.absolute || '';
      if (el.projectSettingsBrowsePanel) el.projectSettingsBrowsePanel.hidden = true;
    });
    if (el.btnLinkBrowse) el.btnLinkBrowse.addEventListener('click', async () => {
      if (el.linkBrowsePanel) el.linkBrowsePanel.hidden = false;
      await logUiEvent('project-settings-links', 'browse-open', { startPath: getLinkBrowseStartPath() });
      await loadBrowseForLink(getLinkBrowseStartPath());
    });
    if (el.linkBrowseUp) el.linkBrowseUp.addEventListener('click', async () => {
      const current = (browseStateLink.path || '').replace(/\\/g, '/');
      if (!current || current === '.') {
        updateLinkBrowseSelection('.', 'directory');
        return;
      }
      const parts = current.split('/').filter(Boolean);
      const up = parts.length ? parts.slice(0, -1).join('/') : '.';
      await logUiEvent('project-settings-links', 'browse-up', { from: current, to: up || '.' });
      await loadBrowseForLink(up || '.');
    });
    if (el.linkBrowseSelectFolder) el.linkBrowseSelectFolder.addEventListener('click', () => {
      updateLinkBrowseSelection(browseStateLink.path || '.', 'directory');
    });
    if (el.linkBrowseSelect) el.linkBrowseSelect.addEventListener('click', async () => {
      const selectedPath = browseStateLink.selectedPath || browseStateLink.path || '.';
      if (el.linkPath) el.linkPath.value = selectedPath;
      if (el.linkBrowsePanel) el.linkBrowsePanel.hidden = true;
      await logUiEvent('project-settings-links', 'browse-select', {
        path: selectedPath,
        selectedType: browseStateLink.selectedType || 'directory',
      });
    });
  }

function updateProjectSettingsImageFieldsVisibility() {
  const useUrl = el.projectSettingsImageSourceUrl && el.projectSettingsImageSourceUrl.checked;
  if (el.fieldProjectSettingsImageLocal) el.fieldProjectSettingsImageLocal.hidden = useUrl;
  if (el.fieldProjectSettingsImageUrl) el.fieldProjectSettingsImageUrl.hidden = !useUrl;
}

// Crop modal state: which project we're setting the image for
const CROP_VIEWPORT = 300;
let cropModalProjectId = null;

function openCropModal(dataUrl, projectId) {
  cropModalProjectId = projectId;
  el.cropZoom.min = '0.1';
  el.cropZoom.max = '4';
  el.cropZoom.value = '1';
  el.cropZoomValue.textContent = '100%';
  el.cropPanX.value = '0';
  el.cropPanY.value = '0';
  function setCropZoomRange() {
    const nw = el.cropImage.naturalWidth;
    const nh = el.cropImage.naturalHeight;
    if (!nw || !nh) return;
    // Min scale = zoom all the way out so image fits, but not past 1:1 (crop source must be at least VIEWPORT px)
    const fitScale = Math.min(CROP_VIEWPORT / nw, CROP_VIEWPORT / nh);
    const scaleMin = Math.min(1, fitScale);
    const scaleMinRounded = Math.max(0.01, Math.round(scaleMin * 100) / 100);
    el.cropZoom.min = String(scaleMinRounded);
    el.cropZoom.value = String(scaleMinRounded);
    el.cropZoomValue.textContent = Math.round(scaleMinRounded * 100) + '%';
    applyCropTransform();
  }
  el.cropImage.onload = setCropZoomRange;
  el.cropImage.src = dataUrl;
  if (el.cropImage.complete && el.cropImage.naturalWidth) setCropZoomRange();
  applyCropTransform();
  el.modalCropImage.showModal();
}

function applyCropTransform() {
  const scale = parseFloat(el.cropZoom.value) || 1;
  const panX = parseInt(el.cropPanX.value, 10) || 0;
  const panY = parseInt(el.cropPanY.value, 10) || 0;
  el.cropImage.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

  if (el.cropZoom) el.cropZoom.addEventListener('input', () => {
    if (el.cropZoomValue) el.cropZoomValue.textContent = Math.round(parseFloat(el.cropZoom.value) * 100) + '%';
    applyCropTransform();
  });
  if (el.cropPanX) el.cropPanX.addEventListener('input', applyCropTransform);
  if (el.cropPanY) el.cropPanY.addEventListener('input', applyCropTransform);
  if (el.btnCropCancel) el.btnCropCancel.addEventListener('click', () => el.modalCropImage && el.modalCropImage.close());
  if (el.btnCropApply) el.btnCropApply.addEventListener('click', async () => {
    if (!cropModalProjectId || !el.cropImage.complete || !el.cropImage.naturalWidth) return;
    const scale = parseFloat(el.cropZoom.value) || 1;
    const panX = parseInt(el.cropPanX.value, 10) || 0;
    const panY = parseInt(el.cropPanY.value, 10) || 0;
    const srcX = Math.max(0, -panX / scale);
    const srcY = Math.max(0, -panY / scale);
    const srcW = Math.min(el.cropImage.naturalWidth - srcX, CROP_VIEWPORT / scale);
    const srcH = Math.min(el.cropImage.naturalHeight - srcY, CROP_VIEWPORT / scale);
    if (srcW <= 0 || srcH <= 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = CROP_VIEWPORT;
    canvas.height = CROP_VIEWPORT;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(el.cropImage, srcX, srcY, srcW, srcH, 0, 0, CROP_VIEWPORT, CROP_VIEWPORT);
    const imageData = canvas.toDataURL('image/png');
    try {
      await fetchJSON(`${API}/projects/${cropModalProjectId}/image`, {
        method: 'PUT',
        body: JSON.stringify({ imageData }),
      });
      if (el.modalCropImage) el.modalCropImage.close();
      await loadProjects();
      if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
    } catch (err) {
      alert(err.message || 'Failed to save image');
    }
  });

  document.querySelectorAll('input[name="project-image-source"]').forEach(radio => {
    radio.addEventListener('change', updateProjectSettingsImageFieldsVisibility);
  });
  if (el.btnProjectSettingsImage) el.btnProjectSettingsImage.addEventListener('click', () => el.projectSettingsImageFile && el.projectSettingsImageFile.click());
  if (el.projectSettingsImageFile) el.projectSettingsImageFile.addEventListener('change', () => {
    const file = el.projectSettingsImageFile.files[0];
    el.projectSettingsImageFile.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const projectId = el.projectSettingsId ? el.projectSettingsId.value : '';
    if (!projectId) return;
    const reader = new FileReader();
    reader.onload = () => openCropModal(reader.result, projectId);
    reader.readAsDataURL(file);
  });
  if (el.btnProjectSettingsRemoveImage) el.btnProjectSettingsRemoveImage.addEventListener('click', async () => {
    const id = el.projectSettingsId ? el.projectSettingsId.value : '';
    if (!id) return;
    try {
      await fetchJSON(`${API}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ imagePath: null, imageUrl: null }),
      });
      if (el.projectSettingsImageUrl) el.projectSettingsImageUrl.value = '';
      await loadProjects();
      if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
    } catch (err) {
      alert(err.message || 'Failed to remove image');
    }
  });

  if (el.btnProjectSettingsAddLink) el.btnProjectSettingsAddLink.addEventListener('click', () => openLinkModal());
  if (el.btnProjectSettingsAddPlugin) el.btnProjectSettingsAddPlugin.addEventListener('click', () => openPluginModal());
  if (el.btnLinkCancel) el.btnLinkCancel.addEventListener('click', () => el.modalLink && el.modalLink.close());
  if (el.btnLinkSave) el.btnLinkSave.addEventListener('click', () => saveLinkFromModal());
  if (el.btnPluginCancel) el.btnPluginCancel.addEventListener('click', () => el.modalPlugin && el.modalPlugin.close());
  if (el.btnPluginSave) el.btnPluginSave.addEventListener('click', () => savePluginFromModal());
  document.querySelectorAll('input[name="link-type"]').forEach(radio => {
    radio.addEventListener('change', updateLinkModalFieldsVisibility);
  });
  if (el.pluginType) el.pluginType.addEventListener('change', updatePluginModalFieldsVisibility);

  if (el.formProjectSettings) el.formProjectSettings.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = el.projectSettingsId ? el.projectSettingsId.value : '';
    const path = el.projectSettingsPath ? el.projectSettingsPath.value.trim() : '';
    const url = el.projectSettingsUrl ? el.projectSettingsUrl.value.trim() : '';
    const description = el.projectSettingsDescription ? el.projectSettingsDescription.value.trim() : '';
    const primaryAction = el.projectSettingsPrimaryAction ? el.projectSettingsPrimaryAction.value : 'auto';
    const serverId = el.projectSettingsServer ? el.projectSettingsServer.value || null : null;
    const category = el.projectSettingsCategory ? el.projectSettingsCategory.value.trim() || null : null;
    const tags = getTagsFromChips(el.projectSettingsTagsChips);
    const selectedSoftwareModules = getSelectedSoftwareModulesFromSettings();
    const currentProject = projects.find((project) => project.id === id) || null;
    const enabledCoreModules = Array.isArray(currentProject && currentProject.modules)
      ? currentProject.modules.filter((module) => module && module.group === 'core' && module.enabled).map((module) => module.moduleKey)
      : ['roadmap', 'board', 'gantt', 'work_items', 'documents', 'integrations'];
    const payload = {
      description,
      primaryAction,
      serverId,
      category,
      tags,
      links: projectSettingsLinks,
      integrations: {
        github: {
          enabled: !!(el.projectSettingsGithubEnabled && el.projectSettingsGithubEnabled.checked),
          owner: el.projectSettingsGithubOwner ? el.projectSettingsGithubOwner.value.trim() : '',
          repo: el.projectSettingsGithubRepo ? el.projectSettingsGithubRepo.value.trim() : '',
        },
        webhooks: {
          autoCreateTasks: !!(el.projectSettingsWebhookAutoTasks && el.projectSettingsWebhookAutoTasks.checked),
          taskStatus: el.projectSettingsWebhookStatus ? el.projectSettingsWebhookStatus.value : 'todo',
          taskPrefix: el.projectSettingsWebhookPrefix ? el.projectSettingsWebhookPrefix.value.trim() || 'Webhook' : 'Webhook',
          endpoints: [{ id: 'default', name: 'Default webhook' }],
        },
        plugins: projectSettingsPlugins.map((plugin, index) => ({
          id: plugin.id || `plugin-${index + 1}`,
          name: plugin.name || `Plugin ${index + 1}`,
          type: plugin.type || 'webhook_forward',
          targetUrl: plugin.targetUrl || '',
          method: plugin.method || 'POST',
          headers: plugin.headers && typeof plugin.headers === 'object' ? plugin.headers : {},
          includeProjectContext: plugin.includeProjectContext !== false,
        })),
      },
    };
    if (el.fieldProjectSettingsPath && !el.fieldProjectSettingsPath.hidden) {
      payload.path = path || undefined;
    }
    if (el.fieldProjectSettingsUrl && !el.fieldProjectSettingsUrl.hidden && url) {
      payload.url = url;
    }
    const useImageUrl = el.projectSettingsImageSourceUrl && el.projectSettingsImageSourceUrl.checked;
    if (useImageUrl && el.projectSettingsImageUrl) {
      const imageUrl = el.projectSettingsImageUrl.value.trim();
      payload.imageUrl = imageUrl || null;
      payload.imagePath = null;
    } else {
      payload.imageUrl = null;
    }
    try {
      await fetchJSON(`${API}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const removedModules = projectSettingsSoftwareModulesOriginal.filter((moduleKey) => !selectedSoftwareModules.includes(moduleKey));
      const cleanupModules = removedModules.filter((moduleKey) => !confirm(`Remove the ${moduleKey.replace(/_/g, ' ')} module but keep its generated files and linked data? Click Cancel to clean them up as part of removal.`));
      const nextProjectType = selectedSoftwareModules.length || ((currentProject && currentProject.projectType) === 'software')
        ? 'software'
        : 'general';
      await updateProjectModules(id, [...new Set([...enabledCoreModules, ...selectedSoftwareModules])], nextProjectType, cleanupModules);
      if (el.modalProjectSettings) el.modalProjectSettings.close();
      await loadProjects();
      taskState.project = getSelectedProject();
      if (taskState.project && taskState.project.id === id) await refreshTaskWorkspace();
      await enrichProjectsWithGit();
    } catch (err) {
      alert(err.message || 'Failed to save');
    }
  });

  if (el.btnCancelProjectSettings) el.btnCancelProjectSettings.addEventListener('click', () => el.modalProjectSettings && el.modalProjectSettings.close());

  // --- Menu File / View ---
  document.querySelectorAll('.menu-dropdown .menu-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = trigger.closest('.menu-dropdown');
      if (parent) {
        document.querySelectorAll('.menu-dropdown').forEach(d => {
          if (d !== parent) d.classList.remove('open');
        });
        parent.classList.toggle('open');
      }
    });
  });
  if (el.menuSettings) el.menuSettings.addEventListener('click', async () => {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
    try {
      await openSettingsModal();
    } catch (err) {
      alert(err.message || 'Failed to load settings');
    }
  });
  if (el.menuViewLogs) el.menuViewLogs.addEventListener('click', async () => {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
    try {
      await fetchJSON(`${API}/view-logs`, { method: 'POST' });
    } catch (e) {
      alert(e.message || 'Failed to open logs');
    }
  });
  if (el.menuRestartApp) el.menuRestartApp.addEventListener('click', async () => {
    document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open'));
    if (typeof window.electronAPI !== 'undefined' && window.electronAPI.restartApp) {
      await window.electronAPI.restartApp();
    } else {
      alert('Restart is only available in the desktop app.');
    }
  });
  document.addEventListener('click', () => document.querySelectorAll('.menu-dropdown').forEach(d => d.classList.remove('open')));

// --- Color scheme ---
function getSavedScheme() {
  try {
    const saved = localStorage.getItem(COLOR_SCHEME_KEY);
    return saved && SCHEMES[saved] ? saved : 'cyan-glow';
  } catch {
    return 'cyan-glow';
  }
}

function applyScheme(schemeId) {
  const scheme = SCHEMES[schemeId] || SCHEMES['cyan-glow'];
  document.documentElement.dataset.scheme = schemeId;
  try {
    localStorage.setItem(COLOR_SCHEME_KEY, schemeId);
  } catch (e) {}
  if (typeof window.electronAPI !== 'undefined' && window.electronAPI.setTheme) {
    window.electronAPI.setTheme({ scheme: schemeId, backgroundColor: scheme.backgroundColor });
  }
}

// --- Test connection (no window.prompt in Electron) ---
async function runTestConnection(host, port, user, password, keyPath, btn) {
  const origTitle = btn ? btn.title : '';
  if (btn) {
    btn.title = 'Testing…';
    btn.disabled = true;
  }
  try {
    const result = await fetch(`${API}/credentials/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, user, password: password || undefined, keyPath: keyPath || undefined }),
    });
    const data = await result.json().catch(() => ({}));
    if (result.ok && data.ok) {
      alert('Connection successful.');
    } else {
      alert(data.error || 'Connection failed.');
    }
  } catch (err) {
    alert(err.message || 'Connection test failed.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.title = origTitle;
    }
  }
}

// --- Settings modal (File → Settings) ---
async function openSettingsModal() {
  await loadSettings();
  if (el.settingsColorScheme) el.settingsColorScheme.value = getSavedScheme();
  if (el.settingsProjectRoot) {
    el.settingsProjectRoot.value = (appSettings.projects && appSettings.projects.projectRoot) || projectsRoot || '';
  }
  if (el.settingsGithubApiBaseUrl) {
    el.settingsGithubApiBaseUrl.value = (appSettings.integrations && appSettings.integrations.githubApiBaseUrl) || 'https://api.github.com';
  }
  if (el.settingsGithubToken) el.settingsGithubToken.value = '';
  if (el.settingsWebhookSecret) el.settingsWebhookSecret.value = '';
  if (el.settingsGithubTokenHint) {
    el.settingsGithubTokenHint.textContent = appSettings.integrations && appSettings.integrations.githubTokenMasked
      ? 'A GitHub token is already configured. Leave blank to keep it.'
      : 'Used for issues and pull requests.';
  }
  if (el.settingsWebhookSecretHint) {
    el.settingsWebhookSecretHint.textContent = appSettings.integrations && appSettings.integrations.webhookSecretConfigured
      ? 'A webhook secret is already configured. Leave blank to keep it.'
      : 'Optional shared secret expected in x-apm-webhook-secret.';
  }
  const navItems = document.querySelectorAll('[data-settings-view-nav]');
  const views = document.querySelectorAll('[data-settings-view]');
  navItems.forEach(btn => btn.classList.remove('is-active'));
  views.forEach(view => view.classList.remove('is-active'));
  const firstNav = document.querySelector('[data-settings-view-nav="projects"]');
  const firstView = document.querySelector('[data-settings-view="projects"]');
  if (firstNav) firstNav.classList.add('is-active');
  if (firstView) firstView.classList.add('is-active');
  renderSettingsServersList();
  clearSettingsServerForm();
  el.modalSettings.showModal();
}

function renderSettingsServersList() {
  el.settingsServersList.innerHTML = credentials.map(c =>
    `<li>
      <div class="settings-server-main">
        <div class="settings-server-name">${escapeHtml(c.name)}</div>
        <div class="settings-server-meta">${escapeHtml(c.user)}@${escapeHtml(c.host)}:${c.port}</div>
      </div>
      <div class="settings-server-actions">
        <button type="button" class="btn-icon btn-test-server" data-id="${c.id}" title="Test Connection" aria-label="Test Connection">⏱</button>
        <button type="button" class="btn-icon btn-edit-server" data-id="${c.id}" aria-label="Edit server">✎</button>
        <button type="button" class="btn-icon btn-icon-danger btn-delete-server" data-id="${c.id}" aria-label="Delete server">🗑</button>
      </div>
    </li>`
  ).join('');
  el.settingsServersList.querySelectorAll('.btn-test-server').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = credentials.find(x => x.id === btn.dataset.id);
      if (!c) return;
      const host = (c.host || '').trim();
      const port = c.port || 22;
      const user = (c.user || '').trim();
      const keyPath = (c.keyPath || '').trim();
      if (!host || !user) {
        alert('Host and username are required to test this server.');
        return;
      }
      if (keyPath) {
        runTestConnection(host, port, user, '', keyPath, btn);
      } else {
        pendingTestConnection = { host, port, user, keyPath: '', btn };
        if (el.testConnectionLabel) el.testConnectionLabel.textContent = `Enter password for ${user}@${host} (not saved; used only for this test).`;
        if (el.testConnectionPasswordInput) {
          el.testConnectionPasswordInput.value = '';
          el.testConnectionPasswordInput.focus();
        }
        if (el.modalTestConnectionPassword) el.modalTestConnectionPassword.showModal();
      }
    });
  });
  el.settingsServersList.querySelectorAll('.btn-edit-server').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = credentials.find(x => x.id === btn.dataset.id);
      if (c) {
        el.settingsCredId.value = c.id;
        el.settingsCredName.value = c.name;
        el.settingsCredHost.value = c.host;
        el.settingsCredPort.value = String(c.port);
        el.settingsCredUser.value = c.user;
        el.settingsCredPassword.value = '';
        el.settingsCredKey.value = c.keyPath || '';
        if (el.modalSettingsServerTitle) el.modalSettingsServerTitle.textContent = 'Edit SFTP server';
        if (el.btnSettingsSaveServer) el.btnSettingsSaveServer.textContent = 'Save server';
        if (el.modalSettingsServer) el.modalSettingsServer.showModal();
      }
    });
  });
  el.settingsServersList.querySelectorAll('.btn-delete-server').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this server?')) return;
      await fetchJSON(`${API}/credentials/${btn.dataset.id}`, { method: 'DELETE' });
      await loadCredentials();
      renderSettingsServersList();
    });
  });
}

function clearSettingsServerForm() {
  el.settingsCredId.value = '';
  el.settingsCredName.value = '';
  el.settingsCredHost.value = '';
  el.settingsCredPort.value = '22';
  el.settingsCredUser.value = '';
  el.settingsCredPassword.value = '';
  el.settingsCredKey.value = '';
  if (el.btnSettingsSaveServer) el.btnSettingsSaveServer.textContent = 'Save server';
  if (el.modalSettingsServerTitle) el.modalSettingsServerTitle.textContent = 'Add SFTP server';
}

  if (el.btnSettingsSaveServer) el.btnSettingsSaveServer.addEventListener('click', async () => {
    const id = el.settingsCredId ? el.settingsCredId.value : '';
    const name = el.settingsCredName ? el.settingsCredName.value.trim() : '';
    const host = el.settingsCredHost ? el.settingsCredHost.value.trim() : '';
    const port = parseInt(el.settingsCredPort ? el.settingsCredPort.value : '22', 10) || 22;
    const user = el.settingsCredUser ? el.settingsCredUser.value.trim() : '';
    const passwordVal = el.settingsCredPassword ? el.settingsCredPassword.value : '';
    const keyPath = el.settingsCredKey ? el.settingsCredKey.value.trim() || null : null;
    if (!name || !host || !user) {
      alert('Short name, host, and username are required.');
      return;
    }
    const body = { name, host, port, user, keyPath };
    if (id) {
      if (passwordVal !== '') body.password = passwordVal;
    } else {
      body.password = passwordVal || null;
    }
    try {
      if (id) {
        await fetchJSON(`${API}/credentials/${id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        await fetchJSON(`${API}/credentials`, { method: 'POST', body: JSON.stringify(body) });
      }
      await loadCredentials();
      renderSettingsServersList();
      clearSettingsServerForm();
      if (el.modalSettingsServer) el.modalSettingsServer.close();
    } catch (err) {
      alert(err.message || 'Failed to save server');
    }
  });

  if (el.btnSettingsClearServer) el.btnSettingsClearServer.addEventListener('click', clearSettingsServerForm);
  if (el.settingsColorScheme) el.settingsColorScheme.addEventListener('change', () => {
    const schemeId = el.settingsColorScheme.value;
    if (SCHEMES[schemeId]) applyScheme(schemeId);
  });
  document.querySelectorAll('[data-settings-view-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-settings-view-nav');
      document.querySelectorAll('[data-settings-view-nav]').forEach(b => b.classList.remove('is-active'));
      document.querySelectorAll('[data-settings-view]').forEach(view => view.classList.remove('is-active'));
      btn.classList.add('is-active');
      const view = document.querySelector(`[data-settings-view="${target}"]`);
      if (view) view.classList.add('is-active');
    });
  });
  if (el.btnSettingsAddServer) {
    el.btnSettingsAddServer.addEventListener('click', () => {
      clearSettingsServerForm();
      if (el.modalSettingsServer) el.modalSettingsServer.showModal();
    });
  }
  if (el.btnSettingsServerCancel) {
    el.btnSettingsServerCancel.addEventListener('click', () => {
      clearSettingsServerForm();
      if (el.modalSettingsServer) el.modalSettingsServer.close();
    });
  }
  if (el.btnTestConnectionCancel) {
    el.btnTestConnectionCancel.addEventListener('click', () => {
      pendingTestConnection = null;
      if (el.modalTestConnectionPassword) el.modalTestConnectionPassword.close();
    });
  }
  if (el.btnTestConnectionSubmit && el.testConnectionPasswordInput) {
    el.btnTestConnectionSubmit.addEventListener('click', async () => {
      if (!pendingTestConnection) return;
      const password = el.testConnectionPasswordInput.value || '';
      if (!password && !pendingTestConnection.keyPath) {
        alert('Password is required when no key path is configured.');
        return;
      }
      const { host, port, user, keyPath, btn } = pendingTestConnection;
      pendingTestConnection = null;
      if (el.modalTestConnectionPassword) el.modalTestConnectionPassword.close();
      await runTestConnection(host, port, user, password, keyPath, btn);
    });
  }
  if (el.btnSettingsTestConnection) {
    el.btnSettingsTestConnection.addEventListener('click', async () => {
      const host = (el.settingsCredHost && el.settingsCredHost.value) ? el.settingsCredHost.value.trim() : '';
      const port = parseInt((el.settingsCredPort && el.settingsCredPort.value) ? el.settingsCredPort.value : '22', 10) || 22;
      const user = (el.settingsCredUser && el.settingsCredUser.value) ? el.settingsCredUser.value.trim() : '';
      const password = (el.settingsCredPassword && el.settingsCredPassword.value) ? el.settingsCredPassword.value : '';
      const keyPath = (el.settingsCredKey && el.settingsCredKey.value) ? el.settingsCredKey.value.trim() : '';
      if (!host || !user) {
        alert('Host and username are required to test the connection.');
        return;
      }
      if (!password && !keyPath) {
        alert('Enter a password or private key path to test the connection.');
        return;
      }
      const origLabel = el.btnSettingsTestConnection.textContent;
      el.btnSettingsTestConnection.textContent = 'Testing…';
      el.btnSettingsTestConnection.disabled = true;
      try {
        const result = await fetch(`${API}/credentials/test`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, user, password: password || undefined, keyPath: keyPath || undefined }),
        });
        const data = await result.json().catch(() => ({}));
        if (result.ok && data.ok) {
          alert('Connection successful.');
        } else {
          alert(data.error || 'Connection failed.');
        }
      } catch (err) {
        alert(err.message || 'Connection test failed.');
      } finally {
        el.btnSettingsTestConnection.textContent = origLabel;
        el.btnSettingsTestConnection.disabled = false;
      }
    });
  }
  if (el.btnSaveSettings) el.btnSaveSettings.addEventListener('click', async () => {
    const desiredProjectRoot = el.settingsProjectRoot ? el.settingsProjectRoot.value.trim() : '';
    if (!desiredProjectRoot) {
      alert('Project Root is required.');
      return;
    }

    const originalLabel = el.btnSaveSettings.textContent;
    el.btnSaveSettings.textContent = 'Saving…';
    el.btnSaveSettings.disabled = true;
    try {
      const integrationsPayload = {
        githubApiBaseUrl: el.settingsGithubApiBaseUrl ? el.settingsGithubApiBaseUrl.value.trim() || 'https://api.github.com' : 'https://api.github.com',
      };
      if (el.settingsGithubToken && el.settingsGithubToken.value !== '') integrationsPayload.githubToken = el.settingsGithubToken.value;
      if (el.settingsWebhookSecret && el.settingsWebhookSecret.value !== '') integrationsPayload.webhookSecret = el.settingsWebhookSecret.value;

      await fetchJSON(`${API}/settings`, {
        method: 'PUT',
        body: JSON.stringify({
          projects: { projectRoot: desiredProjectRoot },
          integrations: integrationsPayload,
        }),
      });
      await loadRoot();
      await loadSettings();
      await loadProjects();
      await loadCredentials();
      await enrichProjectsWithGit();
    } catch (err) {
      alert(err.message || 'Failed to save settings');
      return;
    } finally {
      el.btnSaveSettings.textContent = originalLabel;
      el.btnSaveSettings.disabled = false;
    }

    if (el.modalSettings) el.modalSettings.close();
  });
  if (el.btnCancelSettings) el.btnCancelSettings.addEventListener('click', () => el.modalSettings && el.modalSettings.close());
  if (el.btnIntegrationRefreshGit) {
    el.btnIntegrationRefreshGit.addEventListener('click', async () => {
      void logUiEvent('integrations', 'refresh-git');
      try {
        await refreshIntegrationWorkspace();
      } catch (error) {
        alert(error.message || 'Failed to refresh git information');
      }
    });
  }
  if (el.btnIntegrationRefreshGithub) {
    el.btnIntegrationRefreshGithub.addEventListener('click', async () => {
      void logUiEvent('integrations', 'refresh-github');
      try {
        await refreshIntegrationWorkspace();
      } catch (error) {
        alert(error.message || 'Failed to refresh GitHub information');
      }
    });
  }
  if (el.btnIntegrationRefreshEvents) {
    el.btnIntegrationRefreshEvents.addEventListener('click', async () => {
      void logUiEvent('integrations', 'refresh-events');
      try {
        await refreshIntegrationWorkspace();
      } catch (error) {
        alert(error.message || 'Failed to refresh integration events');
      }
    });
  }
  if (el.btnGitFetch) el.btnGitFetch.addEventListener('click', async () => {
    try { await runGitAction(`${API}/git/fetch`); } catch (error) { alert(error.message || 'Failed to fetch'); }
  });
  if (el.btnGitPull) el.btnGitPull.addEventListener('click', async () => {
    try { await runGitAction(`${API}/git/pull`); } catch (error) { alert(error.message || 'Failed to pull'); }
  });
  if (el.btnGitPush) el.btnGitPush.addEventListener('click', async () => {
    try { await runGitAction(`${API}/git/push`); } catch (error) { alert(error.message || 'Failed to push'); }
  });
  if (el.btnGitCheckout) el.btnGitCheckout.addEventListener('click', async () => {
    try { await runGitAction(`${API}/git/checkout`, { branch: el.integrationBranchSelect ? el.integrationBranchSelect.value : '' }); } catch (error) { alert(error.message || 'Failed to checkout branch'); }
  });
  if (el.btnGitCreateBranch) el.btnGitCreateBranch.addEventListener('click', async () => {
    try {
      await runGitAction(`${API}/git/branches`, { name: el.integrationBranchCreate ? el.integrationBranchCreate.value.trim() : '', checkout: true });
      if (el.integrationBranchCreate) el.integrationBranchCreate.value = '';
    } catch (error) {
      alert(error.message || 'Failed to create branch');
    }
  });
  if (el.btnGitMerge) el.btnGitMerge.addEventListener('click', async () => {
    try { await runGitAction(`${API}/git/merge`, { branch: el.integrationMergeBranch ? el.integrationMergeBranch.value : '' }); } catch (error) { alert(error.message || 'Failed to merge branch'); }
  });
  if (el.btnGitAbortMerge) el.btnGitAbortMerge.addEventListener('click', async () => {
    try { await runGitAction(`${API}/git/merge`, { abort: true }); } catch (error) { alert(error.message || 'Failed to abort merge'); }
  });
  if (el.btnGithubCreateIssue) el.btnGithubCreateIssue.addEventListener('click', async () => {
    if (!taskState.project) return;
    try {
      await fetchJSON(`${API}/github/projects/${taskState.project.id}/issues`, {
        method: 'POST',
        body: JSON.stringify({
          title: el.integrationIssueTitle ? el.integrationIssueTitle.value.trim() : '',
          body: el.integrationIssueBody ? el.integrationIssueBody.value : '',
        }),
      });
      if (el.integrationIssueTitle) el.integrationIssueTitle.value = '';
      if (el.integrationIssueBody) el.integrationIssueBody.value = '';
      await refreshIntegrationWorkspace();
    } catch (error) {
      alert(error.message || 'Failed to create GitHub issue');
    }
  });
  if (el.btnGithubCreatePr) el.btnGithubCreatePr.addEventListener('click', async () => {
    if (!taskState.project) return;
    try {
      await fetchJSON(`${API}/github/projects/${taskState.project.id}/pulls`, {
        method: 'POST',
        body: JSON.stringify({
          title: el.integrationPrTitle ? el.integrationPrTitle.value.trim() : '',
          head: el.integrationPrHead ? el.integrationPrHead.value.trim() : '',
          base: el.integrationPrBase ? el.integrationPrBase.value.trim() : '',
          body: el.integrationPrBody ? el.integrationPrBody.value : '',
        }),
      });
      if (el.integrationPrTitle) el.integrationPrTitle.value = '';
      if (el.integrationPrHead) el.integrationPrHead.value = '';
      if (el.integrationPrBase) el.integrationPrBase.value = '';
      if (el.integrationPrBody) el.integrationPrBody.value = '';
      await refreshIntegrationWorkspace();
    } catch (error) {
      alert(error.message || 'Failed to create pull request');
    }
  });
  if (el.btnToolExplorer) el.btnToolExplorer.addEventListener('click', async () => { try { await runBuiltInIntegration('explorer'); } catch (error) { alert(error.message || 'Failed to open Explorer'); } });
  if (el.btnToolCursor) el.btnToolCursor.addEventListener('click', async () => { try { await runBuiltInIntegration('cursor'); } catch (error) { alert(error.message || 'Failed to open Cursor'); } });
  if (el.btnToolVscode) el.btnToolVscode.addEventListener('click', async () => { try { await runBuiltInIntegration('vscode'); } catch (error) { alert(error.message || 'Failed to open VS Code'); } });
  if (el.btnToolTerminal) el.btnToolTerminal.addEventListener('click', async () => { try { await runBuiltInIntegration('terminal'); } catch (error) { alert(error.message || 'Failed to open Terminal'); } });
  if (el.btnToolChrome) el.btnToolChrome.addEventListener('click', async () => { try { await runBuiltInIntegration('chrome'); } catch (error) { alert(error.message || 'Failed to open Chrome'); } });
  if (el.btnTaskAdd) {
    el.btnTaskAdd.addEventListener('click', () => {
      void logUiEvent(taskState.view === 'gantt' ? 'gantt' : 'board', 'click-add-task');
      openTaskEditor();
    });
  }
  if (el.btnRoadmapPhaseAdd) {
    el.btnRoadmapPhaseAdd.addEventListener('click', () => {
      void logUiEvent('roadmap', 'click-add-phase');
      openRoadmapPhaseModal();
    });
  }
  if (el.btnRoadmapRefresh) {
    el.btnRoadmapRefresh.addEventListener('click', async () => {
      void logUiEvent('roadmap', 'refresh-roadmap');
      try {
        await refreshTaskWorkspace();
      } catch (error) {
        alert(error.message || 'Failed to refresh roadmap');
      }
    });
  }
  if (el.btnRoadmapFragmentsRefresh) {
    el.btnRoadmapFragmentsRefresh.addEventListener('click', async () => {
      void logUiEvent('roadmap', 'refresh-roadmap-fragments');
      try {
        await refreshTaskWorkspace();
      } catch (error) {
        alert(error.message || 'Failed to refresh roadmap fragments');
      }
    });
  }
  if (el.btnFeatureAdd) {
    el.btnFeatureAdd.addEventListener('click', () => {
      void logUiEvent('features', 'click-add-feature');
      openFeatureModal();
    });
  }
  if (el.btnBugAdd) {
    el.btnBugAdd.addEventListener('click', () => {
      void logUiEvent('bugs', 'click-add-bug');
      openBugModal();
    });
  }
  if (el.btnPrdSave) {
    el.btnPrdSave.addEventListener('click', async () => {
      try {
        await savePrdDocument();
      } catch (error) {
        alert(error.message || 'Failed to save PRD');
      }
    });
  }
  if (el.btnPrdFragmentsRefresh) {
    el.btnPrdFragmentsRefresh.addEventListener('click', async () => {
      try {
        void logUiEvent('prd', 'refresh-fragments');
        await refreshTaskWorkspace();
      } catch (error) {
        alert(error.message || 'Failed to refresh PRD fragments');
      }
    });
  }
  if (el.btnRoadmapPhaseCancel) {
    el.btnRoadmapPhaseCancel.addEventListener('click', () => {
      if (el.modalRoadmapPhase) el.modalRoadmapPhase.close();
    });
  }
  if (el.btnFeatureCancel) {
    el.btnFeatureCancel.addEventListener('click', () => {
      if (el.modalFeature) el.modalFeature.close();
    });
  }
  if (el.btnBugCancel) {
    el.btnBugCancel.addEventListener('click', () => {
      if (el.modalBug) el.modalBug.close();
    });
  }
  if (el.btnTaskEditorCancel) {
    el.btnTaskEditorCancel.addEventListener('click', () => {
      if (el.modalTaskEditor) el.modalTaskEditor.close();
    });
  }
  if (el.formTaskEditor) {
    el.formTaskEditor.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await saveTaskFromEditor();
      } catch (err) {
        alert(err.message || 'Failed to save task');
      }
    });
  }
  if (el.formRoadmapPhase) {
    el.formRoadmapPhase.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await saveRoadmapPhaseFromModal();
      } catch (error) {
        alert(error.message || 'Failed to save roadmap phase');
      }
    });
  }
  if (el.formFeature) {
    el.formFeature.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await saveFeatureFromModal();
      } catch (error) {
        alert(error.message || 'Failed to save feature');
      }
    });
  }
  if (el.formBug) {
    el.formBug.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await saveBugFromModal();
      } catch (error) {
        alert(error.message || 'Failed to save bug');
      }
    });
  }
  document.querySelectorAll('[data-roadmap-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      phase5State.roadmapPanel = button.dataset.roadmapPanel || 'general';
      renderRoadmapWorkspace();
    });
  });
  document.querySelectorAll('[data-roadmap-phase-panel]').forEach((button) => {
    button.addEventListener('click', () => {
      phase5State.roadmapPhasePanel = button.dataset.roadmapPhasePanel || 'planner';
      renderRoadmapWorkspace();
    });
  });
  document.querySelectorAll('[data-roadmap-bucket-group]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.roadmapBucketGroup;
      const kind = button.dataset.roadmapBucketKind;
      if (!group || !kind) return;
      phase5State.roadmapBucketTabs[group] = kind;
      renderRoadmapWorkspace();
    });
  });
  if (el.btnRoadmapMergeFragments) {
    el.btnRoadmapMergeFragments.addEventListener('click', () => {
      if (el.modalRoadmapFragments) el.modalRoadmapFragments.showModal();
    });
  }
  if (el.btnRoadmapFragmentsClose) {
    el.btnRoadmapFragmentsClose.addEventListener('click', () => {
      if (el.modalRoadmapFragments) el.modalRoadmapFragments.close();
    });
  }
  if (el.btnFragmentPreviewClose) {
    el.btnFragmentPreviewClose.addEventListener('click', () => {
      if (el.modalFragmentPreview) el.modalFragmentPreview.close();
    });
  }
  if (el.btnWorkItemDetailClose) {
    el.btnWorkItemDetailClose.addEventListener('click', () => {
      if (el.modalWorkItemDetail) el.modalWorkItemDetail.close();
    });
  }
  if (el.btnWorkItemDetailEdit) {
    el.btnWorkItemDetailEdit.addEventListener('click', () => {
      const kind = el.btnWorkItemDetailEdit.dataset.kind;
      const id = el.btnWorkItemDetailEdit.dataset.id;
      if (el.modalWorkItemDetail) el.modalWorkItemDetail.close();
      if (kind === 'feature') {
        const feature = getFeaturesList().find((entry) => entry.id === id);
        if (feature) openFeatureModal(feature);
      } else if (kind === 'bug') {
        const bug = getBugsList().find((entry) => entry.id === id);
        if (bug) openBugModal(bug);
      } else {
        const task = taskState.tasks.find((entry) => entry.id === id);
        if (task) openTaskEditor(task);
      }
    });
  }

function getAllCategories() {
  const set = new Set();
  projects.forEach(p => { if (p.category && p.category.trim()) set.add(p.category.trim()); });
  return [...set].sort();
}

function getAllTags() {
  const set = new Set();
  projects.forEach(p => { (p.tags || []).forEach(t => { if (t != null && String(t).trim()) set.add(String(t).trim()); }); });
  return [...set].sort();
}

function populateCategoryDatalist(datalistEl, inputValue) {
  if (!datalistEl) return;
  const all = getAllCategories();
  const val = (inputValue || '').toLowerCase();
  const filtered = val ? all.filter(c => c.toLowerCase().includes(val)) : all;
  datalistEl.innerHTML = filtered.map(c => `<option value="${escapeAttr(c)}">`).join('');
}

function renderTagsChips(container, tags, onRemove) {
  if (!container) return;
  container.innerHTML = tags.map((t, i) =>
    `<span class="tag-chip" data-index="${i}">${escapeHtml(String(t))}<button type="button" class="tag-chip-x" aria-label="Remove tag">×</button></span>`
  ).join('');
  container.querySelectorAll('.tag-chip-x').forEach(btn => {
    btn.addEventListener('click', () => { onRemove(parseInt(btn.closest('.tag-chip').dataset.index, 10)); });
  });
}

let projectTagsArray = [];
let projectSettingsTagsArray = [];
let projectSettingsLinks = [];
let projectSettingsPlugins = [];
let projectSettingsSoftwareModulesOriginal = [];

function getTagsFromChips(container) {
  if (!container) return [];
  return [...container.querySelectorAll('.tag-chip')].map(chip => chip.textContent.replace(/\s*×\s*$/, '').trim()).filter(Boolean);
}

function makeTagsRemoveFn(container, arr) {
  return function(i) {
    arr.splice(i, 1);
    renderTagsChips(container, arr, makeTagsRemoveFn(container, arr));
  };
}

function replaceArrayContents(target, values) {
  target.splice(0, target.length, ...(Array.isArray(values) ? values : []));
}

function setupTagsInput(container, inputEl, suggestionsEl, arr) {
  if (!inputEl || !container) return;
  const updateChips = () => renderTagsChips(container, arr, makeTagsRemoveFn(container, arr));
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputEl.value.trim();
      if (val && !arr.includes(val)) {
        arr.push(val);
        updateChips();
        inputEl.value = '';
        if (suggestionsEl) { suggestionsEl.hidden = true; suggestionsEl.innerHTML = ''; }
      }
    }
  });
  inputEl.addEventListener('input', () => {
    const val = inputEl.value.trim().toLowerCase();
    if (!suggestionsEl) return;
    if (!val) { suggestionsEl.hidden = true; suggestionsEl.innerHTML = ''; return; }
    const all = getAllTags().filter(t => !arr.includes(t));
    const filtered = all.filter(t => t.toLowerCase().includes(val));
    suggestionsEl.innerHTML = filtered.slice(0, 10).map(t =>
      `<div class="tags-suggestions-item" data-tag="${escapeAttr(t)}">${escapeHtml(t)}</div>`
    ).join('');
    suggestionsEl.hidden = filtered.length === 0;
    suggestionsEl.querySelectorAll('.tags-suggestions-item').forEach(item => {
      item.addEventListener('click', () => {
        const tag = item.dataset.tag;
        if (tag && !arr.includes(tag)) {
          arr.push(tag);
          updateChips();
          inputEl.value = '';
          suggestionsEl.hidden = true;
          suggestionsEl.innerHTML = '';
        }
      });
    });
  });
  inputEl.addEventListener('blur', () => {
    setTimeout(() => { if (suggestionsEl) suggestionsEl.hidden = true; }, 150);
  });
}

function setupCategoryInput(inputEl, datalistEl) {
  if (!inputEl || !datalistEl) return;
  inputEl.addEventListener('focus', () => populateCategoryDatalist(datalistEl, inputEl.value));
  inputEl.addEventListener('input', () => populateCategoryDatalist(datalistEl, inputEl.value));
}

function renderSettingsLinksList() {
  if (!el.projectSettingsLinksList) return;
  el.projectSettingsLinksList.innerHTML = projectSettingsLinks.map((link, i) => {
    const type = link.type === 'file' ? 'file' : 'url';
    const typeLabel = type === 'file' ? 'file' : 'url';
    const actionLabel = getClickActionLabel(link.action || 'auto');
    return `<li data-index="${i}" class="link-item">
      <span class="link-desc">${escapeHtml(link.description || 'Link')}</span>
      <span class="link-type-badge">${typeLabel}</span>
      <span class="link-type-badge">${escapeHtml(actionLabel)}</span>
      <span class="link-url" title="${escapeAttr(link.url)}">${escapeHtml(link.url)}</span>
      <button type="button" class="btn btn-ghost btn-small btn-remove-link" data-index="${i}" aria-label="Remove link">×</button>
    </li>`;
  }).join('');
  el.projectSettingsLinksList.querySelectorAll('.link-item').forEach(li => {
    li.addEventListener('click', (e) => {
      if (e.target.closest('.btn-remove-link')) return;
      const i = parseInt(li.dataset.index, 10);
      openLinkModal(i);
    });
  });
  el.projectSettingsLinksList.querySelectorAll('.btn-remove-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = parseInt(btn.dataset.index, 10);
      projectSettingsLinks.splice(i, 1);
      renderSettingsLinksList();
    });
  });
}

function renderProjectSettingsPluginsList() {
  if (!el.projectSettingsPluginsList) return;
  el.projectSettingsPluginsList.innerHTML = projectSettingsPlugins.length
    ? projectSettingsPlugins.map((plugin, index) => `
        <li data-index="${index}" class="link-item">
          <span class="link-desc">${escapeHtml(plugin.name || `Plugin ${index + 1}`)}</span>
          <span class="link-type-badge">${escapeHtml((plugin.type || 'webhook_forward').replace(/_/g, ' '))}</span>
          <span class="link-url" title="${escapeAttr(plugin.targetUrl || '')}">${escapeHtml(plugin.targetUrl || '')}</span>
          <button type="button" class="btn btn-ghost btn-small btn-remove-plugin" data-index="${index}" aria-label="Remove integration">Ã—</button>
        </li>
      `).join('')
    : '<li class="integration-empty">No custom integrations configured.</li>';

  el.projectSettingsPluginsList.querySelectorAll('.link-item').forEach((item) => {
    item.addEventListener('click', (event) => {
      if (event.target.closest('.btn-remove-plugin')) return;
      openPluginModal(parseInt(item.dataset.index, 10));
    });
  });
  el.projectSettingsPluginsList.querySelectorAll('.btn-remove-plugin').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      projectSettingsPlugins.splice(parseInt(button.dataset.index, 10), 1);
      renderProjectSettingsPluginsList();
    });
  });
}

function updatePluginModalFieldsVisibility() {
  const isOpenUrl = el.pluginType && el.pluginType.value === 'open_url';
  if (el.fieldPluginMethod) el.fieldPluginMethod.hidden = isOpenUrl;
  if (el.fieldPluginHeaders) el.fieldPluginHeaders.hidden = isOpenUrl;
  if (el.fieldPluginProjectContext) el.fieldPluginProjectContext.hidden = isOpenUrl;
}

function openPluginModal(editIndex = null) {
  const plugin = editIndex != null && projectSettingsPlugins[editIndex] ? projectSettingsPlugins[editIndex] : null;
  if (el.modalPluginTitle) el.modalPluginTitle.textContent = plugin ? 'Edit integration' : 'Add integration';
  if (el.pluginName) el.pluginName.value = plugin ? (plugin.name || '') : '';
  if (el.pluginType) el.pluginType.value = plugin ? (plugin.type || 'webhook_forward') : 'webhook_forward';
  if (el.pluginTargetUrl) el.pluginTargetUrl.value = plugin ? (plugin.targetUrl || '') : '';
  if (el.pluginMethod) el.pluginMethod.value = plugin ? (plugin.method || 'POST') : 'POST';
  if (el.pluginHeaders) el.pluginHeaders.value = plugin && plugin.headers && Object.keys(plugin.headers).length
    ? JSON.stringify(plugin.headers, null, 2)
    : '';
  if (el.pluginIncludeProjectContext) el.pluginIncludeProjectContext.checked = plugin ? plugin.includeProjectContext !== false : true;

  if (plugin && plugin.id) el.modalPlugin.dataset.pluginId = plugin.id;
  else delete el.modalPlugin.dataset.pluginId;
  if (plugin) el.modalPlugin.dataset.editIndex = String(editIndex);
  else delete el.modalPlugin.dataset.editIndex;

  updatePluginModalFieldsVisibility();
  if (el.modalPlugin) el.modalPlugin.showModal();
}

function savePluginFromModal() {
  const name = el.pluginName ? el.pluginName.value.trim() : '';
  const type = el.pluginType ? el.pluginType.value : 'webhook_forward';
  const targetUrl = el.pluginTargetUrl ? el.pluginTargetUrl.value.trim() : '';
  if (!targetUrl) return;

  let headers = {};
  if (type !== 'open_url' && el.pluginHeaders && el.pluginHeaders.value.trim()) {
    try {
      const parsed = JSON.parse(el.pluginHeaders.value);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Headers must be a JSON object.');
      headers = parsed;
    } catch (error) {
      alert(error.message || 'Invalid headers JSON');
      return;
    }
  }

  const plugin = {
    id: el.modalPlugin.dataset.pluginId || '',
    name: name || 'Custom integration',
    type,
    targetUrl,
    method: type === 'open_url' ? 'GET' : (el.pluginMethod ? el.pluginMethod.value : 'POST'),
    headers,
    includeProjectContext: type === 'open_url' ? false : !!(el.pluginIncludeProjectContext && el.pluginIncludeProjectContext.checked),
  };

  const editIndex = el.modalPlugin.dataset.editIndex != null ? parseInt(el.modalPlugin.dataset.editIndex, 10) : null;
  if (editIndex != null && projectSettingsPlugins[editIndex]) {
    projectSettingsPlugins[editIndex] = plugin;
  } else {
    projectSettingsPlugins.push(plugin);
  }

  renderProjectSettingsPluginsList();
  if (el.modalPlugin) el.modalPlugin.close();
}

function updateLinkModalFieldsVisibility() {
  const isFile = el.linkTypeFile && el.linkTypeFile.checked;
  if (el.fieldLinkUrl) el.fieldLinkUrl.hidden = isFile;
  if (el.fieldLinkPath) el.fieldLinkPath.hidden = !isFile;
  if (!isFile && el.linkBrowsePanel) el.linkBrowsePanel.hidden = true;
}

function openLinkModal(editIndex = null) {
  const isEdit = editIndex != null && projectSettingsLinks[editIndex];
  if (isEdit) {
    const link = projectSettingsLinks[editIndex];
    el.linkDescription.value = link.description;
    const isFile = link.type === 'file';
    if (el.linkTypeUrl) el.linkTypeUrl.checked = !isFile;
    if (el.linkTypeFile) el.linkTypeFile.checked = isFile;
    el.linkUrl.value = isFile ? '' : link.url;
    if (el.linkPath) el.linkPath.value = isFile ? link.url : '';
      if (el.linkAction) el.linkAction.value = link.action || 'auto';
      el.modalLink.dataset.editIndex = String(editIndex);
    } else {
      el.linkDescription.value = '';
      if (el.linkTypeUrl) el.linkTypeUrl.checked = true;
    if (el.linkTypeFile) el.linkTypeFile.checked = false;
    el.linkUrl.value = '';
    if (el.linkPath) el.linkPath.value = '';
      if (el.linkAction) el.linkAction.value = 'auto';
      delete el.modalLink.dataset.editIndex;
    }
  browseStateLink = { path: '', absolute: '', dirs: [], files: [], selectedPath: '', selectedType: 'directory' };
  if (el.linkBrowsePanel) el.linkBrowsePanel.hidden = true;
  if (el.linkBrowseDirs) el.linkBrowseDirs.innerHTML = '';
  if (el.linkBrowseCurrent) el.linkBrowseCurrent.textContent = '';
  updateLinkBrowseSelection((el.linkPath && el.linkPath.value.trim()) || '.', 'directory');
  updateLinkModalFieldsVisibility();
  document.getElementById('modal-link-title').textContent = isEdit ? 'Edit link' : 'Add link';
  el.modalLink.showModal();
}

function saveLinkFromModal() {
  const desc = el.linkDescription.value.trim();
  const isFile = el.linkTypeFile && el.linkTypeFile.checked;
  const value = isFile ? (el.linkPath && el.linkPath.value.trim()) : (el.linkUrl && el.linkUrl.value.trim());
  if (!value) return;
  const link = {
    type: isFile ? 'file' : 'url',
    description: desc,
    url: value,
    action: el.linkAction ? el.linkAction.value : 'auto',
  };
  const editIndex = el.modalLink.dataset.editIndex != null ? parseInt(el.modalLink.dataset.editIndex, 10) : null;
    if (editIndex != null && projectSettingsLinks[editIndex] != null) {
      projectSettingsLinks[editIndex] = link;
    } else {
      projectSettingsLinks.push(link);
    }
  void logUiEvent('project-settings-links', editIndex != null ? 'update-link' : 'create-link', {
    linkType: link.type,
    action: link.action,
    value,
  });
  renderSettingsLinksList();
  el.modalLink.close();
}

  document.querySelectorAll('input[name="project-type"]').forEach(radio => {
    radio.addEventListener('change', updateAddProjectFieldsVisibility);
  });

  if (el.formProject) el.formProject.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = el.projectId.value;
  const name = el.projectName.value.trim();
  const description = el.projectDescription.value.trim();
  const parentId = el.projectParentId.value || null;
  const category = el.projectCategory ? el.projectCategory.value.trim() || null : null;
  const tags = getTagsFromChips(el.projectTagsChips);
  try {
    if (id) {
      await fetchJSON(`${API}/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, description, category, tags }),
      });
    } else {
      const isUrl = el.projectTypeUrl && el.projectTypeUrl.checked;
      const path = el.projectPath ? el.projectPath.value.trim() : '';
      const url = el.projectUrl ? el.projectUrl.value.trim() : '';
      if (isUrl) {
        if (!url || !/^https?:\/\//i.test(url)) {
          alert('Please enter a valid URL (e.g. https://…).');
          return;
        }
        await fetchJSON(`${API}/projects`, {
          method: 'POST',
          body: JSON.stringify({ type: 'url', url, name, description, parentId, category, tags }),
        });
      } else {
        if (!path) {
          alert('Please select a folder first.');
          return;
        }
        await fetchJSON(`${API}/projects`, {
          method: 'POST',
          body: JSON.stringify({ type: 'folder', path, name, description, parentId, category, tags }),
        });
      }
    }
    el.modalProject.close();
    await loadProjects();
  } catch (err) {
    alert(err.message || 'Failed to save');
  }
});

// Browse folder
  if (el.btnBrowse) el.btnBrowse.addEventListener('click', async () => {
    if (el.browsePanel) el.browsePanel.hidden = false;
    await loadBrowse('.');
  });

  if (el.browseUp) el.browseUp.addEventListener('click', async () => {
  if (!browseState.path) return;
  const parts = browseState.path.replace(/\\/g, '/').split('/').filter(Boolean);
  const up = parts.length ? parts.slice(0, -1).join('/') : '.';
  await loadBrowse(up);
});

  if (el.browseSelect) el.browseSelect.addEventListener('click', () => {
    if (el.projectPath) el.projectPath.value = browseState.path || browseState.absolute || '';
    if (el.browsePanel) el.browsePanel.hidden = true;
  });

async function loadBrowse(dirPath) {
  const normalized = dirPath.replace(/\\/g, '/');
  const data = await fetchJSON(`${API}/browse?path=${encodeURIComponent(normalized)}`);
  browseState = data;
  el.browseCurrent.textContent = data.absolute || data.path || dirPath;
  const sep = '/';
  el.browseDirs.innerHTML = data.dirs.map(d => {
    const subPath = data.path ? data.path + sep + d.name : d.name;
    return `<li data-path="${escapeAttr(subPath)}">${escapeHtml(d.name)}</li>`;
  }).join('');
  el.browseDirs.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', async () => {
      await loadBrowse(li.dataset.path);
    });
  });
}

// Credentials
function openCredentialsModal() {
  renderCredentialsList();
  el.modalCredentials.showModal();
}

function renderCredentialsList() {
  el.credentialsList.innerHTML = credentials.map(c =>
    `<li>
       <span><strong>${escapeHtml(c.name)}</strong> — ${escapeHtml(c.user)}@${escapeHtml(c.host)}:${c.port}</span>
       <button type="button" class="btn btn-small btn-danger btn-delete-cred" data-id="${c.id}">Delete</button>
     </li>`
  ).join('');
  el.credentialsList.querySelectorAll('.btn-delete-cred').forEach(btn => {
    btn.addEventListener('click', async () => {
      await fetchJSON(`${API}/credentials/${btn.dataset.id}`, { method: 'DELETE' });
      await loadCredentials();
      renderCredentialsList();
    });
  });
}

  if (el.formCredential) el.formCredential.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('cred-name').value.trim();
  const host = document.getElementById('cred-host').value.trim();
  const port = parseInt(document.getElementById('cred-port').value, 10) || 22;
  const user = document.getElementById('cred-user').value.trim();
  const password = document.getElementById('cred-password').value || null;
  const keyPath = document.getElementById('cred-key').value.trim() || null;
  try {
    await fetchJSON(`${API}/credentials`, {
      method: 'POST',
      body: JSON.stringify({ name, host, port, user, password, keyPath }),
    });
    document.getElementById('cred-name').value = '';
    document.getElementById('cred-host').value = '';
    document.getElementById('cred-port').value = '22';
    document.getElementById('cred-user').value = '';
    document.getElementById('cred-password').value = '';
    document.getElementById('cred-key').value = '';
    await loadCredentials();
    renderCredentialsList();
  } catch (err) {
    alert(err.message || 'Failed to save credential');
  }
});

  if (el.btnCloseCredentials) el.btnCloseCredentials.addEventListener('click', () => el.modalCredentials && el.modalCredentials.close());

  if (el.sftpBtnCancel) el.sftpBtnCancel.addEventListener('click', () => el.modalSftp && el.modalSftp.close());
  if (el.sftpBtnSaveMappings) el.sftpBtnSaveMappings.addEventListener('click', async () => {
    if (!sftpState.project) return;
    syncCurrentGroupFromState();
    try {
      await fetchJSON(`${API}/projects/${sftpState.project.id}`, {
        method: 'PUT',
        body: JSON.stringify({ mappingGroups: sftpState.mappingGroups }),
      });
      await loadProjects();
      if (typeof enrichProjectsWithGit === 'function') await enrichProjectsWithGit();
      if (el.modalSftp) el.modalSftp.close();
    } catch (err) {
      alert(err.message || 'Failed to save mappings');
    }
  });
  if (el.sftpGroupSelect) el.sftpGroupSelect.addEventListener('change', () => {
    syncCurrentGroupFromState();
    sftpState.selectedGroupId = el.sftpGroupSelect.value || null;
    setCurrentGroupMappings();
    sftpState.editingMappingIndex = null;
    sftpState.editingDownloadMappingIndex = null;
    renderSftpMappings();
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  });
  if (el.sftpGroupAdd) el.sftpGroupAdd.addEventListener('click', async () => {
    syncCurrentGroupFromState();
    const name = await showMappingGroupNameModal('Name for the new mapping group', 'New group');
    const groupName = (name != null && name.trim()) ? name.trim() : 'New group';
    const id = 'g-' + Date.now();
    sftpState.mappingGroups.push({ id, name: groupName, uploadMappings: [], downloadMappings: [] });
    sftpState.selectedGroupId = id;
    setCurrentGroupMappings();
    sftpState.editingMappingIndex = null;
    sftpState.editingDownloadMappingIndex = null;
    renderSftpGroupSelect();
    renderSftpMappings();
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  });
  if (el.sftpGroupEdit) el.sftpGroupEdit.addEventListener('click', async () => {
    const g = getCurrentGroup();
    if (!g) return;
    const name = await showMappingGroupNameModal('Rename mapping group', g.name);
    if (name != null && name.trim()) {
      g.name = name.trim();
      renderSftpGroupSelect();
    }
  });
  if (el.mappingGroupNameCancel) el.mappingGroupNameCancel.addEventListener('click', () => {
    if (sftpState.groupNameModalResolve) {
      sftpState.groupNameModalResolve(null);
      sftpState.groupNameModalResolve = null;
    }
    if (el.modalMappingGroupName) el.modalMappingGroupName.close();
  });
  if (el.mappingGroupNameOk) el.mappingGroupNameOk.addEventListener('click', () => {
    const value = el.mappingGroupNameInput ? el.mappingGroupNameInput.value.trim() : '';
    if (sftpState.groupNameModalResolve) {
      sftpState.groupNameModalResolve(value);
      sftpState.groupNameModalResolve = null;
    }
    if (el.modalMappingGroupName) el.modalMappingGroupName.close();
  });
  if (el.mappingGroupNameInput) el.mappingGroupNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (el.mappingGroupNameOk) el.mappingGroupNameOk.click();
    }
    if (e.key === 'Escape') {
      if (el.mappingGroupNameCancel) el.mappingGroupNameCancel.click();
    }
  });
  if (el.modalMappingGroupName) el.modalMappingGroupName.addEventListener('close', () => {
    if (sftpState.groupNameModalResolve) {
      sftpState.groupNameModalResolve(null);
      sftpState.groupNameModalResolve = null;
    }
  });
  if (el.sftpGroupDelete) el.sftpGroupDelete.addEventListener('click', () => {
    const groups = sftpState.mappingGroups || [];
    if (groups.length <= 1) {
      alert('Keep at least one group.');
      return;
    }
    syncCurrentGroupFromState();
    const idx = groups.findIndex(gg => gg.id === sftpState.selectedGroupId);
    groups.splice(idx, 1);
    sftpState.selectedGroupId = groups[0] ? groups[0].id : null;
    setCurrentGroupMappings();
    sftpState.editingMappingIndex = null;
    sftpState.editingDownloadMappingIndex = null;
    renderSftpGroupSelect();
    renderSftpMappings();
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
  });
  if (el.sftpBtnRunDownload) el.sftpBtnRunDownload.addEventListener('click', () => runSftpDownload());
  if (el.sftpBtnSend) el.sftpBtnSend.addEventListener('click', () => addSftpMapping());
  if (el.sftpBtnAddDownloadMapping) el.sftpBtnAddDownloadMapping.addEventListener('click', () => addSftpDownloadMapping());
  if (el.sftpOverwrite) el.sftpOverwrite.addEventListener('change', () => {
    if (el.sftpAskOverwrite) { el.sftpAskOverwrite.disabled = !el.sftpOverwrite.checked; if (!el.sftpOverwrite.checked) el.sftpAskOverwrite.checked = false; }
  });
  if (el.sftpBtnRun) el.sftpBtnRun.addEventListener('click', () => runSftpUpload());
  if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.addEventListener('click', () => {
    if (sftpState.editingMappingIndex == null) return;
    const m = sftpState.mappings[sftpState.editingMappingIndex];
    if (!m) return;
    m.overwrite = !!(el.sftpOverwrite && el.sftpOverwrite.checked);
    m.askBeforeOverwrite = !!(el.sftpAskOverwrite && el.sftpAskOverwrite.checked);
    sftpState.editingMappingIndex = null;
    if (el.sftpBtnUpdateMapping) el.sftpBtnUpdateMapping.hidden = true;
    renderSftpMappings();
  });
  if (el.sftpProgressClose) el.sftpProgressClose.addEventListener('click', () => el.modalSftpProgress && el.modalSftpProgress.close());
  if (el.sftpOverwriteNo) el.sftpOverwriteNo.addEventListener('click', () => { if (sftpState.overwriteResolve) sftpState.overwriteResolve(false); });
  if (el.sftpOverwriteYes) el.sftpOverwriteYes.addEventListener('click', () => { if (sftpState.overwriteResolve) sftpState.overwriteResolve(true); });
  document.addEventListener('click', (e) => {
    if (el.sftpRemoteContextMenu && !el.sftpRemoteContextMenu.hidden && !el.sftpRemoteContextMenu.contains(e.target)) closeSftpRemoteContextMenu();
  });
  if (el.sftpRemoteContextDownload) el.sftpRemoteContextDownload.addEventListener('click', (e) => {
    e.stopPropagation();
    openSftpDownloadModal();
  });
  if (el.sftpRemoteContextAddDownloadMapping) el.sftpRemoteContextAddDownloadMapping.addEventListener('click', (e) => {
    e.stopPropagation();
    closeSftpRemoteContextMenu();
    addSftpDownloadMapping();
  });
  if (el.sftpDownloadCancel) el.sftpDownloadCancel.addEventListener('click', () => el.modalSftpDownload && el.modalSftpDownload.close());
  if (el.sftpDownloadRun) el.sftpDownloadRun.addEventListener('click', async () => {
    const remotePath = sftpState.downloadRemotePath;
    const baseDir = (el.sftpDownloadLocalPath && el.sftpDownloadLocalPath.value.trim()) || (sftpState.project && sftpState.project.path) || '.';
    const remoteName = remotePath ? remotePath.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'download' : 'download';
    const localPath = baseDir.replace(/\/$/, '') + '/' + remoteName;
    if (!sftpState.credId || !remotePath) return;
    if (el.modalSftpDownload) el.modalSftpDownload.close();
    if (el.modalSftpProgress) el.modalSftpProgress.showModal();
    if (el.sftpProgressLog) el.sftpProgressLog.innerHTML = '';
    if (el.sftpProgressClose) el.sftpProgressClose.disabled = true;
    sftpLog(`Downloading ${remotePath} → ${localPath}…`);
    try {
      await runSftpDownloadOne(remotePath, localPath);
      sftpLog(`Done: ${localPath}`);
    } catch (err) {
      sftpLog(`Error: ${err.message || 'Download failed'}`);
    }
    sftpLog('Download finished.');
    if (el.sftpProgressClose) el.sftpProgressClose.disabled = false;
  });
  if (el.sftpDownloadBrowse) el.sftpDownloadBrowse.addEventListener('click', async () => {
    const base = (el.sftpDownloadLocalPath && el.sftpDownloadLocalPath.value.trim()) || '.';
    const panel = el.sftpDownloadBrowsePanel;
    const dirsEl = el.sftpDownloadBrowseDirs;
    if (!panel || !dirsEl) return;
    panel.hidden = false;
    dirsEl.innerHTML = '<li class="browse-loading">Loading…</li>';
    try {
      const data = await fetchJSON(`${API}/browse?path=${encodeURIComponent(base)}`);
      dirsEl.innerHTML = (data.dirs || []).map(d => `<li data-path="${escapeAttr(d.path)}">${escapeHtml(d.name)}</li>`).join('') || '<li class="browse-empty">No subfolders</li>';
      dirsEl.querySelectorAll('li[data-path]').forEach(li => {
        li.addEventListener('click', () => {
          if (el.sftpDownloadLocalPath) el.sftpDownloadLocalPath.value = li.dataset.path;
          panel.hidden = true;
        });
      });
    } catch (err) {
      dirsEl.innerHTML = '<li class="browse-error">' + escapeHtml(err.message || 'Failed to load') + '</li>';
    }
  });

// Load git info for each project and re-render with git
async function enrichProjectsWithGit() {
  for (const p of projects) {
    if (p.type === 'url' || !p.path) {
      p.git = { isRepo: false };
      continue;
    }
    try {
      p.git = await fetchJSON(`${API}/git-info?path=${encodeURIComponent(p.path)}`);
    } catch {
      p.git = { isRepo: false };
    }
  }
  renderProjects();
}

async function init() {
  await loadRoot();
  await loadProjects();
  await loadCredentials();
  await enrichProjectsWithGit();
}

function initElectronTitleBar() {
  if (typeof window.electronAPI === 'undefined' || !el.titleBar) return;
  document.body.classList.add('electron-window');
  el.titleBar.hidden = false;
  if (el.titleBarMinimize) {
    el.titleBarMinimize.addEventListener('click', () => window.electronAPI.windowMinimize());
  }
  if (el.titleBarMaximize) {
    const updateMaximizeIcon = () => {
      window.electronAPI.windowIsMaximized().then((maximized) => {
        el.titleBarMaximize.textContent = maximized ? '❐' : '□';
        el.titleBarMaximize.title = maximized ? 'Restore' : 'Maximize';
      });
    };
    updateMaximizeIcon();
    el.titleBarMaximize.addEventListener('click', () => {
      window.electronAPI.windowMaximize().then(updateMaximizeIcon);
    });
  }
  if (el.titleBarClose) {
    el.titleBarClose.addEventListener('click', () => window.electronAPI.windowClose());
  }
  el.titleBar.addEventListener('dblclick', () => {
    window.electronAPI.windowMaximize().then((maximized) => {
      if (el.titleBarMaximize) {
        el.titleBarMaximize.textContent = maximized ? '❐' : '□';
        el.titleBarMaximize.title = maximized ? 'Restore' : 'Maximize';
      }
    });
  });
}

function startApp() {
  applyScheme(getSavedScheme());
  initElectronTitleBar();
  initEventListeners();
  init().catch(err => {
    console.error(err);
    if (el.projectsList) {
      el.projectsList.innerHTML = `<div class="empty-state"><p>Could not load: ${escapeHtml(err.message)}</p><p>Make sure the server is running (npm start in Angels-Project-Manager).</p></div>`;
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
