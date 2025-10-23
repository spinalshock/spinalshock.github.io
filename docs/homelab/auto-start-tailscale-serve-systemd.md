# Auto-Start Tailscale Serve with systemd

## Problem

Need `tailscale serve 8000` to start automatically when container boots.

## Solution

Create systemd service for automatic startup:

```bash
cat > /etc/systemd/system/tailscale-serve.service << 'EOF'
[Unit]
Description=Tailscale Serve for Paperless-NGX
After=tailscaled.service
Wants=tailscaled.service

[Service]
Type=simple
ExecStart=/usr/bin/tailscale serve 8000
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start:
```bash
systemctl daemon-reload
systemctl enable tailscale-serve.service
systemctl start tailscale-serve.service
```

## Fix Conflicts

If already running manually:
```bash
pkill -f "tailscale serve 8000"
tailscale serve reset
systemctl restart tailscale-serve.service
```

## Verification

```bash
systemctl status tailscale-serve.service
tailscale serve status
```