---
name: stirling-pdf
description: "Use this skill to process PDF files: OCR scanned documents, convert files, or extract text. Triggers: any time you receive a PDF that needs OCR, text extraction, or conversion."
---

# Stirling PDF

## Purpose

Stirling PDF is a self-hosted PDF manipulation tool. Use it to OCR scanned
PDFs, extract text, and convert documents to other formats.

## Connection

```python
import os
STIRLING_URL = os.environ.get('STIRLING_URL')
STIRLING_KEY = os.environ.get('STIRLING_KEY', '')

if not STIRLING_URL:
    raise RuntimeError('Stirling PDF is not configured. Enable it in Configure External Services.')
```

## OCR a PDF

```python
import urllib.request, os

STIRLING_URL = os.environ['STIRLING_URL']
STIRLING_KEY = os.environ.get('STIRLING_KEY', '')

def ocr_pdf(pdf_path, language='eng'):
    with open(pdf_path, 'rb') as f:
        pdf_data = f.read()

    boundary = b'----FormBoundary'
    body = (
        b'--' + boundary + b'\r\n'
        b'Content-Disposition: form-data; name="fileInput"; filename="document.pdf"\r\n'
        b'Content-Type: application/pdf\r\n\r\n' +
        pdf_data + b'\r\n'
        b'--' + boundary + b'\r\n'
        b'Content-Disposition: form-data; name="languages"\r\n\r\n' +
        language.encode() + b'\r\n'
        b'--' + boundary + b'--\r\n'
    )

    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary.decode()}',
    }
    if STIRLING_KEY:
        headers['X-API-KEY'] = STIRLING_KEY

    req = urllib.request.Request(
        f'{STIRLING_URL}/api/v1/misc/ocr-pdf',
        data=body,
        headers=headers,
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=120)
    return resp.read()  # returns processed PDF bytes
```

## Notes

- Supported languages: `eng` (English), `fra` (French), `deu` (German), etc.
- OCR output is a searchable PDF, not plain text — use a PDF reader to extract text
- For large documents, increase the timeout
- API key is optional if Stirling PDF authentication is not enabled
