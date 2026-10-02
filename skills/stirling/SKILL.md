---
name: stirling-pdf
description: "Use this skill to process PDF files: OCR scanned documents, convert files, or extract text. Triggers: any time you receive a PDF that needs OCR, text extraction, or conversion."
---

# Stirling PDF

## Purpose

Stirling PDF is a self-hosted PDF manipulation tool. Use it to OCR scanned
PDFs, extract text, and convert documents to other formats.

## Connection

- Base URL: `STIRLING_URL` (environment). If it is unset, Stirling PDF is
  not configured: tell the user to enable it in Configure External
  Services.
- The API key header is optional (only when Stirling's login is on). Build
  it with `auth_headers(..., required=False)`, which works for both "Enter
  manually" and "Fetch from Vaultwarden" and returns `{}` when no key is
  configured. Never print or store the key.

## OCR a PDF

```python
import os, urllib.request, uuid
import sys; sys.path.insert(0, '/opt/skills/rbw')
from creds import auth_headers

base = os.environ['STIRLING_URL']

def ocr_pdf(pdf_path, language='eng'):
    with open(pdf_path, 'rb') as f:
        pdf_data = f.read()
    boundary = uuid.uuid4().hex
    body = (
        f'--{boundary}\r\n'
        'Content-Disposition: form-data; name="fileInput"; filename="document.pdf"\r\n'
        'Content-Type: application/pdf\r\n\r\n'
    ).encode() + pdf_data + (
        f'\r\n--{boundary}\r\n'
        'Content-Disposition: form-data; name="languages"\r\n\r\n'
        f'{language}\r\n'
        f'--{boundary}--\r\n'
    ).encode()

    hdrs = auth_headers('X-API-KEY', 'STIRLING_KEY', required=False)
    hdrs['Content-Type'] = f'multipart/form-data; boundary={boundary}'
    req = urllib.request.Request(f'{base}/api/v1/misc/ocr-pdf', data=body, headers=hdrs, method='POST')
    with urllib.request.urlopen(req, timeout=300) as resp:
        return resp.read()  # the processed PDF bytes
```

## Notes

- Supported languages: `eng` (English), `fra` (French), `deu` (German), etc.
- OCR output is a searchable PDF, not plain text; extract text from it
  afterwards if needed.
- A 401 means Stirling's login is on and no (or a wrong) API key is set.
- For long code, write a script file and run it rather than a long
  `python3 -c` one-liner.
