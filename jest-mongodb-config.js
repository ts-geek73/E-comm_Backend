module.exports = {
  mongodbMemoryServerOptions: {
    instance: {
      dbName: 'jest',
    },
    binary: {
      version: '6.0.3', // You can change the version
      skipMD5: true,
    },
    autoStart: false,
  },
};
