---
slug: disk-storage-fundamentals
title: Understanding Disk Storage Fundamentals - Partition Tables, Filesystems, and Data Organization
authors: [om]
tags: [storage, linux, homelab]
---

### Understanding Disk Storage Fundamentals - From Partition Tables to Data Recovery

Ever wondered what actually happens when you format a disk or why data can sometimes be recovered after deletion? Today I'll walk through the fundamental concepts of how storage works, using real examples from setting up storage for my Proxmox homelab.

<!-- truncate -->

#### **The Storage Hierarchy - How Your Data is Actually Organized**

When working with storage, it's crucial to understand that there are multiple layers between your files and the physical disk. Think of it like a well-organized library system:

1. **Physical Disk**: The actual storage medium (like library shelves)
2. **Partition Table**: Defines storage sections (like floor directories)
3. **Filesystem**: Organizes files within partitions (like shelf organization systems)
4. **Files**: Your actual data (like individual books)

Let me break down each layer with practical examples from my recent Proxmox storage setup.

#### **Step 1: Understanding Partition Tables**

When I ran `fdisk -l` on my homelab server, I saw this output:

```bash
Disk /dev/sda: 931.51 GiB, 1000204886016 bytes, 1953525168 sectors
Device          Start        End    Sectors   Size Type
/dev/sda1        2048     534527     532480   260M EFI System
/dev/sda2      534528     567295      32768    16M Microsoft reserved
/dev/sda3      567296  884801417  884234122 421.6G Microsoft basic data
/dev/sda4   884801536  886505471    1703936   832M Windows recovery environment
/dev/sda5   886507520 1951475711 1064968192 507.8G Microsoft basic data
/dev/sda6  1951475712 1953523711    2048000  1000M Windows recovery environment
```

This shows the **partition table** - essentially a map that tells the operating system:
- "Sectors 2048-534527 contain an EFI boot system"
- "Sectors 567296-884801417 contain Windows data"
- And so on...

**Think of it like this**: If your disk is a massive warehouse, the partition table is the directory at the entrance telling you which aisles contain electronics, which contain clothing, etc.

#### **Step 2: The Role of Filesystem Signatures**

Within each partition, there's another layer - the **filesystem**. This is like the organization system within each warehouse section. When I ran `wipefs /dev/sda`, I saw:

```bash
DEVICE OFFSET       TYPE UUID LABEL
sda    0x200        gpt
sda    0xe8e0db5e00 gpt
sda    0x1fe        PMBR
```

These entries show the **GPT (GUID Partition Table)** signatures at specific disk locations. The filesystem signatures would appear here too if I looked at individual partitions.

#### **Step 3: What Really Happens When You "Delete" Data**

Here's where it gets interesting. When you delete a file or format a disk, you're not actually erasing the data - you're just removing the "catalog system" that helps find it.

**Real-world analogy**: Imagine burning the card catalog in a library. All the books are still on the shelves in exactly the same places, but you no longer have any way to find them. The books haven't disappeared - they're just "orphaned."

This is exactly what `wipefs -a /dev/sda` does:
- **Removes the partition table** (burns the directory)
- **Removes filesystem signatures** (burns the section catalogs)
- **Leaves all data intact** (books stay on shelves)

#### **Step 4: Understanding Data Recovery**

Since the actual data remains on the disk after wiping the partition table, specialized tools can still recover it by:

1. **Scanning for data patterns** (looking for recognizable file headers)
2. **Reconstructing file boundaries** (figuring out where files start/end)
3. **Rebuilding directory structures** (recreating the catalog)

This is why secure deletion requires actually overwriting the data sectors:

```bash
# This just removes the "map" - data recoverable
wipefs -a /dev/sda

# This actually overwrites the data - much more secure
shred -vfz -n 3 /dev/sda
# or
dd if=/dev/urandom of=/dev/sda bs=4M status=progress
```

#### **Step 5: Practical Storage Setup for Proxmox**

Armed with this understanding, here's how I safely prepared my 1TB HDD for Proxmox storage:

**1. Verification Phase:**
```bash
# Confirm target disk (preview what would be wiped)
wipefs /dev/sda
# Verify I'm targeting the right disk
lsblk /dev/sda
```

**2. Safe Wiping:**
```bash
# Remove partition table and filesystem signatures
wipefs -a /dev/sda
# Verify everything is clean
lsblk /dev/sda  # Should show just raw disk
blkid /dev/sda  # Should return nothing
```

**3. Creating New Structure:**
```bash
# Create new GPT partition table
gdisk /dev/sda
# Create single large partition
# Format with ext4 filesystem
mkfs.ext4 /dev/sda1
```

**4. Persistent Mounting:**
```bash
# Get UUID for reliable mounting
blkid /dev/sda1
# Add to /etc/fstab using UUID (not device name)
UUID=abc123... /storage ext4 defaults 0 2
```

#### **Key Insights About Storage Management**

**1. Device Names Can Change**
Using `/dev/sda` in fstab is dangerous because device names can change between reboots. UUIDs are permanent identifiers.

**2. Partition Tables vs Filesystems**
- **Partition table**: Divides the disk into sections
- **Filesystem**: Organizes files within each section

**3. Data Persistence**
Understanding that "deletion" often just removes metadata explains:
- Why SSDs need TRIM commands
- Why secure deletion is important for sensitive data
- Why data recovery is often possible

**4. Storage Type Selection**
For my homelab setup, I chose:
- **Directory storage** (simple, reliable)
- **ext4 filesystem** (mature, well-supported)
- **Single large partition** (easier to manage)

#### **Challenges and Solutions**

**Challenge: Avoiding Disk Confusion**
- *Problem*: Multiple disks with similar sizes could be accidentally wiped
- *Solution*: Always verify with `lsblk` and use specific identifiers

**Challenge: Making Changes Permanent**
- *Problem*: Manual mount commands don't survive reboots
- *Solution*: Proper fstab entries with UUID references

**Challenge: Understanding What's Recoverable**
- *Problem*: Unclear what level of deletion is appropriate for different scenarios
- *Solution*: Know the difference between metadata removal and data overwriting

#### **Future Storage Considerations**

As my homelab grows, I'll need to consider:

**1. Storage Expansion**: How to add more disks without disrupting existing data
**2. Backup Strategies**: Protecting against hardware failure
**3. Performance Optimization**: SSD caching, proper alignment
**4. Monitoring**: Disk health tracking and early failure detection

#### **Key Takeaways**

Understanding storage fundamentals helps you:

- **Make informed decisions** about data security
- **Troubleshoot storage issues** more effectively  
- **Plan storage architectures** that match your needs
- **Recover from mistakes** when they happen

The most important insight: storage is layered, and each layer serves a specific purpose. When you understand what each layer does, you can make better decisions about how to organize, protect, and manage your data.

---

This foundational knowledge became crucial when setting up my Proxmox homelab storage. By understanding what happens at each layer, I could confidently wipe the old Windows partitions and create a clean, purpose-built storage system for my containers and services.

In future posts, I'll cover how this storage integrates with Proxmox LXC containers and how to design storage layouts that grow with your homelab needs.