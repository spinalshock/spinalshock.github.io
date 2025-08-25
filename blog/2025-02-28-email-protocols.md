---
slug: email-protocols
title: Understanding Email Protocols
authors: [om]
tags: [tech]
---

# What is IMAP, POP & SMTP? Understanding email protocols:

Emails don’t just "exist" on your device—they're stored on a mail server, and you use protocols to interact with them. The three main protocols involved are:

<!--truncate-->

- IMAP (Internet Message Access Protocol)
- POP3 (Post Office Protocol v3)
- SMTP (Simple Mail Transfer Protocol)
  Each of these has a different role in handling emails.

## 📥 IMAP (Incoming - Reading Emails)

IMAP is used to read emails directly from the mail server.
It syncs emails across multiple devices.
Emails stay on the server unless explicitly deleted.

## How IMAP Works

When you open NeoMutt, it connects to Gmail’s IMAP server (imap.gmail.com).
It fetches email headers (subject, sender info, etc.).
When you open an email, it downloads the full content.
Any changes (read, delete, move to folders) are synced across all devices.

## Pros of IMAP

- ✅ Emails are stored on the server (safe if your device is lost).
- ✅ Changes sync across all devices (read/unread status, folders, etc.).
- ✅ Works well for modern email usage.

## Cons of IMAP

- ❌ Needs an internet connection to access emails.
- ❌ Can be slower than POP3 since it doesn’t download everything upfront.

## 📥 POP3 (Incoming - Downloading Emails)

POP3 is an older protocol that downloads emails to your device and deletes them from the server (by default).
Used when you want emails only on one device.

## How POP3 Works

Your email client (NeoMutt, Thunderbird, etc.) connects to Gmail’s POP3 server (pop.gmail.com).
It downloads all emails to your device.
By default, emails are deleted from the server after download.

## Pros of POP3

- ✅ Emails are stored locally (works offline).
- ✅ Faster since everything is downloaded upfront.

## Cons of POP3

- ❌ No syncing—if you read or delete an email on one device, it won’t update on others.
- ❌ If your device is lost, your emails are gone (unless you back them up).
- ❌ Managing emails across multiple devices becomes a mess.

🚀 Modern email services (like Gmail) recommend IMAP instead of POP3.

## 📤 SMTP (Outgoing - Sending Emails)

SMTP is the protocol used to send emails.
While IMAP/POP3 handle receiving, SMTP handles sending.

## How SMTP Works

- When you send an email, NeoMutt connects to Gmail’s SMTP server (smtp.gmail.com).
- It authenticates using your Gmail credentials.
- The email is then transferred from your client to Gmail’s server.
- Gmail’s server then relays the email to the recipient’s mail server.

## Why SMTP is Needed?

- ✅ IMAP/POP3 only receive emails, SMTP is required to send them.
- ✅ Ensures emails are routed properly to the right recipients.

## Why So Much Configuration?

Unlike modern apps that "just work," email clients like NeoMutt are highly manual because email is a protocol-based system that predates modern apps. Each protocol (IMAP, SMTP) needs:

- Authentication (username/password, App Passwords)
- Server Information (e.g., imap.gmail.com, smtp.gmail.com)
- Ports & Security (TLS/SSL encryption)

:::info
Email apps like Gmail or Outlook automate all this for you, but NeoMutt gives you full control.
:::

## Why Use NeoMutt Instead of a Normal Email App?

- Privacy & Security: No Google tracking your email activity.
- Lightweight & Fast: Runs in a terminal, perfect for low-resource systems.
- Highly Customizable: You control how emails are displayed and handled.
- Works with Multiple Accounts: Can configure multiple email providers in one place.

If you’re happy using Gmail’s web interface, you don’t need NeoMutt. But if you want a powerful, terminal-based email client, it's worth the effort.

🔹 **TL;DR**
|Protocol|Purpose|Works With|Where Emails Are Stored|
|:------:|:------:|:--------:|:---------------------|
|IMAP|Fetch & Sync Emails|Multiple devices| Emails stay on the server|
|POP3|Download Emails|Single device|Emails are downloaded & removed from the server|
|SMTP|Send Emails|All email clients|Emails are sent via an SMTP server|

## How to add gmail to NeoMutt

- Firstly, enable 2-factor Authentication on your gmail account if you haven't already.
- Next, you need to setup an app password, please do not use your google account password.
  - Go to **Google Account > Security > App Passwords**.
  - Generate an App Password for **NeoMutt**.
  - Use that password instead of your actual Gmail password.
- Enable IMAP in Gmail
  - Go to **Gmail Settings → See all settings → Forwarding and POP/IMAP**.
  - Under IMAP access, select Enable IMAP.
  - Click Save Changes.
