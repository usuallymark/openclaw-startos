---
name: n8n
description: "Use this skill to trigger and monitor n8n workflows. Triggers: any time you need to run an automated workflow, send data to n8n, or check the status of a running workflow."
---

# n8n — Workflow Automation

## Purpose

n8n is an open-source workflow automation tool. Use it to trigger automated
workflows, pass data between systems, and monitor background processes.

## Connection

```python
import os
N8N_URL = os.environ.get('N8N_URL')
N8N_KEY = os.environ.get('N8N_KEY')

if not N8N_URL:
    raise RuntimeError('n8n is not configured. Enable it in Configure External Services.')
```

## Trigger a Workflow via Webhook

```python
import json, urllib.request, os

N8N_URL = os.environ['N8N_URL']

def trigger_webhook(webhook_path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(
        f'{N8N_URL}/webhook/{webhook_path}',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())

result = trigger_webhook('my-workflow-id', {'key': 'value'})
```

## List Workflows via API

```python
import json, urllib.request, os

N8N_URL = os.environ['N8N_URL']
N8N_KEY = os.environ['N8N_KEY']

req = urllib.request.Request(
    f'{N8N_URL}/api/v1/workflows',
    headers={'X-N8N-API-KEY': N8N_KEY}
)
resp = urllib.request.urlopen(req, timeout=10, cadefault=True)
workflows = json.loads(resp.read())
for wf in workflows.get('data', []):
    print(f"{wf['id']}: {wf['name']} ({'active' if wf['active'] else 'inactive'})")
```

## Notes

- Webhook URLs don't require authentication
- API calls require the `X-N8N-API-KEY` header
- n8n may use self-signed TLS — if SSL errors occur, the URL may need to use http://
- Find your webhook URL in n8n → Workflow → Webhook node → Test URL
