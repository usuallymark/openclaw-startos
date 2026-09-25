---
name: firecrawl
description: "Use this skill to scrape and extract clean content from web pages. Triggers: any time you need the full text of a specific web page, want to extract structured content from a URL, or need to crawl a site for information."
---

# Firecrawl — Web Scraping

## Purpose

Firecrawl converts web pages into clean, structured Markdown content that
agents can read and analyze. Use it when you need the full content of a
specific URL, not just a search snippet.

## Connection

```python
import os
FIRECRAWL_URL = os.environ.get('FIRECRAWL_URL')

if not FIRECRAWL_URL:
    raise RuntimeError('Firecrawl is not configured. Enable it in Configure External Services.')
```

## Scrape a Single URL

```python
import json, urllib.request, os

FIRECRAWL_URL = os.environ['FIRECRAWL_URL']

def scrape(url, formats=None):
    if formats is None:
        formats = ['markdown']
    body = json.dumps({'url': url, 'formats': formats}).encode()
    req = urllib.request.Request(
        f'{FIRECRAWL_URL}/v1/scrape',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=60)
    data = json.loads(resp.read())
    return data.get('data', {}).get('markdown', '')

content = scrape('https://example.com/article')
print(content[:2000])
```

## Crawl a Site (multiple pages)

```python
def crawl(url, max_pages=5):
    body = json.dumps({
        'url': url,
        'limit': max_pages,
        'scrapeOptions': {'formats': ['markdown']},
    }).encode()
    req = urllib.request.Request(
        f'{FIRECRAWL_URL}/v1/crawl',
        data=body,
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    resp = urllib.request.urlopen(req, timeout=30)
    data = json.loads(resp.read())
    crawl_id = data.get('id')

    # Poll for results
    import time
    for _ in range(30):
        time.sleep(2)
        req = urllib.request.Request(f'{FIRECRAWL_URL}/v1/crawl/{crawl_id}')
        resp = urllib.request.urlopen(req, timeout=10)
        status = json.loads(resp.read())
        if status.get('status') == 'completed':
            return [p.get('markdown', '') for p in status.get('data', [])]
    return []
```

## Notes

- Scraping is better than crawling for a single known URL
- Respect copyright: summarize content, don't store verbatim large passages
- Some sites block scrapers — try a different source if scraping fails
- Forum posts and documentation pages work well; paywalled content does not
