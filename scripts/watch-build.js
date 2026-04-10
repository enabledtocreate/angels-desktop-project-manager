const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const watchTargets = [
  'main.js',
  'preload.js',
  'server.js',
  'migrate-data.js',
  'package.json',
  'public',
  'src',
  'migrations',
  'scripts',
];

const ignoredSegments = new Set([
  '.git',
  'data',
  'dist',
  'node_modules',
]);

const debounceMs = 1000;
const runInitialBuild = process.argv.includes('--initial');

let buildRunning = false;
let buildQueued = false;
let buildTimer = null;

function timestamp() {
  return new Date().toLocaleTimeString();
}

function log(message) {
  process.stdout.write(`[build-watch ${timestamp()}] ${message}\n`);
}

function normalizePath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, '/');
}

function shouldIgnore(filePath) {
  const relativePath = normalizePath(filePath);
  if (!relativePath || relativePath.startsWith('..')) return true;
  return relativePath.split('/').some((segment) => ignoredSegments.has(segment));
}

function queueBuild(reason) {
  if (buildTimer) clearTimeout(buildTimer);
  buildTimer = setTimeout(() => {
    buildTimer = null;
    triggerBuild(reason);
  }, debounceMs);
}

function triggerBuild(reason) {
  if (buildRunning) {
    buildQueued = true;
    log(`change detected while build is running; queued another build (${reason})`);
    return;
  }

  buildRunning = true;
  buildQueued = false;
  log(`starting rebuild (${reason})`);

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npmCommand, ['run', 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  child.on('exit', (code, signal) => {
    buildRunning = false;
    if (signal) log(`build stopped by signal ${signal}`);
    else log(code === 0 ? 'build completed successfully' : `build failed with exit code ${code}`);

    if (buildQueued) {
      buildQueued = false;
      queueBuild('queued changes');
    }
  });

  child.on('error', (error) => {
    buildRunning = false;
    log(`failed to start build: ${error.message}`);
    if (buildQueued) {
      buildQueued = false;
      queueBuild('queued changes');
    }
  });
}

function watchPath(targetPath) {
  const absolutePath = path.join(repoRoot, targetPath);
  if (!fs.existsSync(absolutePath)) return;

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    fs.watch(absolutePath, { recursive: true }, (eventType, filename) => {
      const nextPath = filename ? path.join(absolutePath, filename) : absolutePath;
      if (shouldIgnore(nextPath)) return;
      queueBuild(`${eventType} ${normalizePath(nextPath)}`);
    });
    log(`watching ${targetPath}/**/*`);
    return;
  }

  fs.watch(absolutePath, () => {
    if (shouldIgnore(absolutePath)) return;
    queueBuild(`change ${targetPath}`);
  });
  log(`watching ${targetPath}`);
}

function main() {
  log('starting build watcher');
  watchTargets.forEach(watchPath);

  if (runInitialBuild) {
    triggerBuild('initial run');
  } else {
    log('waiting for changes');
  }
}

main();
