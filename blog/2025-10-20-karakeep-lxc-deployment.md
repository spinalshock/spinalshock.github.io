---
slug: karakeep-lxc-deployment
title: Deploying Karakeep in Unprivileged LXC Container - Complete Installation Guide with Troubleshooting
authors: [om]
tags: [karakeep, lxc, proxmox, systemd, meilisearch, terraform]
---

### Deploying Karakeep in Unprivileged LXC Container - Overcoming systemd and Installation Challenges

Recently deployed Karakeep (a self-hosted bookmark manager) in an unprivileged LXC container on Proxmox. This post documents the complete process, including all the challenges encountered with systemd security conflicts, installation cleanup, and resource optimization based on real-world usage data.

<!-- truncate -->

#### **The Goal: Self-Hosted Bookmark Management**

Karakeep is a modern bookmark manager that uses Meilisearch for full-text search capabilities. The goal was to deploy it in an LXC container that would:
- Run efficiently with minimal resource overhead
- Be accessible via Tailscale with automatic HTTPS
- Handle systemd services properly in unprivileged containers
- Provide fast search across hundreds of bookmarks
- Be fully automated through Terraform infrastructure-as-code

#### **Critical Learning: Resource Requirements for Installation**

**Initial Failure with Insufficient Resources:**
- Started with: 1 core, 1GB RAM
- **Result**: Installation failed due to resource bottlenecks
- **Lesson**: Installation phase requires significantly more resources than runtime

**Successful Installation Configuration:**
```hcl
resource "proxmox_lxc" "karakeep" {
    cores           = 4        # Required for installation phase
    memory          = 4096     # 4GB needed during setup
    size            = "12G"    # Adequate for installation + runtime
    
    # Post-installation optimization:
    # cores = 1, memory = 2816 (2.75GB)
}
```

#### **Container Infrastructure Setup**

**Complete Terraform LXC Configuration:**
```hcl
resource "proxmox_lxc" "karakeep" {
    target_node     = "pve"
    hostname        = "karakeep"
    cores           = 4        # Installation requirement
    memory          = 4096     # Installation requirement
    ostemplate      = "local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst"
    unprivileged    = true
    
    features {
        nesting = true
        keyctl  = true
    }
    
    network {
        name    = "eth0"
        bridge  = "vmbr0"
        ip      = "dhcp"
    }
    
    rootfs {
        storage = "local-lvm"
        size    = "12G"
    }
    
    # TUN device configuration for Tailscale
    provisioner "local-exec" {
        command = "echo 'lxc.cgroup2.devices.allow: c 10:200 rwm' >> /etc/pve/lxc/${self.vmid}.conf"
    }
    
    provisioner "local-exec" {
        command = "echo 'lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file' >> /etc/pve/lxc/${self.vmid}.conf"
    }
    
    ssh_public_keys = var.ssh_public_key
}
```

#### **Step 1: Karakeep Installation via Debian Script**

```bash
# Basic system preparation
apt update && apt install -y curl locales

# Locale setup to avoid Perl warnings
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen && update-locale LANG=en_US.UTF-8

# Karakeep installation
curl -sSL https://install.karakeep.com | sudo bash
```

**Installation Process Challenges:**
- **File overwrites**: Answer 'y' for `/etc/apt/keyrings/nodesource.gpg`
- **Application files**: Answer 'A' (All) for `karakeep-0.27.1/.claude/settings.json` and similar

#### **Step 2: Diagnosing systemd Service Failures**

**Initial Problem: Meilisearch Service Failure**
```bash
systemctl status meilisearch
# Shows: failed (Result: exit-code) status=226/NAMESPACE
```

**Detailed Error Investigation:**
```bash
journalctl -xeu meilisearch.service
```

**Key Error Output:**
```
meilisearch.service: Main process exited, code=exited, status=226/NAMESPACE
Oct 19 14:38:34 karakeep systemd[1]: meilisearch.service: Failed with result 'exit-code'
Oct 19 14:38:34 karakeep (lisearch)[17372]: meilisearch.service: Failed to set up mount namespacing: /run/systemd/unit-root/proc: Permission denied
Oct 19 14:38:34 karakeep (lisearch)[17372]: meilisearch.service: Failed at step NAMESPACE spawning /usr/bin/meilisearch: Permission denied
```

