const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseGitRemoteUrl } = require('./model-utils');

function runGitCommand(args, cwd) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    const stderr = error && error.stderr ? String(error.stderr).trim() : '';
    const stdout = error && error.stdout ? String(error.stdout).trim() : '';
    const message = stderr || stdout || error.message || 'Git command failed';
    const wrapped = new Error(message);
    wrapped.code = error.code;
    throw wrapped;
  }
}

function isGitRepository(cwd) {
  try {
    return runGitCommand(['rev-parse', '--is-inside-work-tree'], cwd) === 'true';
  } catch {
    return false;
  }
}

function ensureGitRepository(cwd) {
  if (!isGitRepository(cwd)) {
    throw new Error('Path is not a git repository');
  }
}

function parseBranchesOutput(output) {
  if (!output) return [];
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, upstream, hash] = line.split('|');
      return {
        name: name || '',
        upstream: upstream || '',
        hash: hash || '',
      };
    })
    .filter((branch) => branch.name);
}

function getGitInfo(cwd) {
  if (!isGitRepository(cwd)) return { isRepo: false };

  const info = { isRepo: true };
  try { info.branch = runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'], cwd); } catch (_) {}
  try { info.remote = runGitCommand(['remote', 'get-url', 'origin'], cwd); } catch (_) {}
  if (info.remote) {
    const parsed = parseGitRemoteUrl(info.remote);
    info.remoteHost = parsed.host || null;
    info.remoteAccount = parsed.account || null;
    info.remoteRepo = parsed.repo || null;
  }
  try {
    info.remotes = runGitCommand(['remote', '-v'], cwd).split('\n').filter(Boolean).map((line) => {
      const parts = line.split(/\s+/);
      return { name: parts[0], url: parts[1], type: parts[2] === '(fetch)' ? 'fetch' : 'push' };
    });
  } catch (_) {}
  try { info.userName = runGitCommand(['config', 'user.name'], cwd); } catch (_) {}
  try { info.userEmail = runGitCommand(['config', 'user.email'], cwd); } catch (_) {}
  try { info.upstream = runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD@{upstream}'], cwd); } catch (_) {}
  try { info.status = runGitCommand(['status', '--short'], cwd) || null; } catch (_) {}
  try {
    const aheadBehind = runGitCommand(['rev-list', '--left-right', '--count', 'HEAD...@{upstream}'], cwd);
    const [behind, ahead] = aheadBehind.split(/\s+/).map((value) => Number(value || 0));
    info.ahead = ahead || 0;
    info.behind = behind || 0;
  } catch (_) {
    info.ahead = 0;
    info.behind = 0;
  }
  try { info.lastCommit = runGitCommand(['log', '-1', '--format=%h %s'], cwd) || null; } catch (_) {}
  try {
    info.lastCommitHash = runGitCommand(['log', '-1', '--format=%H'], cwd);
    info.lastCommitSubject = runGitCommand(['log', '-1', '--format=%s'], cwd);
    info.lastCommitDate = runGitCommand(['log', '-1', '--format=%ci'], cwd);
    info.lastCommitAuthor = runGitCommand(['log', '-1', '--format=%an <%ae>'], cwd);
  } catch (_) {}
  try {
    info.localBranches = parseBranchesOutput(
      runGitCommand(['for-each-ref', '--format=%(refname:short)|%(upstream:short)|%(objectname:short)', 'refs/heads'], cwd)
    );
  } catch (_) {
    info.localBranches = [];
  }
  try {
    info.remoteBranches = runGitCommand(['for-each-ref', '--format=%(refname:short)', 'refs/remotes'], cwd)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !line.endsWith('/HEAD'));
  } catch (_) {
    info.remoteBranches = [];
  }
  try {
    info.conflictedFiles = runGitCommand(['diff', '--name-only', '--diff-filter=U'], cwd)
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (_) {
    info.conflictedFiles = [];
  }
  try { info.stashCount = runGitCommand(['stash', 'list'], cwd).split('\n').filter(Boolean).length; } catch (_) { info.stashCount = 0; }
  try {
    const gitDir = runGitCommand(['rev-parse', '--git-dir'], cwd);
    info.mergeInProgress = fs.existsSync(path.resolve(cwd, gitDir, 'MERGE_HEAD'));
  } catch (_) {
    info.mergeInProgress = false;
  }

  return info;
}

function listBranches(cwd) {
  ensureGitRepository(cwd);
  return getGitInfo(cwd).localBranches || [];
}

function createBranch(cwd, name, fromRef = 'HEAD', checkout = false) {
  ensureGitRepository(cwd);
  const branchName = String(name || '').trim();
  if (!branchName) throw new Error('Branch name is required');
  const args = checkout ? ['checkout', '-b', branchName, fromRef] : ['branch', branchName, fromRef];
  runGitCommand(args, cwd);
  return getGitInfo(cwd);
}

function checkoutBranch(cwd, branch) {
  ensureGitRepository(cwd);
  const branchName = String(branch || '').trim();
  if (!branchName) throw new Error('Branch is required');
  runGitCommand(['checkout', branchName], cwd);
  return getGitInfo(cwd);
}

function fetchBranch(cwd, remote = 'origin') {
  ensureGitRepository(cwd);
  runGitCommand(['fetch', remote || 'origin'], cwd);
  return getGitInfo(cwd);
}

function pullBranch(cwd, remote = 'origin', branch = '') {
  ensureGitRepository(cwd);
  const args = ['pull', remote || 'origin'];
  if (branch) args.push(branch);
  runGitCommand(args, cwd);
  return getGitInfo(cwd);
}

function pushBranch(cwd, remote = 'origin', branch = '', setUpstream = false) {
  ensureGitRepository(cwd);
  const activeBranch = branch || runGitCommand(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
  const args = ['push'];
  if (setUpstream) args.push('-u');
  args.push(remote || 'origin', activeBranch);
  runGitCommand(args, cwd);
  return getGitInfo(cwd);
}

function mergeBranch(cwd, branch) {
  ensureGitRepository(cwd);
  const branchName = String(branch || '').trim();
  if (!branchName) throw new Error('Branch is required');
  try {
    runGitCommand(['merge', '--no-ff', branchName], cwd);
  } catch (error) {
    const info = getGitInfo(cwd);
    if (info.conflictedFiles && info.conflictedFiles.length) {
      return {
        ok: false,
        conflict: true,
        message: error.message,
        info,
      };
    }
    throw error;
  }
  return {
    ok: true,
    conflict: false,
    info: getGitInfo(cwd),
  };
}

function abortMerge(cwd) {
  ensureGitRepository(cwd);
  runGitCommand(['merge', '--abort'], cwd);
  return getGitInfo(cwd);
}

function resolveMergeConflicts(cwd, files, strategy, complete = false) {
  ensureGitRepository(cwd);
  const checkoutFlag = strategy === 'theirs' ? '--theirs' : '--ours';
  const targetFiles = Array.isArray(files) ? files.map((file) => String(file).trim()).filter(Boolean) : [];
  if (!targetFiles.length) throw new Error('At least one conflicted file is required');

  for (const file of targetFiles) {
    runGitCommand(['checkout', checkoutFlag, '--', file], cwd);
    runGitCommand(['add', '--', file], cwd);
  }
  if (complete) {
    runGitCommand(['commit', '--no-edit'], cwd);
  }
  return getGitInfo(cwd);
}

module.exports = {
  runGitCommand,
  isGitRepository,
  ensureGitRepository,
  getGitInfo,
  listBranches,
  createBranch,
  checkoutBranch,
  fetchBranch,
  pullBranch,
  pushBranch,
  mergeBranch,
  abortMerge,
  resolveMergeConflicts,
};
