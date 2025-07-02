const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://nhsign-server:5000', // ✅ 여기 변경
      changeOrigin: true,
    })
  );

  app.use(
    '/storage',
    createProxyMiddleware({
      target: 'http://nhsign-server:5000', // ✅ 여기도
      changeOrigin: true,
    })
  );

  app.use(
    '/block',
    createProxyMiddleware({
      target: 'http://nhsign-broker:4001', // ✅ 이건 broker 컨테이너 기준
      changeOrigin: true,
    })
  );
};
