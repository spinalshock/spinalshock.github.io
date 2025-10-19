---
slug: lxc-filebrowser-tailscale-setup
title: Setting up Filebrowser with Tailscale in Proxmox LXC - Complete Infrastructure-as-Code Journey
authors: [om]
tags: [proxmox, lxc, tailscale, terraform, homelab]
---

### Setting up Filebrowser with Tailscale in Proxmox LXC - A Complete Infrastructure-as-Code Journey

Ever wanted to set up a lightweight file browser accessible from anywhere via Tailscale, running in an LXC container managed by Terraform? Today I'll walk through the complete process, including all the challenges I encountered and how I solved them systematically.

<!-- truncate -->

#### **The Goal: Infrastructure-as-Code File Management**

I wanted to create a file browser service that would:
- Run efficiently in an LXC container on Proxmox
- Be accessible via Tailscale with automatic HTTPS
- Have access to shared storage from the host
- Be fully automated through Terraform
- Serve as a foundation template for future services

#### **Step 1: The Terraform Foundation**

I started with a basic LXC container configuration in Terraform:

```hcl
resource "proxmox_lxc" "test" {
    target_node     = "pve"
    hostname        = "test"
    cores           = 1
    memory          = 256  # Started with bare minimum
    ostemplate      = "local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst"
    unprivileged    = true
    
    features {
        nesting = true
        keyctl  = true
    }
    
    start = false
    
    network {
        name    = "eth0"
        bridge  = "vmbr0"
        ip      = "dhcp"
    }
    
    rootfs {
        storage = "local-lvm"
        size    = "8G"
    }
    
    ssh_public_keys = var.ssh_public_key
}
```

The initial setup was straightforward, but I quickly discovered several challenges that needed solving.

#### **Challenge 1: Tailscale TUN Device Support**

When I tried to run `tailscale up --ssh`, I got this error:

```bash
systemctl start tailscaled
# Service failed to start - no TUN device access
```

**The Solution**: LXC containers need explicit permission to access `/dev/net/tun` for VPN functionality. I added this to my Terraform configuration:

```hcl
# TUN device configuration for Tailscale
provisioner "local-exec" {
    command = "echo 'lxc.cgroup2.devices.allow: c 10:200 rwm' >> /etc/pve/lxc/${self.vmid}.conf"
}

provisioner "local-exec" {
    command = "echo 'lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file' >> /etc/pve/lxc/${self.vmid}.conf"
}
```

This automated the manual process of editing `/etc/pve/lxc/XXX.conf` that's typically required for Tailscale in LXC.

#### **Challenge 2: Storage Mount and Permissions**

I wanted the container to access my 1TB HDD mounted at `/mnt/storage` on the Proxmox host. Initial attempts at mounting failed due to provider bugs, but I eventually got this working:

```hcl
mountpoint {
    key     = "0"
    slot    = 0
    storage = "/mnt/storage"     # Host path
    volume  = "/mnt/storage"     # Same path (avoids provider bug)
    mp      = "/mnt/storage"     # Container mount point
    size    = "900G"             # Required by provider
    backup  = false
}
```

However, even after successful mounting, file uploads failed with permission errors:

```
open /mnt/storage/filename.mkv: permission denied
```

**The Root Cause**: Unprivileged LXC containers use UID mapping for security. The container's root user (UID 0) maps to UID 100000+ on the host, but my storage was owned by host UID 0.

**The Solution**:
```bash
# On Proxmox host - map storage ownership to container's UID
chown 100000:100000 /mnt/storage
```

This single command fixed all permission issues permanently.

#### **Challenge 3: Locale Warnings**

Throughout the setup, I encountered persistent Perl locale warnings:

```
perl: warning: Setting locale failed.
perl: warning: Please check that your locale settings:
    LANG = "en_IN.UTF-8"
are supported and installed on your system.
```

This appeared both in containers and when using `pct exec` commands from the Proxmox host.

**The Solution**: Fix locales in both contexts:

```bash
# Inside containers
apt install -y locales
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
update-locale LANG=en_US.UTF-8

# On Proxmox host
locale-gen
update-locale LANG=en_IN.UTF-8
```

#### **Step 2: Service Installation and Configuration**

With the infrastructure working, I proceeded with the actual service setup:

```bash
# Essential packages
apt update
apt install -y curl locales

# Locale setup
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
update-locale LANG=en_US.UTF-8

# Tailscale installation
curl -fsSL https://tailscale.com/install.sh | sh
# systemctl start tailscaled
# systemctl enable tailscaled
tailscale up --ssh

# Filebrowser installation
curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | bash
```

#### **Step 3: Service Orchestration**

The key insight was using Tailscale's serve feature for automatic HTTPS:

```bash
# Start filebrowser as background daemon
nohup filebrowser -r /mnt/storage > /tmp/filebrowser.log 2>&1 &

# Expose via Tailscale with automatic HTTPS
tailscale serve 8080
```

This approach eliminated the need for:
- Reverse proxy configuration
- SSL certificate management
- Complex network binding (`-a 0.0.0.0`)

The service became immediately accessible at `https://test.tail7edcc2.ts.net/` with proper TLS certificates.

#### **Step 4: Performance Testing and Optimization**

I uploaded a 4K movie file and monitored resource usage during playback:

```
Memory usage: 97.51% (249.63 MiB of 256.00 MiB)
CPU usage: 19.51% of 1 CPU
```

The container was hitting memory limits during video streaming. Based on this real-world data, I optimized the allocation:

