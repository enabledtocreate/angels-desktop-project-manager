const { startServer } = require('./src/server-app');
const config = require('./src/config');
const { bootstrapStorage } = require('./src/persistence');

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = {
  APP_DIR: config.APP_DIR,
  get PROJECTS_ROOT() { return config.getProjectsRoot(); },
  get DATA_DIR() { return config.getDataDir(); },
  PUBLIC_DIR: config.getPublicDir(),
  bootstrapStorage,
  startServer,
};
