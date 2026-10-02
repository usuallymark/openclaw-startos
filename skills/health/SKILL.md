---
name: health
description: "Use this skill to check whether this OpenClaw service and the services it depends on are working. Triggers: 'is everything OK?', a tool or service seems down, before blaming a service in a diagnosis, or a health/status report."
---

# Health — service status from inside the container

## Run it

```bash
python3 /opt/skills/health/health.py          # short report
python3 /opt/skills/health/health.py --json   # for scripts
```

It runs the same checks as the health list in the StartOS UI, with the
same addresses, so its answer matches what Mark sees there:

- **Web Interface** (the OpenClaw gateway), **Qdrant**, **Webchat** (if
  enabled)
- **Vault (rbw)**: whether the vault is unlocked (read-only; a locked vault
  unlocks itself on the next credential lookup)
- each **enabled external service**: Vaultwarden, Ollama, NAS (SMB),
  n8n, Trilium, Stirling PDF, SearXNG, Crawl4AI
- **Disk** (`/data`) and **memory**

Exit status: `0` all OK, `1` something is down, `2` could not run.

It sends no credentials and prints no secrets. A service that answers
"401/403" counts as reachable (it is up and wants a login), exactly as in
the StartOS checks.

## What it cannot see

This runs inside the package's own container. There is no `sudo`, no
`podman` and no access to other containers or to StartOS itself, so it
cannot show service logs, restart anything, or report on other packages.
For those, ask Mark: StartOS UI → openclaw, or on the Start9
`sudo start-cli package logs openclaw -l 200`.

Do not try `podman`, `docker`, `systemctl` or `sudo`: they do not exist
here.

## Reading the result

- One external service down, the rest fine: that service (or the network
  path to it) is the problem, not OpenClaw. Say which, with the message.
- Everything external down at once: likely the LAN, DNS host mappings or
  the Tanto host; tell Mark.
- Vault locked and a credential lookup also fails: the master password or
  Vaultwarden settings (Configure External Services) need Mark.
- Disk above 90 % or memory below 256 MiB is reported as a problem.

Report the lines that are not OK, verbatim; don't guess beyond them.