```hcl
# Updated memory allocation
memory = 350  # Provides comfortable headroom
```

Using Terraform's in-place update capability:
```bash
terraform plan   # Showed memory update without recreation
terraform apply  # Applied change to running container
```

#### **Key Technical Insights**

**Infrastructure-as-Code Benefits:**
- **Reproducible**: Exact same setup every time
- **Versioned**: All configuration in git
- **Testable**: Can destroy and recreate for validation
- **Scalable**: Template-ready for multiple services

**LXC Container Advantages:**
- **Efficient**: 52MB idle RAM usage vs Docker overhead
- **Secure**: Unprivileged containers with namespace isolation
- **Fast**: Near-native performance for file operations
- **Lightweight**: Quick startup and low resource usage

**Tailscale Integration:**
- **Simplified networking**: No port forwarding or firewall rules
- **Automatic HTTPS**: Built-in certificate management
- **Secure access**: Zero-trust network model
- **Easy SSH**: `tailscale up --ssh` for administration

#### **Final Configuration Recipe**

**Complete working Terraform configuration:**

```hcl
resource "proxmox_lxc" "test" {
    target_node     = "pve"
    hostname        = "test"
    cores           = 1
    memory          = 350
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
        size    = "8G"
    }
    
    mountpoint {
        key     = "0"
        slot    = 0
        storage = "/mnt/storage"
        volume  = "/mnt/storage"
        mp      = "/mnt/storage"
        size    = "900G"
        backup  = false
    }
    
    # TUN device automation for Tailscale
    provisioner "local-exec" {
        command = "echo 'lxc.cgroup2.devices.allow: c 10:200 rwm' >> /etc/pve/lxc/${self.vmid}.conf"
    }
    
    provisioner "local-exec" {
        command = "echo 'lxc.mount.entry: /dev/net/tun dev/net/tun none bind,create=file' >> /etc/pve/lxc/${self.vmid}.conf"
    }
    
    ssh_public_keys = var.ssh_public_key
}
```

**Manual setup commands (for template creation):**
```bash
# System preparation
apt update && apt install -y curl locales
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen && update-locale LANG=en_US.UTF-8

# Tailscale installation
curl -fsSL https://tailscale.com/install.sh | sh
systemctl enable tailscaled

# Filebrowser installation
curl -fsSL https://raw.githubusercontent.com/filebrowser/get/master/get.sh | bash

# Storage permissions (run on host)
chown 100000:100000 /mnt/storage
```

#### **Real-World Performance Results**

**Resource efficiency:**
- **Idle usage**: 52MB RAM, minimal CPU
- **Active streaming**: 250MB RAM, 20% CPU for 4K video
- **Storage**: Direct host filesystem access, no performance penalty
- **Network**: Tailscale adds minimal overhead

**Operational benefits:**
- **Zero-downtime updates**: Terraform in-place updates
- **Secure by default**: Unprivileged containers + Tailscale
- **Maintenance-free**: No certificate renewals or proxy configs
- **Scalable**: Template ready for multiple services

#### **Template Preparation Strategy**

The next phase involves converting this working container into a reusable template:

1. **Remove service-specific configurations** (mountpoints, hostnames)
2. **Add `template = true`** to Terraform configuration
3. **Pre-install common tools** (curl, locales, Tailscale)
4. **Document template usage** for future deployments

This creates a "golden image" with all common requirements pre-configured, reducing deployment time from 30+ minutes to under 5 minutes for new services.

#### **Lessons Learned**

**Technical Discoveries:**
- LXC TUN device configuration is essential for VPN services
- Unprivileged container UID mapping requires careful storage permission planning
- Terraform local-exec provisioners can automate complex post-creation tasks
- Real-world testing is crucial for proper resource allocation

**Workflow Insights:**
- Infrastructure-as-code enables fearless experimentation
- Systematic testing with real workloads provides accurate resource requirements
- Documentation during implementation prevents knowledge loss
- Template-first thinking reduces future deployment complexity

**Security Benefits:**
- Unprivileged containers provide strong isolation
- Tailscale eliminates complex firewall configurations
- SSH key automation prevents password-based access
- Namespace isolation protects the host system

#### **Future Applications**

This foundation enables rapid deployment of additional services:
- **Nextcloud**: Personal cloud storage with the same infrastructure pattern
- **Jellyfin**: Media streaming server with proven resource allocation
- **Paperless-ngx**: Document management with storage integration
- **Home Assistant**: Smart home automation with secure access

Each new service can leverage the tested template, reducing deployment time and ensuring consistent security and performance characteristics.

#### **Conclusion**

Building this Filebrowser setup taught me the importance of systematic infrastructure development. Starting with infrastructure-as-code from day one, thoroughly testing each component, and documenting the entire process creates a foundation that scales efficiently.

The combination of Proxmox LXC containers, Terraform automation, and Tailscale networking provides an excellent platform for homelab services. The resulting setup is secure, performant, and maintainable - exactly what you want for production-quality home infrastructure.

The template created from this work will accelerate future service deployments while maintaining the same high standards for security and automation. This investment in proper infrastructure pays dividends with every subsequent service deployment.

---

**Key Resources:**
- [Tailscale LXC Documentation](https://tailscale.com/kb/1130/lxc-unprivileged)
- [Proxmox LXC Configuration Reference](https://pve.proxmox.com/pve-docs/chapter-pct.html)
- [Terraform Proxmox Provider](https://registry.terraform.io/providers/Telmate/proxmox/latest/docs)
- [Filebrowser Documentation](https://filebrowser.org/)
