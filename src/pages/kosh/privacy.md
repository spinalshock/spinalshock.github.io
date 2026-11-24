---
title: Kosh privacy policy
description: How Kosh handles your data, including data from Gmail.
---

# Kosh privacy policy

_Last updated 24 November 2026_

Kosh is a private finance app run by Om Athalye on his own home server, for himself and his family. This policy explains what Kosh reads, what it keeps and who can see it.

## What Kosh reads from Google

If you connect your Google account, Kosh asks for one permission: **read-only access to Gmail** (`gmail.readonly`).

Kosh uses it only to:

1. Search your mailbox for credit card statement emails from your banks, by sender address.
2. Download the statement PDF attached to those emails and read the statement date, total amount due, minimum amount due, due date and the last digits of the card.

Kosh does not read, store or process any other email. It cannot send, change or delete email.

## What Kosh keeps

- The figures listed above, saved against the matching card in Kosh.
- The ID of each statement email it has processed, so it doesn't read the same one twice.
- The access token Google issues when you connect, so Kosh can check for new statements daily.
- The password for each bank's statement PDFs, which you save yourself.

Statement PDFs and email contents are not kept after the figures are read.

## Where it is kept and who can see it

All data stays on Kosh's server in our home. It is reachable only over our private network. It is not sold, shared, used for advertising, or sent to anyone else. No person reads your email; the process is automatic. Within Kosh, only you, and family members you have agreed to share with, can see your figures.

## Google API Services User Data Policy

Kosh's use and transfer of information received from Google APIs to any other app will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

## Removing access and data

You can disconnect Gmail in Kosh at any time, which deletes the stored access token and statement passwords. You can also remove Kosh's access from your Google account at [myaccount.google.com/permissions](https://myaccount.google.com/permissions). Ask Om to delete any figures Kosh has saved, and they will be removed.

## Contact

Questions about this policy: [github.com/spinalshock](https://github.com/spinalshock).
