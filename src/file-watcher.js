const path = require('path');

let chokidarModulePromise = null;

async function loadChokidar() {
  if (!chokidarModulePromise) {
    chokidarModulePromise = import('chokidar').then((module) => module.default || module);
  }
  return chokidarModulePromise;
}

function normalizeWatchPaths(paths) {
  const values = Array.isArray(paths) ? paths : [paths];
  return [...new Set(values.map((value) => path.resolve(String(value || '').trim())).filter(Boolean))];
}

function normalizeIgnoredPatterns(ignored) {
  const values = Array.isArray(ignored) ? ignored : [];
  return values.map((value) => String(value || '').trim()).filter(Boolean);
}

class FileWatcherService {
  constructor({ logger = null } = {}) {
    this.logger = typeof logger === 'function' ? logger : () => {};
    this.watchers = new Map();
    this.subscribers = new Set();
  }

  log(message) {
    try {
      this.logger(message);
    } catch {
      // ignore logger failures
    }
  }

  listWatches() {
    return [...this.watchers.values()].map((entry) => ({
      watchId: entry.watchId,
      paths: entry.paths.slice(),
      ignored: entry.ignored.slice(),
      createdAt: entry.createdAt,
      lastEventAt: entry.lastEventAt,
    }));
  }

  async watch(watchId, paths, options = {}) {
    const normalizedWatchId = String(watchId || '').trim();
    if (!normalizedWatchId) throw new Error('watchId is required');
    const normalizedPaths = normalizeWatchPaths(paths);
    if (!normalizedPaths.length) throw new Error('At least one watch path is required');
    const ignored = normalizeIgnoredPatterns(options.ignored);

    const existing = this.watchers.get(normalizedWatchId);
    if (existing) {
      const samePaths = JSON.stringify(existing.paths) === JSON.stringify(normalizedPaths);
      const sameIgnored = JSON.stringify(existing.ignored) === JSON.stringify(ignored);
      if (samePaths && sameIgnored) return this.serializeWatch(existing);
      await this.unwatch(normalizedWatchId);
    }

    const chokidar = await loadChokidar();
    const watcher = chokidar.watch(normalizedPaths, {
      ignoreInitial: options.ignoreInitial !== false,
      persistent: options.persistent !== false,
      awaitWriteFinish: options.awaitWriteFinish || {
        stabilityThreshold: 250,
        pollInterval: 50,
      },
      ignored,
    });

    const entry = {
      watchId: normalizedWatchId,
      watcher,
      paths: normalizedPaths,
      ignored,
      createdAt: new Date().toISOString(),
      lastEventAt: null,
    };

    const eventNames = ['add', 'change', 'unlink', 'addDir', 'unlinkDir'];
    eventNames.forEach((eventName) => {
      watcher.on(eventName, (filePath) => {
        entry.lastEventAt = new Date().toISOString();
        this.emit({
          watchId: normalizedWatchId,
          eventType: eventName,
          absolutePath: path.resolve(filePath),
          timestamp: entry.lastEventAt,
        });
      });
    });

    watcher.on('error', (error) => {
      this.emit({
        watchId: normalizedWatchId,
        eventType: 'error',
        absolutePath: '',
        timestamp: new Date().toISOString(),
        error: error && error.message ? error.message : String(error || 'Unknown watcher error'),
      });
    });

    this.watchers.set(normalizedWatchId, entry);
    this.log(`file-watcher: watching ${normalizedWatchId} -> ${normalizedPaths.join(', ')}`);
    return this.serializeWatch(entry);
  }

  async unwatch(watchId) {
    const normalizedWatchId = String(watchId || '').trim();
    const entry = this.watchers.get(normalizedWatchId);
    if (!entry) return false;
    this.watchers.delete(normalizedWatchId);
    await entry.watcher.close();
    this.log(`file-watcher: stopped ${normalizedWatchId}`);
    return true;
  }

  subscribe(listener, watchId = '') {
    if (typeof listener !== 'function') throw new Error('listener must be a function');
    const subscription = {
      listener,
      watchId: String(watchId || '').trim(),
    };
    this.subscribers.add(subscription);
    return () => {
      this.subscribers.delete(subscription);
    };
  }

  emit(event) {
    for (const subscription of this.subscribers) {
      if (subscription.watchId && subscription.watchId !== event.watchId) continue;
      try {
        subscription.listener(event);
      } catch {
        // ignore subscriber errors
      }
    }
  }

  serializeWatch(entry) {
    return {
      watchId: entry.watchId,
      paths: entry.paths.slice(),
      ignored: entry.ignored.slice(),
      createdAt: entry.createdAt,
      lastEventAt: entry.lastEventAt,
    };
  }

  async close() {
    const watchIds = [...this.watchers.keys()];
    for (const watchId of watchIds) {
      await this.unwatch(watchId);
    }
    this.subscribers.clear();
  }
}

module.exports = {
  FileWatcherService,
};
