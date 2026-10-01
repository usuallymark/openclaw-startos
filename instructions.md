# OpenClaw Setup Guide

OpenClaw is an AI agent platform powered by Claude. This package includes
OpenClaw plus a built-in Qdrant vector database for long-term memory, and
optional integration with rbw (Vaultwarden) for secure credential management.

---

## Quick Start

### 1. Set a Gateway Password

Run the **Set Password** action. This is the password you'll use to log into
the OpenClaw web interface. Choose something you'll remember — it protects
access to your AI agent.

### 2. Configure an AI Provider

Run the **Configure AI Provider** action and enter your API key for your
chosen provider (Anthropic Claude, OpenAI, etc.). Without this, OpenClaw
cannot process any requests.

### 3. Configure External Services (Optional but Recommended)

Run the **Configure External Services** action to connect OpenClaw to your
self-hosted tools. Each service can be independently enabled or disabled:

| Service | What it enables |
|---|---|
| **Vaultwarden** | Secure credential storage — enable this first if you use it |
| **Ollama** | Local AI models for embeddings and vision analysis |
| **NAS** | Read/write files on your network storage |
| **n8n** | Trigger automated workflows |
| **Trilium Notes** | Create and organize research notes |
| **Stirling PDF** | OCR and process PDF documents |
| **SearXNG** | Privacy-respecting web search |
| **Firecrawl** | Extract content from web pages |

**Configure Vaultwarden first** if you use it — once it's enabled, credential
fields for other services will automatically offer to fetch from Vaultwarden
instead of requiring manual entry.

### 4. Open the Web Interface

Find the OpenClaw interface address under **Interfaces** in the StartOS UI.
Log in with the gateway password you set in Step 1.

---

## Vaultwarden Setup

Vaultwarden stores all your service credentials securely. OpenClaw fetches
them automatically at startup, so you never need to enter passwords directly
into skill files.

**To set up Vaultwarden integration:**

In Configure External Services, enable Vaultwarden and enter:
- Your Vaultwarden server URL
- Your account email
- Your master password — paste it exactly. It is stored byte-for-byte in a
  private file and never shown again; leave the field blank later to keep it.

Login uses the master password only (rbw does not support API-key login).
The vault unlocks at startup and re-unlocks automatically when a skill needs it.

**If Vaultwarden has a `.local` name or an internal certificate**, also fill in:
- **Custom Host Mappings** — e.g. `vaultwarden.home.local` → `192.168.1.50`.
  StartOS treats `.local` as mDNS-only and never forwards it to your DNS
  server, so these names cannot resolve from inside a service otherwise.
- **Custom CA Certificate** — paste the PEM of the CA that signed the
  certificate, so HTTPS to it is trusted.

**Vaultwarden entry naming convention:**

OpenClaw looks up credentials by entry name and field. Use these exact names:

| Service | Entry Name | Field |
|---|---|---|
| n8n | `n8n` | `API_Key` |
| Trilium | `Trilium` | `API_Key` |
| NAS username | `NAS` | `username` |
| NAS password | `NAS` | `Password` |
| Gitea | `Gitea` | `API_Key` |
| Anthropic | `Anthropic` | `API_Key` |
| Qdrant | `Qdrant` | `API_Key` |

---

## Restoring a Custom Workspace

If you have an existing OpenClaw workspace in a git repository (Gitea,
GitHub, etc.), you can restore it after installation:

1. Connect to your Start9 server via SSH
2. Attach to the OpenClaw container:
   ```
   sudo start-cli package attach openclaw
   ```
3. Clone your workspace:
   ```
   cd /data/.openclaw/workspace
   git init
   git remote add origin https://YOUR-GITEA-URL/YOUR-REPO.git
   git fetch origin master
   cp /data/.openclaw/openclaw.json /data/.openclaw/openclaw.json.bak
   git reset --hard origin/master
   cp /data/.openclaw/openclaw.json.bak /data/.openclaw/openclaw.json
   ```

This preserves the package-managed `openclaw.json` while restoring all your
custom workspace files (AGENTS.md, skills, workspaces, etc.).

---

## Updating

When a new version of this package is available, download the `.s9pk` file
and sideload it via **StartOS → System → Sideload a Service**. Your data
and configuration are preserved automatically.

---

## Troubleshooting

**Health check shows "not ready":**
Check the service logs (StartOS → OpenClaw → Logs) for error messages.
Common causes: missing AI provider key, Qdrant startup delay (allow 30s).

**Vaultwarden credentials not loading:**
Check the logs for the `setup-vault` step. "error sending request" usually
means a `.local` name without a Custom Host Mapping, or an internal HTTPS
certificate without the Custom CA Certificate. An authentication error means
the master password is wrong — re-enter it exactly in Configure External
Services.

**Health checks:**
The service page shows a check for each enabled external service and, if
Vaultwarden is enabled, for the vault. External checks only test that the
service is reachable from OpenClaw (every minute); they do not test stored
API keys. A red check names the address that failed. "Could not resolve host"
usually means a `.local` name without a Custom Host Mapping; a certificate
error means the Custom CA Certificate is missing. The vault check performs a
full unlock every 5 minutes, so a wrong master password shows up quickly.

**Skills not working after enabling a service:**
OpenClaw must be restarted after configuring external services. The restart
happens automatically when you save the Configure External Services action.

**Workspace files lost after update:**
Updates preserve the `/data` volume. If files are missing, your workspace
may not have been restored from git. Follow the "Restoring a Custom Workspace"
steps above.
