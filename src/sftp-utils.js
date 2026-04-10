const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

function createSshConfig(credential) {
  const config = {
    host: (credential.host || '').trim(),
    port: parseInt(credential.port, 10) || 22,
    username: (credential.user || '').trim(),
    readyTimeout: 20000,
    connectTimeout: 20000,
  };

  if (credential.keyPath && credential.keyPath.trim()) {
    const keyFile = path.resolve(credential.keyPath.trim());
    if (fs.existsSync(keyFile)) {
      const keyContent = fs.readFileSync(keyFile, 'utf8');
      if (keyContent.includes('-----BEGIN')) config.privateKey = keyContent;
    }
  }

  if (!config.privateKey && credential.password) config.password = credential.password;
  return config;
}

function computeDirHashSync(dirAbs) {
  const entries = [];

  function walk(base) {
    const names = fs.readdirSync(path.join(dirAbs, base));
    for (const name of names) {
      const rel = base ? `${base}/${name}` : name;
      const full = path.join(dirAbs, rel);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(rel);
      else {
        const buffer = fs.readFileSync(full);
        const hash = crypto.createHash('md5').update(buffer).digest('hex');
        entries.push({ rel, hash });
      }
    }
  }

  walk('');
  entries.sort((left, right) => left.rel.localeCompare(right.rel));
  const combined = entries.map((entry) => `${entry.rel}:${entry.hash}`).join('\n');
  return crypto.createHash('md5').update(combined, 'utf8').digest('hex');
}

function uploadLocalToRemote(sftp, localAbs, remotePath, overwrite, callback) {
  let called = false;
  const once = (err) => {
    if (called) return;
    called = true;
    callback(err);
  };

  const stat = fs.statSync(localAbs);
  if (stat.isFile()) {
    sftp.stat(remotePath, (errExist) => {
      if (!errExist && !overwrite) return once({ needOverwriteConfirm: true, path: remotePath });
      const readStream = fs.createReadStream(localAbs);
      const writeStream = sftp.createWriteStream(remotePath, { flags: 'w' });
      readStream.on('error', (err) => once(err));
      writeStream.on('error', (err) => once(err));
      writeStream.on('close', () => once(null));
      readStream.pipe(writeStream);
    });
    return;
  }

  if (stat.isDirectory()) {
    sftp.mkdir(remotePath, { mode: 0o755 }, (mkdirErr) => {
      if (!mkdirErr) return uploadDirContents();

      sftp.stat(remotePath, (statErr, remoteStat) => {
        if (!statErr && remoteStat && remoteStat.isDirectory && remoteStat.isDirectory()) {
          return uploadDirContents();
        }

        const isFile = !statErr && remoteStat && (!remoteStat.isDirectory || (typeof remoteStat.isDirectory === 'function' && !remoteStat.isDirectory()));
        const hint = ' Try enabling "Delete before copy" for this mapping to remove the remote path first.';
        const err = isFile
          ? Object.assign(new Error('Remote path exists as a file; use "Delete before copy" or remove it on the server.'), { code: mkdirErr.code })
          : Object.assign(new Error((mkdirErr.message || 'Cannot create directory on server.') + hint), { code: mkdirErr.code });
        return once(err);
      });

      function uploadDirContents() {
        const entries = fs.readdirSync(localAbs, { withFileTypes: true });
        let pending = entries.length;
        if (pending === 0) return once(null);

        let done = false;
        const next = (err) => {
          if (done) return;
          if (err) {
            done = true;
            return once(err);
          }
          pending -= 1;
          if (pending === 0) once(null);
        };

        for (const entry of entries) {
          const localChild = path.join(localAbs, entry.name);
          const remoteChild = `${remotePath === '/' ? '' : remotePath}/${entry.name}`;
          uploadLocalToRemote(sftp, localChild, remoteChild, overwrite, next);
        }
      }
    });
    return;
  }

  once(null);
}

function downloadRemoteToLocal(sftp, remotePath, localAbs, once) {
  let remote = String(remotePath).replace(/\\/g, '/');
  if (!remote.startsWith('/')) remote = `/${remote}`;

  sftp.stat(remote, (err, stat) => {
    if (err) return once(err);

    if (stat.isDirectory && stat.isDirectory()) {
      try {
        if (fs.existsSync(localAbs)) {
          fs.rmSync(localAbs, { recursive: true, force: true });
        }
        if (!fs.existsSync(localAbs)) fs.mkdirSync(localAbs, { recursive: true });
      } catch (mkdirErr) {
        return once(mkdirErr);
      }

      sftp.readdir(remote, (readErr, list) => {
        if (readErr) return once(readErr);
        const entries = (list || []).filter((entry) => entry.filename !== '.' && entry.filename !== '..');
        if (entries.length === 0) return once(null);

        let pending = entries.length;
        let done = false;
        const next = (nextErr) => {
          if (done) return;
          if (nextErr) {
            done = true;
            return once(nextErr);
          }
          pending -= 1;
          if (pending === 0) once(null);
        };

        for (const entry of entries) {
          const childRemote = `${remote === '/' ? '' : remote}/${entry.filename}`;
          const childLocal = path.join(localAbs, entry.filename);
          if (entry.attrs && entry.attrs.isDirectory && entry.attrs.isDirectory()) {
            downloadRemoteToLocal(sftp, childRemote, childLocal, next);
          } else {
            sftp.readFile(childRemote, (childErr, data) => {
              if (childErr) return next(childErr);
              try {
                fs.writeFileSync(childLocal, data);
                next(null);
              } catch (writeErr) {
                next(writeErr);
              }
            });
          }
        }
      });
      return;
    }

    sftp.readFile(remote, (readErr, data) => {
      if (readErr) return once(readErr);
      try {
        const dir = path.dirname(localAbs);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(localAbs, data);
        once(null);
      } catch (writeErr) {
        once(writeErr);
      }
    });
  });
}

function runGit(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

module.exports = {
  createSshConfig,
  computeDirHashSync,
  uploadLocalToRemote,
  downloadRemoteToLocal,
  runGit,
};
