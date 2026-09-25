---
name: qdrant
description: "Use this skill for all vector database operations: storing embeddings, semantic search, memory retrieval, and collection management. Triggers: any time you need to remember something long-term, search memory, or work with embeddings."
---

# Qdrant — Vector Database

## Purpose

Qdrant is the vector database that powers OpenClaw's long-term memory,
semantic search, and knowledge retrieval. All persistent memory and
knowledge library operations go through Qdrant.

## Connection

Qdrant runs as a companion service inside the same OpenClaw package.
The URL is provided via environment variable:

```python
import os
QDRANT_URL = os.environ.get('QDRANT_URL', 'http://localhost:6333')
QDRANT_KEY = os.environ.get('QDRANT_API_KEY', '')
```

## Common Operations

### Search (semantic similarity)

```python
import json, urllib.request, os, sys
sys.path.insert(0, '/data/.openclaw/python-libs')

QDRANT_URL = os.environ.get('QDRANT_URL', 'http://localhost:6333')

def qdrant_search(collection, vector, limit=5):
    body = json.dumps({'vector': vector, 'limit': limit, 'with_payload': True}).encode()
    req = urllib.request.Request(
        f'{QDRANT_URL}/collections/{collection}/points/search',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())['result']
```

### Upsert (store a point)

```python
def qdrant_upsert(collection, point_id, vector, payload):
    body = json.dumps({
        'points': [{'id': point_id, 'vector': vector, 'payload': payload}]
    }).encode()
    req = urllib.request.Request(
        f'{QDRANT_URL}/collections/{collection}/points',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='PUT'
    )
    urllib.request.urlopen(req, timeout=10)
```

### List collections

```python
req = urllib.request.Request(f'{QDRANT_URL}/collections')
resp = urllib.request.urlopen(req, timeout=5)
collections = [c['name'] for c in json.loads(resp.read())['result']['collections']]
print(collections)
```

## Standard Collections

Collections used by OpenClaw agents:
- `alfred-memory` — Alfred's general long-term memory
- `mara-voice-corpus` — Mara's voice and writing samples
- `mara-voice-feedback` — Feedback on Mara's voice
- `mara-lmt-library` — Licensed massage therapy library
- `mara-social-posts` — Social media post archive
- `mara-health-insurance` — Health insurance documents
- `mara-business` — Business intelligence data
- `canva-docs` — Canva documentation and guides
- `rawtherapee` — RawTherapee photo editing guides

## Generating Embeddings

Use Ollama's nomic-embed-text model to generate vectors:

```python
OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://localhost:11434')

def embed(text):
    body = json.dumps({'model': 'nomic-embed-text', 'input': text}).encode()
    req = urllib.request.Request(
        f'{OLLAMA_URL}/api/embed',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read())['embeddings'][0]
```
