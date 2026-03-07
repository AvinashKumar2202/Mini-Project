const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        createProxyMiddleware({
            target: 'http://localhost:5000',
            changeOrigin: true,
            ws: true,
            pathFilter: function (path, req) {
                return path.startsWith('/api') || path.startsWith('/peerjs');
            }
        })
    );
};
