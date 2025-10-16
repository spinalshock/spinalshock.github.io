# LXC Container and Proxmox Host Locale Configuration

## The Problem

When working with LXC containers on Proxmox, you may encounter persistent Perl locale warnings:

```
perl: warning: Setting locale failed.
perl: warning: Please check that your locale settings:
        LANGUAGE = (unset),
        LC_ALL = (unset),
        ...
        LANG = "en_IN.UTF-8"
    are supported and installed on your system.
perl: warning: Falling back to the standard locale ("C").
```

These warnings appear because locale data isn't installed for the configured language.

## Two Different Locale Contexts

### 1. Container Locale (Affects SSH Sessions)
When you SSH directly into containers, the container's locale configuration is used.

### 2. Host Locale (Affects pct exec Commands)
When you run `pct exec 100 -- command`, the Proxmox host's locale configuration is used.

## Complete Solution

### Fix Container Locale (Inside Each Container)

```bash
# Install locale generation tools
apt install -y locales

# Enable the required locale
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
# OR for Indian English specifically:
echo "en_IN.UTF-8 UTF-8" >> /etc/locale.gen

# Generate the locale
locale-gen

# Set as system default
update-locale LANG=en_US.UTF-8  # or LANG=en_IN.UTF-8

# Apply to current session
export LANG=en_US.UTF-8  # or export LANG=en_IN.UTF-8
```

### Fix Proxmox Host Locale (On Proxmox Host)

```bash
# Check current locale settings
locale

# Install locales if not available
apt install -y locales

# Generate the required locale (match your system's LANG setting)
locale-gen

# Update system locale
update-locale LANG=en_IN.UTF-8  # or whatever LANG shows

# Apply to current session
export LANG=en_IN.UTF-8
```

## Template Requirements

For LXC templates, include locale setup in the base configuration:

```bash
# Essential packages
apt update
apt install -y locales curl

# Locale configuration
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
update-locale LANG=en_US.UTF-8
export LANG=en_US.UTF-8
```

## Verification

### Test Container Locale
```bash
# SSH into container
ssh root@container-ip
locale  # Should show proper locale without warnings
```

### Test Host Locale
```bash
# From Proxmox host
pct exec 100 -- locale  # Should show proper locale without warnings
```

## Key Insights

1. **Container vs Host**: Different contexts require separate locale fixes
2. **Template Inclusion**: Fix locale in template to avoid repeating for each container
3. **Session vs Persistent**: `export LANG=` affects current session, `update-locale` affects future sessions
4. **Enable Before Generate**: Must add locale to `/etc/locale.gen` before `locale-gen` works

## Our Specific Configuration

- **Proxmox Host**: `en_IN.UTF-8` (Indian English)
- **Containers**: `en_US.UTF-8` (US English) for broader compatibility
- **Commands**: `locale-gen` + `update-locale LANG=en_IN.UTF-8` resolved host warnings

This ensures clean command output for both direct SSH access to containers and `pct exec` commands from the Proxmox host.