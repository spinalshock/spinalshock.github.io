# Paperless-NGX Tailscale CSRF Configuration Fix

## Problem

When accessing Paperless-NGX via Tailscale serve, login throws "CSRF verification failed" error.

## Solution

Edit `/opt/paperless/paperless.conf` and add your Tailscale domain:

```bash
PAPERLESS_URL=https://paperless-ngx.tail7edcc2.ts.net
PAPERLESS_CSRF_TRUSTED_ORIGINS=https://paperless-ngx.tail7edcc2.ts.net
PAPERLESS_ALLOWED_HOSTS=paperless-ngx.tail7edcc2.ts.net,localhost,127.0.0.1
PAPERLESS_CORS_ALLOWED_HOSTS=https://paperless-ngx.tail7edcc2.ts.net,https://localhost:8080
```

Restart the container for changes to take effect.

## Key Configuration Elements

- **PAPERLESS_URL**: Main application URL
- **PAPERLESS_CSRF_TRUSTED_ORIGINS**: Domains allowed for CSRF token validation  
- **PAPERLESS_ALLOWED_HOSTS**: Domains that can serve the application
- **PAPERLESS_CORS_ALLOWED_HOSTS**: Domains allowed for cross-origin requests