# Vite Proxy Configuration

## Basic Setup

Add proxy configuration to `vite.config.js` to eliminate CORS issues:

```javascript
export default defineConfig({
  server: {
    proxy: {
      // Basic API proxy
      '/api': 'http://localhost:8080',
      
      // Advanced configuration
      '/api/advanced': {
        target: 'http://localhost:8080',
        changeOrigin: true,              // For CORS
        secure: false,                   // For HTTP backends
        rewrite: (path) => path.replace(/^\/api/, ''),
        cookieDomainRewrite: 'localhost' // For session handling
      },
      
      // Microservices routing
      '/api/users': 'http://localhost:8081',
      '/api/orders': 'http://localhost:8082',
      
      // External APIs (avoid CORS)
      '/external': {
        target: 'https://api.external-service.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/external/, '')
      },
      
      // WebSockets
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true
      },
      
      // Custom headers & debugging
      '/debug': {
        target: 'http://localhost:8080',
        logLevel: 'debug',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('X-Custom-Header', 'value')
          })
        }
      }
    }
  }
})
```

![Vite Proxy](/img/ViteProxy.png)

## Framework Equivalents

```javascript
// Webpack (webpack.config.js)
module.exports = {
  devServer: { proxy: { '/api': 'http://localhost:8080' } }
}

// Next.js (next.config.js)
module.exports = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }]
  }
}

// Create React App (package.json)
{ "proxy": "http://localhost:8080" }
```

## Remote Backend Setup

```bash
# Kubernetes port forwarding
kubectl port-forward service/backend 8080:80

# SSH tunneling
ssh -L 8080:remote-backend:8080 user@remote-server

# Then proxy to http://localhost:8080
```

## Common Use Cases

- **Local Development**: Frontend (3000) + Backend (8080)
- **Microservices**: Route different paths to different services
- **Third-party APIs**: Avoid browser CORS restrictions
- **Authentication**: Separate auth service routing
- **Cookie/Session Handling**: Same-origin requirements