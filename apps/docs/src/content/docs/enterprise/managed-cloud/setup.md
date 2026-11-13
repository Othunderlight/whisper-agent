---
title: Managed Cloud Setup
description: Get started with a fully managed Ryōiki Tenkai Enterprise deployment.
---

With Managed Cloud, Ryōiki Tenkai handles the infrastructure so you can focus on your organization. We provision a dedicated server exclusively for your organization, set it up, and manage it on an ongoing basis. All data is private to your organization, and you choose which AI and transcription providers to use.

The server code is fully open source, giving you complete visibility into what runs on your behalf.

## What's Included

- A dedicated Ryōiki Tenkai gateway server provisioned and managed by the Ryōiki Tenkai team.
- An admin portal specific to your organization for managing users, providers, and settings.
- Ongoing server maintenance, updates, and monitoring.
- Support from the Ryōiki Tenkai team for configuration and troubleshooting.

## 1. Onboarding

Contact [enterprise@ryoiki-tenkai.com](mailto:enterprise@ryoiki-tenkai.com) to get started. We'll work with you to provision your dedicated server and provide you with your gateway URL and admin portal URL.

## 2. Configure the Desktop App

Each Ryōiki Tenkai desktop client needs an `enterprise.json` file placed in the app config directory. If you're distributing Ryōiki Tenkai with a tool like Microsoft Intune, this file can be placed automatically as part of the deployment.

If you're doing this manually, place the file at the following path for each platform:

| Platform | Path |
| --- | --- |
| macOS | `~/Library/Application Support/com.ryoikitenkai.desktop/enterprise.json` |
| Linux | `~/.config/com.ryoikitenkai.desktop/enterprise.json` |
| Windows | `C:\Users\<User>\AppData\Roaming\com.ryoikitenkai.desktop\enterprise.json` |

The file should contain:

```json
{
  "gatewayUrl": "https://your-gateway-url"
}
```

Replace `your-gateway-url` with the gateway URL provided during onboarding.

## 3. Create the First Admin

Open the admin portal URL provided during onboarding in your browser. The first person to sign up becomes the organization admin. Use a strong password and store it somewhere safe. If you lose access, contact [enterprise@ryoiki-tenkai.com](mailto:enterprise@ryoiki-tenkai.com) and we can recover it after a verification process.

From here you can manage users, configure settings, and control how Ryōiki Tenkai operates across your organization.