**Root Cause Analysis:**
The error `status=226/NAMESPACE` and "Failed to set up mount namespacing" indicated systemd security features conflicting with LXC container namespacing.

#### **Step 3: Service Configuration Analysis**

**Examining the Service Configuration:**
```bash
systemctl cat meilisearch.service
```

**Output Revealed Problematic Security Settings:**
```ini
# /etc/systemd/system/meilisearch.service
[Unit]
Description=MeiliSearch is a RESTful search API
Documentation=https://docs.meilisearch.com/
After=network.target

[Service]
User=meilisearch
Group=meilisearch
Restart=on-failure
WorkingDirectory=/var/lib/meilisearch
ExecStart=/usr/bin/meilisearch --config-file-path /etc/meilisearch.toml
NoNewPrivileges=true
ProtectHome=true                    # Problematic in LXC
ReadWritePaths=/var/lib/meilisearch
ProtectSystem=full                  # Problematic in LXC
ProtectHostname=true               # Problematic in LXC
ProtectControlGroups=true          # Problematic in LXC
ProtectKernelModules=true          # Problematic in LXC
ProtectKernelTunables=true         # Problematic in LXC
ProtectKernelLogs=true             # Problematic in LXC
ProtectClock=true
LockPersonality=true               # Problematic in LXC
RestrictRealtime=yes               # Problematic in LXC
RestrictNamespaces=yes             # Problematic in LXC
MemoryDenyWriteExecute=yes         # Problematic in LXC
PrivateDevices=yes
```

#### **Step 4: Creating systemd Override Solution**

**Understanding the Fix:**
The systemd security features assume bare-metal deployment with full namespace access. In unprivileged LXC containers, these features conflict with the container's limited namespace permissions.

**Creating the Override Configuration:**
```bash
mkdir -p /etc/systemd/system/meilisearch.service.d

cat > /etc/systemd/system/meilisearch.service.d/lxc-override.conf << 'EOF'
[Service]
ProtectHome=no
ProtectSystem=no
ProtectHostname=no
ProtectControlGroups=no
ProtectKernelTunables=no
ProtectKernelModules=no
ProtectKernelLogs=no
RestrictRealtime=no
RestrictSUIDSGID=no
RemoveIPC=no
NoNewPrivileges=no
RestrictNamespaces=no
LockPersonality=no
MemoryDenyWriteExecute=no
RestrictAddressFamilies=
SystemCallFilter=
SystemCallArchitectures=
EOF
```

**Critical Implementation Details:**
- **`[Service]` header is mandatory** - without it, you get "Assignment outside of section" errors
- Each security feature is explicitly disabled with `=no` or left empty
- The override file takes precedence over the main service file

**Applying the Fix:**
```bash
systemctl daemon-reload
systemctl restart meilisearch
systemctl status meilisearch  # Should now show active (running)
```

#### **Step 5: Handling Installation Cleanup and Reinstallation**

**User Conflict Resolution:**
During reinstallation attempts, existing users cause conflicts:

```bash
# Error encountered: useradd: user 'meilisearch' already exists
# Error encountered: userdel: user karakeep is currently used by process XXXX
```

**Complete Cleanup Procedure:**
```bash
# Stop all services first
systemctl stop karakeep.target karakeep-web.service karakeep-browser.service karakeep-workers.service meilisearch

# Force kill processes and remove users
pkill -9 -u karakeep && userdel karakeep
pkill -9 -u meilisearch && userdel meilisearch

# Clean service files
rm -f /etc/systemd/system/karakeep*.service
rm -f /etc/systemd/system/karakeep.target
rm -f /etc/systemd/system/meilisearch.service*
rm -rf /etc/systemd/system/meilisearch.service.d/

# Remove application directory
rm -rf /opt/karakeep/

systemctl daemon-reload
```

