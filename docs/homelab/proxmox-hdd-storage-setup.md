# Proxmox HDD Storage Setup - Complete Procedure

## Overview

This document covers the complete process of wiping a Windows HDD and setting it up as Proxmox storage for containers, databases, media, and backups.

## Our Specific Setup

**Hardware**: 1TB HDD (ST1000LM035-1RK172) previously containing Windows partitions
**Goal**: Clean ext4 storage mounted at `/mnt/storage` for LXC container data
**Strategy**: Fast containers on SSD, bulk data on HDD

## Step-by-Step Procedure

### Step 1: Disk Identification and Verification
```bash
# Identify all disks and their current state
fdisk -l

# Our output showed:
# /dev/sda: 931.51 GiB (1TB HDD with Windows partitions)
# /dev/sdb: 238.47 GiB (SSD with Proxmox)

# Verify target disk contents
lsblk /dev/sda
```

### Step 2: Safe Partition Table Removal
```bash
# Preview what will be wiped (safety check)
wipefs /dev/sda

# Expected output:
# DEVICE OFFSET       TYPE UUID LABEL
# sda    0x200        gpt
# sda    0xe8e0db5e00 gpt
# sda    0x1fe        PMBR

# Actually wipe the partition table
wipefs -a /dev/sda

# Verify disk is clean
lsblk /dev/sda
blkid /dev/sda  # Should return nothing
```

### Step 3: Create New Partition Structure
```bash
# Create new GPT partition table and partition
gdisk /dev/sda

# Commands used in gdisk:
# o     - Create new GPT partition table
# n     - Create new partition
#         Partition number: [default - 1]
#         First sector: [default - 2048]
#         Last sector: [default - uses full disk]
#         Partition type: [default - 8300 Linux filesystem]
# p     - Preview partition table
# w     - Write changes and exit
```

### Step 4: Format the New Partition
```bash
# Format as ext4 (may encounter existing filesystem warning)
mkfs.ext4 /dev/disk/by-id/ata-ST1000LM035-1RK172_WL1P1QNX-part1

# If prompted about existing filesystem:
# "contains a vfat file system labelled 'SYSTEM_DRV' proceed anyway?"
# Use force flag to overwrite:
mkfs.ext4 -F /dev/disk/by-id/ata-ST1000LM035-1RK172_WL1P1QNX-part1
```

### Step 5: Create Mount Point and Configure fstab
```bash
# Create mount directory
mkdir -p /mnt/storage

# Get stable device identifier
ls -la /dev/disk/by-id/ | grep sda1
# Output: ata-ST1000LM035-1RK172_WL1P1QNX-part1 -> ../../sda1

# Add to /etc/fstab
echo "/dev/disk/by-id/ata-ST1000LM035-1RK172_WL1P1QNX-part1 /mnt/storage ext4 defaults,noatime,discard 0 2" >> /etc/fstab
```

### Step 6: CRITICAL - Reload systemd and Test Mount
```bash
# ESSENTIAL: Reload systemd daemon after fstab changes
systemctl daemon-reload

# Test the fstab entry
mount -a

# Verify mount worked
df -h /mnt/storage
lsblk /dev/sda1
```

## Key Commands Reference

```bash
# Disk analysis
fdisk -l
lsblk
blkid

# Safe wiping
wipefs /dev/device          # Preview
wipefs -a /dev/device       # Actually wipe

# Partitioning
gdisk /dev/device

# Formatting
mkfs.ext4 /dev/device1
mkfs.ext4 -F /dev/device1   # Force over existing filesystem

# Mount management
systemctl daemon-reload     # After fstab changes
mount -a                    # Test all fstab entries
```

## Mount Options Explained

Our fstab entry: `/dev/disk/by-id/... /mnt/storage ext4 defaults,noatime,discard 0 2`

- **defaults**: Standard mount options
- **noatime**: Don't update access times (improves performance)
- **discard**: Enable TRIM support for SSDs (good practice even for HDDs)
- **0**: Don't dump this filesystem for backup
- **2**: Check filesystem on boot (but after root filesystem)

## Why We Used /dev/disk/by-id/

**Advantages over /dev/sda1:**
- Stable across reboots (device names can change)
- Human-readable (shows actual drive model)
- Remains consistent even if drive is moved to different ports

**Alternative approaches:**
- UUID (from `blkid`): More universal but less readable
- LABEL: Requires setting filesystem labels

## Storage Organization Plan

```
/mnt/storage/
├── containers/     # LXC container persistent data
│   ├── nginx/
│   ├── heimdall/
│   └── vaultwarden/
├── shared/         # Data shared between containers
│   ├── media/
│   └── downloads/
└── backups/        # Backup storage
    ├── container-backups/
    └── config-backups/
```

## Troubleshooting

### Mount Fails After Reboot
- Check `/etc/fstab` syntax
- Verify device ID hasn't changed: `ls -la /dev/disk/by-id/`
- Test manually: `mount /mnt/storage`

### Filesystem Corruption
- Check filesystem: `fsck.ext4 /dev/sda1`
- Force check: `fsck.ext4 -f /dev/sda1`

### Permission Issues
- Fix ownership: `chown -R root:root /mnt/storage`
- Set permissions: `chmod 755 /mnt/storage`

## Next Steps

1. **Add to Proxmox GUI**: Datacenter > Storage > Add > Directory
2. **Configure for containers**: Set up bind mounts in LXC configs
3. **Implement backup strategy**: Regular snapshots and external backups
4. **Monitor disk health**: Set up SMART monitoring

## Critical Lessons Learned

1. **Always preview with `wipefs` before using `-a` flag**
2. **Use stable device identifiers in fstab, not /dev/sdX**
3. **`systemctl daemon-reload` is essential after fstab changes**
4. **Force formatting may be needed over existing filesystems**
5. **Test mount with `mount -a` before rebooting**

This setup provides 931GB of additional storage for our Proxmox homelab, properly organized and ready for container workloads.