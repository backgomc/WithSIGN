const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );

  app.use(
    '/storage',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );

  app.use(
    '/block',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
    })
  );
};