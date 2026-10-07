import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.4:20',
  releaseNotes: {
    en_US: `Built-in PDF reading and OCR; Stirling PDF removed.

- New **pdf** skill, always loaded: extracts the text of a PDF, OCRs pages that are scans (Tesseract, English) with OCRmyPDF, writes searchable copies, and ingests a PDF into a Qdrant collection (page-aware chunks, stable ids, optional replace). Runs inside the container at low CPU priority; no external service needed. The health report gains a "PDF/OCR tools" line.
- **Stirling PDF is removed** from Configure External Services, the health checks and the skills. An old Stirling setting is ignored and dropped on the next save.
- Helpers run from a shell that the gateway did not start (a root debug shell, a git hook) now read the service settings from the running gateway instead of saying "not configured": getcred, the NAS, Crawl4AI and ntfy helpers. Errors name the missing variable and where it was looked for. New \`gateway-env COMMAND\` runs any command with the gateway's environment, as user node.
- \`cryptography\` is now pinned directly in the image's Python libraries (workspace scripts import it), and \`procps\` (ps, pgrep, free) is installed.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
