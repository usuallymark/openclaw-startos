---
name: trilium
description: "Use this skill to create, read, and organize notes in Trilium Notes. Triggers: any time you need to save research, create a structured note, or retrieve information from Trilium."
---

# Trilium Notes

## Purpose

Trilium Notes is a hierarchical note-taking application. Use it to create
and organize research notes, summaries, and structured information that
should persist outside of AI memory.

## Connection

```python
import os
TRILIUM_URL = os.environ.get('TRILIUM_URL')
TRILIUM_KEY = os.environ.get('TRILIUM_KEY')

if not TRILIUM_URL:
    raise RuntimeError('Trilium is not configured. Enable it in Configure External Services.')
```

## Create a Note

```python
import json, urllib.request, os

TRILIUM_URL = os.environ['TRILIUM_URL']
TRILIUM_KEY = os.environ['TRILIUM_KEY']

def trilium_create_note(parent_note_id, title, content, note_type='text'):
    body = json.dumps({
        'parentNoteId': parent_note_id,
        'title': title,
        'type': note_type,
        'content': content,
    }).encode()
    req = urllib.request.Request(
        f'{TRILIUM_URL}/create-note',
        data=body,
        headers={
            'Content-Type': 'application/json',
            'Authorization': TRILIUM_KEY,
        },
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())

result = trilium_create_note('root', 'Research Note', '<p>Content here</p>')
print(result['note']['noteId'])
```

## Search Notes

```python
def trilium_search(query):
    encoded = urllib.parse.quote(query)
    req = urllib.request.Request(
        f'{TRILIUM_URL}/notes?search={encoded}',
        headers={'Authorization': TRILIUM_KEY}
    )
    resp = urllib.request.urlopen(req, timeout=10)
    return json.loads(resp.read())
```

## Get Note Content

```python
def trilium_get_note(note_id):
    req = urllib.request.Request(
        f'{TRILIUM_URL}/notes/{note_id}/content',
        headers={'Authorization': TRILIUM_KEY}
    )
    resp = urllib.request.urlopen(req, timeout=10)
    return resp.read().decode()
```

## Notes

- The URL should include the `/etapi` path, e.g. `https://trilium.yourdomain.local/etapi`
- Content is HTML for text notes; use plain `<p>` tags for simple notes
- `root` is the top-level parent note ID
- Find note IDs by right-clicking a note in Trilium → Note Info
