const { getGitInfo } = require('./git-utils');

function getApiBaseUrl(settings = {}) {
  const configured = settings.integrations && settings.integrations.githubApiBaseUrl
    ? String(settings.integrations.githubApiBaseUrl).trim()
    : '';
  return (configured || process.env.APM_GITHUB_API_BASE_URL || 'https://api.github.com').replace(/\/$/, '');
}

function buildHeaders(settings = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': "Angel's Project Manager",
  };
  const token = settings.integrations && settings.integrations.githubToken
    ? String(settings.integrations.githubToken).trim()
    : '';
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function resolveRepositoryForProject(project, gitInfo = null) {
  const github = project && project.integrations ? project.integrations.github || {} : {};
  if (github.enabled === false) return null;
  if (github.owner && github.repo) {
    return { owner: github.owner, repo: github.repo };
  }
  if (gitInfo && gitInfo.remoteAccount && gitInfo.remoteRepo) {
    return { owner: gitInfo.remoteAccount, repo: gitInfo.remoteRepo };
  }
  return null;
}

async function githubRequest(settings, urlPath, options = {}) {
  const baseUrl = getApiBaseUrl(settings);
  const response = await fetch(`${baseUrl}${urlPath}`, {
    ...options,
    headers: {
      ...buildHeaders(settings),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  if (!response.ok) {
    const message = body && typeof body === 'object' && body.message
      ? body.message
      : `${response.status} ${response.statusText}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

async function getGitHubSummary(project, settings) {
  const github = project && project.integrations ? project.integrations.github || {} : {};
  if (github.enabled === false) {
    return {
      connected: false,
      repository: null,
      issues: [],
      pullRequests: [],
      repo: null,
      message: 'GitHub integration is disabled for this project.',
    };
  }

  const gitInfo = project && project.absolutePath ? getGitInfo(project.absolutePath) : null;
  const repository = resolveRepositoryForProject(project, gitInfo);
  if (!repository) {
    return {
      connected: false,
      repository: null,
      issues: [],
      pullRequests: [],
      repo: null,
      message: 'No GitHub repository is configured for this project.',
    };
  }

  const [repo, issues, pullRequests] = await Promise.all([
    githubRequest(settings, `/repos/${repository.owner}/${repository.repo}`),
    githubRequest(settings, `/repos/${repository.owner}/${repository.repo}/issues?state=open&per_page=10`),
    githubRequest(settings, `/repos/${repository.owner}/${repository.repo}/pulls?state=open&per_page=10`),
  ]);

  return {
    connected: true,
    repository,
    repo,
    issues: Array.isArray(issues) ? issues.filter((item) => !item.pull_request) : [],
    pullRequests: Array.isArray(pullRequests) ? pullRequests : [],
    git: gitInfo,
  };
}

async function createGitHubIssue(project, settings, payload = {}) {
  const github = project && project.integrations ? project.integrations.github || {} : {};
  if (github.enabled === false) throw new Error('GitHub integration is disabled for this project.');
  const repository = resolveRepositoryForProject(project, project && project.absolutePath ? getGitInfo(project.absolutePath) : null);
  if (!repository) throw new Error('No GitHub repository is configured for this project.');
  return githubRequest(settings, `/repos/${repository.owner}/${repository.repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: String(payload.title || '').trim(),
      body: payload.body ? String(payload.body) : '',
    }),
  });
}

async function createGitHubPullRequest(project, settings, payload = {}) {
  const github = project && project.integrations ? project.integrations.github || {} : {};
  if (github.enabled === false) throw new Error('GitHub integration is disabled for this project.');
  const repository = resolveRepositoryForProject(project, project && project.absolutePath ? getGitInfo(project.absolutePath) : null);
  if (!repository) throw new Error('No GitHub repository is configured for this project.');
  return githubRequest(settings, `/repos/${repository.owner}/${repository.repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: String(payload.title || '').trim(),
      body: payload.body ? String(payload.body) : '',
      head: String(payload.head || '').trim(),
      base: String(payload.base || '').trim(),
    }),
  });
}

module.exports = {
  getApiBaseUrl,
  buildHeaders,
  resolveRepositoryForProject,
  githubRequest,
  getGitHubSummary,
  createGitHubIssue,
  createGitHubPullRequest,
};
