---
name: nas
description: "Use this skill to read and write files on the NAS (Network Attached Storage) via SMB. Triggers: any time you need to access files, photos, documents, or other content stored on the NAS."
---

# NAS — Network Attached Storage

## Purpose

Access files on a NAS (Network Attached Storage) server via SMB/CIFS.
Used for reading and writing files, photos, documents, and other content
that lives on your network storage.

## Connection

Credentials come from environment variables (set by OpenClaw at startup,
sourced from Configure External Services settings or Vaultwarden):

```python
import os, sys
sys.path.insert(0, '/data/.openclaw/python-libs')

NAS_HOST = os.environ.get('NAS_HOST')
NAS_SHARE = os.environ.get('NAS_SHARE')
NAS_USER = os.environ.get('NAS_USER')
NAS_PASS = os.environ.get('NAS_PASS')

if not all([NAS_HOST, NAS_SHARE, NAS_USER, NAS_PASS]):
    raise RuntimeError('NAS is not configured. Enable it in Configure External Services.')
```

## Read a File

```python
import smbclient, os, sys
sys.path.insert(0, '/data/.openclaw/python-libs')

NAS_HOST = os.environ['NAS_HOST']
NAS_USER = os.environ['NAS_USER']
NAS_PASS = os.environ['NAS_PASS']
NAS_SHARE = os.environ['NAS_SHARE']

smbclient.register_session(NAS_HOST, username=NAS_USER, password=NAS_PASS)

path = rf'\\{NAS_HOST}\{NAS_SHARE}\path\to\file.txt'
with smbclient.open_file(path, mode='r') as f:
    content = f.read()
print(content)
```

## Write a File

```python
path = rf'\\{NAS_HOST}\{NAS_SHARE}\path\to\output.txt'
with smbclient.open_file(path, mode='w') as f:
    f.write('content here')
```

## Read an Image (for vision analysis)

```python
import base64

path = rf'\\{NAS_HOST}\{NAS_SHARE}\Photos\image.jpg'
with smbclient.open_file(path, mode='rb') as f:
    img_b64 = base64.b64encode(f.read()).decode()
# Pass img_b64 to Ollama vision model
```

## List Directory Contents

```python
entries = smbclient.listdir(rf'\\{NAS_HOST}\{NAS_SHARE}\path\to\folder')
for entry in entries:
    print(entry)
```

## Notes

- Always use raw strings (`r'...'`) or double backslashes for SMB paths
- The `smbclient` package is pre-installed in `/data/.openclaw/python-libs/`
- Sessions are reused automatically within the same Python process
- For large files, use binary mode (`'rb'`/`'wb'`) not text mode