**Why This Works:**
- `pkill -9 -u username` forcefully terminates all processes owned by the user
- `&&` ensures user deletion only happens after successful process termination
- Complete file cleanup prevents conflicts during reinstallation

#### **Step 6: Karakeep Multi-Service Startup**

**Service Architecture Discovery:**
```bash
systemctl list-unit-files | grep -i kara
# Output:
# karakeep-browser.service    disabled    enabled
# karakeep-web.service        disabled    enabled  
# karakeep-workers.service    disabled    enabled
# karakeep.target             enabled     enabled
```

**Proper Service Startup:**
```bash
# Start coordinated services via target
systemctl start karakeep.target
systemctl enable karakeep.target

# Verify each component
systemctl status karakeep-web.service      # Web interface
systemctl status karakeep-browser.service  # Browser automation
systemctl status karakeep-workers.service  # Background processing
systemctl status meilisearch              # Search backend
```

#### **Step 7: Resource Optimization Based on Real Usage**

**Performance Data Collection:**
- **Test Dataset**: 500 bookmarks imported
- **Monitoring During**: Import processing and indexing

**Resource Usage During Import:**
- **Peak RAM**: 3GB during active processing
- **Peak CPU**: 2/4 cores (50% utilization)
- **Storage**: 9/12GB after complete indexing

**Idle State Performance (Post-Import):**
- **RAM Usage**: 2.25GB (steady state)
- **CPU Usage**: 1-2% of single core
- **Storage**: Stable at 9GB

**Optimization Decision:**
```bash
# Terraform resource adjustment
cores  = 1        # Single core handles steady-state load
memory = 2816     # 2.75GB provides 500MB headroom above idle
size   = "12G"    # Indexing is storage-efficient, no significant growth
```

#### **Step 8: Network Access via Tailscale**

```bash
# Install and configure Tailscale
curl -fsSL https://tailscale.com/install.sh | sh
systemctl enable tailscaled
tailscale up --ssh

# Expose Karakeep with automatic HTTPS
tailscale serve 3000
```

**Result**: Secure access at `https://karakeep.tail<your-tailnet>.ts.net`

#### **What We Changed and Why It Worked**

**1. Resource Allocation Strategy:**
- **Problem**: Insufficient resources during installation caused failures
- **Solution**: Allocated 4 cores + 4GB RAM for installation, then optimized down
- **Why it works**: Installation phase has higher computational requirements than runtime

**2. systemd Security Override:**
- **Problem**: `status=226/NAMESPACE` errors due to security feature conflicts
- **Diagnosis**: Used `journalctl -xeu meilisearch.service` to identify namespace permission issues
- **Analysis**: `systemctl cat meilisearch.service` revealed specific conflicting settings
- **Solution**: Created override file disabling problematic security features
- **Why it works**: LXC containers have limited namespace access; security features assume bare-metal

**3. User Management During Reinstallation:**
- **Problem**: Existing users prevented clean reinstallation
- **Solution**: `pkill -9 -u username && userdel username` pattern
- **Why it works**: Forces process termination before user removal, preventing "user in use" errors

**4. Service Coordination:**
- **Problem**: Multiple services need coordinated startup
- **Solution**: Use `karakeep.target` for orchestrated service management
- **Why it works**: systemd targets manage service dependencies and startup order

#### **Technical Validation and Verification**

**Final System Check:**
```bash
# Verify all services running
systemctl status karakeep.target meilisearch

# Check resource utilization
free -h    # RAM: ~2.25GB used
df -h      # Disk: ~9GB used
htop       # CPU: 1-2% single core

# Test functionality
curl -I http://localhost:3000    # Web interface response
ss -tlnp | grep -E "(3000|7700)" # Ports listening

# Access via Tailscale
https://karakeep.tail<tailnet>.ts.net  # External access working
```

The deployment successfully handles 500+ bookmarks with minimal resource overhead, demonstrating that modern applications can run efficiently in unprivileged LXC containers when systemd security conflicts are properly addressed.