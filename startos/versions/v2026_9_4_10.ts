import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_10 = VersionInfo.of({
  version: '2026.9.4:10',
  releaseNotes: {
    en_US: `Crawl4AI replaces Firecrawl for fetching web pages.

- Configure External Services: "Firecrawl" is replaced by "Crawl4AI (Web Scraping)", with a URL and an API token (from Vaultwarden entry "Crawl4AI", field "API_Key", or entered manually). If you had Firecrawl enabled, enable Crawl4AI instead.
- New crawl4ai skill: the agent uses the built-in web fetch for simple pages and Crawl4AI, which renders pages in a real browser, when that is not enough. It gets back only the page title and Markdown, not the full raw response.
- New health check for Crawl4AI.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
