const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://nhsign-server:5000',
      changeOrigin: true,
    })
  );

  app.use(
    '/storage',
    createProxyMiddleware({
      target: 'http://nhsign-server:5000',
      changeOrigin: true,
    })
  );

  app.use(
    '/block',
    createProxyMiddleware({
      target: 'http://nhsign-broker:4001',
      changeOrigin: true,
    })
  );
};
