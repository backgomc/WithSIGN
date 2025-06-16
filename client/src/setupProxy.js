const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      //target: 'http://34.64.93.94:5001',
      changeOrigin: true,
    })
  );

  app.use(
    '/storage',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      //target: 'http://34.64.93.94:5001',
      changeOrigin: true,
    })
  );

  app.use(
    '/block',
    createProxyMiddleware({
      target: 'http://localhost:3003',
      //target: 'http://34.64.93.94:3003',
      changeOrigin: true,
    })
  );
};