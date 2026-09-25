---
name: rbw
description: "Use this skill to fetch credentials from Vaultwarden via rbw. Triggers: any time you need a password, API key, token, or secret that is stored in Vaultwarden. Do not call rbw unless Vaultwarden is configured."
---

# rbw — Vaultwarden Credential Fetching

## Purpose

Fetch credentials from Vaultwarden at runtime using the rbw CLI. This avoids
hardcoding any secrets in skills, workspace files, or code. All credentials
used by other skills should be fetched via this skill rather than stored
elsewhere.

## When to Use

Call this skill whenever you need a credential that is stored in Vaultwarden:
- API keys for external services
- Passwords for NAS, databases, or services
- Tokens for Trilium, n8n, Gitea, etc.

Do NOT call rbw if Vaultwarden is not configured — check the environment first.

## Environment

rbw is installed at `/usr/bin/rbw`. Configuration and cache are stored at:
- Config: `/data/.openclaw/rbw/config/rbw/config.json`
- Cache: `/data/.openclaw/rbw/cache/`
- Runtime: `/data/.openclaw/rbw/runtime/`

The vault is unlocked automatically at startup if Vaultwarden is configured.

## Fetching a Credential

```bash
python3 -c "
import subprocess, sys

def rbw_get(entry, field=None):
    cmd = ['rbw', 'get', entry] if not field else ['rbw', 'get', '--field', field, entry]
    env = {
        'XDG_CONFIG_HOME': '/data/.openclaw/rbw/config',
        'XDG_CACHE_HOME': '/data/.openclaw/rbw/cache',
        'XDG_RUNTIME_DIR': '/data/.openclaw/rbw/runtime',
        'PATH': '/usr/bin:/usr/local/bin',
        'HOME': '/data',
    }
    result = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if result.returncode != 0:
        print(f'ERROR: rbw failed for {entry}/{field}: {result.stderr.strip()}', file=sys.stderr)
        return None
    return result.stdout.strip()

# Examples:
value = rbw_get('n8n', 'API_Key')
print(value)
"
```

## Entry Naming Convention

All Vaultwarden entries used by OpenClaw follow this convention:
- Entry name: the service name exactly as listed (e.g. `n8n`, `Trilium`, `NAS`, `Qdrant`)
- Field name: `API_Key` for API keys, `Password` for passwords, `username` for usernames

Example entries:
| Service | Entry Name | Field |
|---|---|---|
| n8n | `n8n` | `API_Key` |
| Trilium | `Trilium` | `API_Key` |
| NAS username | `NAS` | `username` |
| NAS password | `NAS` | `Password` |
| Qdrant | `Qdrant` | `API_Key` |
| Gitea | `Gitea` | `API_Key` |
| Anthropic | `Anthropic` | `API_Key` |

## Checking Vault Status

```bash
rbw unlocked && echo "UNLOCKED" || echo "LOCKED"
```

If locked, the startup oneshot failed. Check the service logs.
