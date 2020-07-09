const { createProxyMiddleware } = require('http-proxy-middleware');
module.exports = app => {
  app.use(
    /\/api|\/oidc/,
    createProxyMiddleware({
      target: 'http://localhost:3000',
    })
  );
};
