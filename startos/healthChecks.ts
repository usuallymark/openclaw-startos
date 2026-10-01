import type { SubContainer } from '@start9labs/start-sdk'
import { sdk } from './sdk'
import { RBW_ENV } from './vault'

// Health checks for the vault and external services.
//
// Every probe runs INSIDE the openclaw subcontainer, so it sees exactly what
// the agent sees: the /etc/hosts mappings and custom CA certs installed by
// the network-setup oneshot. Probing from the package runtime instead would
// fail on .local names and internal certificates the agent handles fine.
//
// Checks are reachability-only: no credentials are sent to external services.
// A disabled service keeps its slot in the chain but is hidden (display null)
// and reports 'disabled', which keeps the daemon chain static and typed.

type Sub = SubContainer<typeof sdk.manifest>
type Result =
  | { result: 'success'; message: string | null }
  | { result: 'failure'; message: string }
  | { result: 'disabled'; message: string | null }

const DISABLED: Result = { result: 'disabled', message: null }

// External services: 60 s while healthy, 30 s while failing.
export const externalTrigger = sdk.trigger.statusTrigger(60_000, {
  failure: 30_000,
})
// Vault: an unlock round-trip every 5 minutes (1 minute while failing).
export const vaultTrigger = sdk.trigger.statusTrigger(300_000, {
  failure: 60_000,
})

const joinUrl = (base: string, path: string) => base.replace(/\/+$/, '') + path

function firstLine(s: unknown): string {
  return (
    String(s ?? '')
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l) ?? ''
  )
}

/**
 * HTTP reachability from inside the container. Any HTTP response below 500
 * counts as reachable (401/403 just mean "up, wants credentials").
 */
export async function probeHttp(
  sub: Sub,
  label: string,
  url: string,
): Promise<Result> {
  try {
    const res = await sub.exec(
      [
        'curl',
        '-sS',
        '-o',
        '/dev/null',
        '-w',
        '%{http_code}',
        '--max-time',
        '8',
        url,
      ],
      { user: 'node' },
      15_000,
    )
    const code = parseInt(String(res.stdout).trim(), 10)
    if (res.exitCode === 0 && code > 0 && code < 500) {
      return { result: 'success', message: `${label} reachable` }
    }
    if (res.exitCode === 0) {
      return {
        result: 'failure',
        message: `${label} returned HTTP ${code} at ${url}`,
      }
    }
    return {
      result: 'failure',
      message: `${label} unreachable at ${url}: ${firstLine(res.stderr) || `curl exit ${res.exitCode}`}`,
    }
  } catch (e) {
    return {
      result: 'failure',
      message: `${label} check error: ${firstLine((e as Error)?.message)}`,
    }
  }
}

/** Plain TCP connect (used for SMB on the NAS). */
export async function probeTcp(
  sub: Sub,
  label: string,
  host: string,
  port: number,
): Promise<Result> {
  try {
    const res = await sub.exec(
      ['bash', '-c', 'timeout 5 bash -c "</dev/tcp/$H/$P" 2>&1'],
      { user: 'node', env: { H: host, P: String(port) } },
      15_000,
    )
    if (res.exitCode === 0) {
      return { result: 'success', message: `${label} reachable` }
    }
    return {
      result: 'failure',
      message: `${label} unreachable at ${host}:${port}${res.exitCode === 124 ? ' (timed out)' : `: ${firstLine(res.stdout) || `exit ${res.exitCode}`}`}`,
    }
  } catch (e) {
    return {
      result: 'failure',
      message: `${label} check error: ${firstLine((e as Error)?.message)}`,
    }
  }
}

/**
 * End-to-end vault check: `rbw unlock` exercises the master password, the
 * file pinentry and the Vaultwarden connection; `rbw unlocked` confirms it.
 * Unlock is a no-op when already unlocked.
 */
export async function probeVault(sub: Sub): Promise<Result> {
  try {
    const res = await sub.exec(
      ['sh', '-c', 'timeout 60 rbw unlock && rbw unlocked'],
      { user: 'node', env: RBW_ENV },
      90_000,
    )
    if (res.exitCode === 0) {
      return { result: 'success', message: 'Vault unlocked' }
    }
    const why =
      res.exitCode === 124
        ? 'unlock timed out'
        : firstLine(res.stderr) || `exit ${res.exitCode}`
    return {
      result: 'failure',
      message: `Vault locked — ${why}. Check the master password and Vaultwarden settings in Configure External Services.`,
    }
  } catch (e) {
    return {
      result: 'failure',
      message: `Vault check error: ${firstLine((e as Error)?.message)}`,
    }
  }
}

// ── Per-service specs, built from the external-services config ─────────────

type ExtConfig =
  | {
      vaultwarden?: { enabled?: boolean; url?: string }
      ollama?: { enabled?: boolean; url?: string }
      nas?: { enabled?: boolean; host?: string }
      n8n?: { enabled?: boolean; url?: string }
      trilium?: { enabled?: boolean; url?: string }
      stirling?: { enabled?: boolean; url?: string }
      searxng?: { enabled?: boolean; url?: string }
      firecrawl?: { enabled?: boolean; url?: string }
    }
  | undefined
  | null

export type CheckSpec = {
  display: string | null
  fn: (sub: Sub) => Promise<Result>
}

function http(
  label: string,
  svc: { enabled?: boolean; url?: string } | undefined,
  path: string,
): CheckSpec {
  if (!svc?.enabled || !svc.url) {
    return { display: null, fn: async () => DISABLED }
  }
  const url = joinUrl(svc.url, path)
  return { display: label, fn: (sub) => probeHttp(sub, label, url) }
}

export function externalChecks(ext: ExtConfig) {
  const nas = ext?.nas
  return {
    vaultwarden: http('Vaultwarden', ext?.vaultwarden, '/alive'),
    ollama: http('Ollama', ext?.ollama, '/api/tags'),
    n8n: http('n8n', ext?.n8n, '/healthz'),
    // Trilium's URL already ends in /etapi; app-info answers 401 without a
    // token, which still proves the ETAPI is up.
    trilium: http('Trilium', ext?.trilium, '/app-info'),
    stirling: http('Stirling PDF', ext?.stirling, '/api/v1/info/status'),
    searxng: http('SearXNG', ext?.searxng, '/healthz'),
    firecrawl: http('Firecrawl', ext?.firecrawl, '/'),
    nas:
      nas?.enabled && nas.host
        ? {
            display: 'NAS (SMB)',
            fn: (sub: Sub) => probeTcp(sub, 'NAS', nas.host!, 445),
          }
        : { display: null, fn: async () => DISABLED },
  } satisfies Record<string, CheckSpec>
}
