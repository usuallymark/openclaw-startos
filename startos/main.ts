import { readFile, writeFile, mkdir } from 'fs/promises'
import { installRootCA, loginToOs } from './actions/loginToOs'
import { authProfilesJson } from './fileModels/authProfiles.json'
import { openclawJson } from './fileModels/openclaw.json'
import { startCliConfigYaml } from './fileModels/startCliConfig.yaml'
import { externalServicesJson } from './fileModels/externalServices.json'
import { i18n } from './i18n'
import {
  uiHostId,
  uiInterfaceId,
  qdrantHostId,
  qdrantInternalPort,
} from './interfaces'
import { sdk } from './sdk'
import { mainMounts, qdrantMounts, uiPort, qdrantPort } from './utils'
import { watchSimplexAddress, withSimplexMounts } from './simplex'
import { requestSimplexPluginUpgrade } from './actions/configureSimplex'

// Maps each provider's auth-profile id to the env var OpenClaw reads its API
// key from. Keep in sync with MANAGED_PROVIDERS in configureApiCredentials.ts.
const providerKeyEnvVar: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GEMINI_API_KEY',
  xai: 'XAI_API_KEY',
}

// rbw XDG environment — every rbw invocation (startup and skills) uses these.
const RBW_ENV = {
  XDG_CONFIG_HOME: '/data/.openclaw/rbw/config',
  XDG_CACHE_HOME: '/data/.openclaw/rbw/cache',
  XDG_RUNTIME_DIR: '/data/.openclaw/rbw/runtime',
  HOME: '/data',
}

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting OpenClaw Gateway!'))

  // Read password for gateway auth (set via critical task during init)
  await openclawJson.read((c) => c.gateway.auth.password).const(effects)

  // Bridge stored provider API keys to the gateway env.
  const profiles =
    (await authProfilesJson.read((p) => p.profiles).const(effects)) ?? {}
  const providerKeyEnv: Record<string, string> = {}
  for (const [provider, varName] of Object.entries(providerKeyEnvVar)) {
    const profile = profiles[`${provider}:default`]
    if (profile?.type === 'token' && profile.token) {
      providerKeyEnv[varName] = profile.token
    }
  }

  // Read external services configuration (reactive — main re-runs on change).
  const ext = await externalServicesJson.read((c) => c).const(effects)

  // Build env vars (non-secret config + vault-lookup markers) and the set of
  // skill dirs to load. Secrets are NOT resolved here — skills call rbw at
  // runtime using the *_FROM_VAULT markers, matching the proven pattern.
  const externalEnv: Record<string, string> = {}
  const enabledSkills: string[] = ['/opt/skills/start-cli', '/opt/skills/qdrant']

  const vw = ext?.vaultwarden
  if (vw?.enabled) {
    enabledSkills.push('/opt/skills/rbw')
  }

  if (ext?.ollama?.enabled && ext.ollama.url) {
    externalEnv['OLLAMA_URL'] = ext.ollama.url
    enabledSkills.push('/opt/skills/ollama')
  }

  if (ext?.nas?.enabled) {
    if (ext.nas.host) externalEnv['NAS_HOST'] = ext.nas.host
    if (ext.nas.share) externalEnv['NAS_SHARE'] = ext.nas.share
    const u = ext.nas.username
    if (u?.source === 'manual' && u.value) {
      externalEnv['NAS_USER'] = u.value
    } else if (u?.source === 'from-vaultwarden') {
      externalEnv['NAS_USER_FROM_VAULT'] = 'NAS:username'
    }
    const p = ext.nas.password
    if (p?.source === 'manual' && p.value) {
      externalEnv['NAS_PASS'] = p.value
    } else if (p?.source === 'from-vaultwarden') {
      externalEnv['NAS_PASS_FROM_VAULT'] = 'NAS:Password'
    }
    enabledSkills.push('/opt/skills/nas')
  }

  if (ext?.n8n?.enabled && ext.n8n.url) {
    externalEnv['N8N_URL'] = ext.n8n.url
    const k = ext.n8n.apiKey
    if (k?.source === 'manual' && k.value) {
      externalEnv['N8N_KEY'] = k.value
    } else if (k?.source === 'from-vaultwarden') {
      externalEnv['N8N_KEY_FROM_VAULT'] = 'n8n:API_Key'
    }
    enabledSkills.push('/opt/skills/n8n')
  }

  if (ext?.trilium?.enabled && ext.trilium.url) {
    externalEnv['TRILIUM_URL'] = ext.trilium.url
    const k = ext.trilium.apiKey
    if (k?.source === 'manual' && k.value) {
      externalEnv['TRILIUM_KEY'] = k.value
    } else if (k?.source === 'from-vaultwarden') {
      externalEnv['TRILIUM_KEY_FROM_VAULT'] = 'Trilium:API_Key'
    }
    enabledSkills.push('/opt/skills/trilium')
  }

  if (ext?.stirling?.enabled && ext.stirling.url) {
    externalEnv['STIRLING_URL'] = ext.stirling.url
    const k = ext.stirling.apiKey
    if (k?.source === 'manual' && k.value) {
      externalEnv['STIRLING_KEY'] = k.value
    } else if (k?.source === 'from-vaultwarden') {
      externalEnv['STIRLING_KEY_FROM_VAULT'] = 'StirlingPDF:API_Key'
    }
    enabledSkills.push('/opt/skills/stirling')
  }

  if (ext?.searxng?.enabled && ext.searxng.url) {
    externalEnv['SEARXNG_URL'] = ext.searxng.url
    enabledSkills.push('/opt/skills/searxng')
  }

  if (ext?.firecrawl?.enabled && ext.firecrawl.url) {
    externalEnv['FIRECRAWL_URL'] = ext.firecrawl.url
    enabledSkills.push('/opt/skills/firecrawl')
  }

  const osIp = await sdk.getOsIp(effects)

  // Ensure required directories exist
  await mkdir(sdk.volumes.main.subpath('.startos'), { recursive: true })
  await mkdir(sdk.volumes.main.subpath('.openclaw/rbw/config/rbw'), {
    recursive: true,
  })
  await mkdir(sdk.volumes.main.subpath('.openclaw/rbw/cache'), {
    recursive: true,
  })
  await mkdir(sdk.volumes.main.subpath('.openclaw/rbw/runtime'), {
    recursive: true,
  })

  await startCliConfigYaml.merge(effects, { host: `https://${osIp}` })

  // Resolve Qdrant's bridge address. Qdrant binds its port to the LXC bridge
  // (interfaces.ts); we read the assigned address here. fallbackPort keeps the
  // value non-null (Qdrant is always present in this package).
  const qdrantAddr = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'openclaw',
      hostId: qdrantHostId,
      internalPort: qdrantInternalPort,
      ssl: false,
      fallbackPort: qdrantPort,
    })
    .const()
  const qdrantUrl = `http://${qdrantAddr}`

  // Load only the skills for enabled services.
  await openclawJson.merge(effects, {
    skills: { load: { extraDirs: enabledSkills } },
  })

  const bridge = await sdk.host
    .getOwn(effects, uiHostId, (host) => {
      const addresses = Object.values(host?.bindings ?? {})
        .flatMap((b) => Object.values(b.interfaces))
        .find((i) => i.id === uiInterfaceId)
        ?.addressInfo.filter({ kind: 'bridge', predicate: (h) => !h.ssl })
        .filter({ kind: 'ipv4' })
      return {
        url: addresses?.format('urlstring')[0],
        proxies:
          addresses?.format('hostname-info').map((h) => h.hostname) ?? [],
      }
    })
    .const()

  await openclawJson.merge(effects, {
    gateway: { trustedProxies: bridge.proxies },
  })

  const mountIntegrations = [withSimplexMounts]
  let mounts = mainMounts()
  for (const appendMounts of mountIntegrations) {
    mounts = await appendMounts(effects, mounts)
  }

  const addressWatchers = [watchSimplexAddress]
  for (const watch of addressWatchers) {
    await watch(effects)
  }

  const openclawSub = sdk.SubContainer.of(
    effects,
    { imageId: 'openclaw' },
    mounts,
    'openclaw-sub',
  )

  const qdrantSub = sdk.SubContainer.of(
    effects,
    { imageId: 'qdrant' },
    qdrantMounts(),
    'qdrant-sub',
  )

  return (
    sdk.Daemons.of(effects)
      .addOneshot('install-root-ca', {
        subcontainer: openclawSub,
        exec: {
          fn: async (subcontainer) => {
            await installRootCA(effects, subcontainer)
            return null
          },
        },
        requires: [],
      })
      .addOneshot('chown', {
        subcontainer: openclawSub,
        exec: {
          command: ['chown', '-R', 'node:node', '/data'],
          user: 'root',
        },
        requires: [],
      })
      // Configure rbw and unlock the vault if Vaultwarden is enabled. Uses a
      // persistent rbw-agent started via setsid so it survives the exec return.
      .addOneshot('setup-vault', {
        subcontainer: openclawSub,
        exec: {
          fn: async (subcontainer) => {
            if (!vw?.enabled || !vw.url || !vw.email || !vw.apiKey || !vw.masterPassword) {
              console.info('Vaultwarden not fully configured — skipping vault setup')
              return null
            }

            // Write rbw config
            const rbwConfig = JSON.stringify({
              email: vw.email,
              base_url: vw.url,
              lock_timeout: 3600,
            })
            await subcontainer.writeFile(
              '/data/.openclaw/rbw/config/rbw/config.json',
              rbwConfig,
            )

            // Start agent detached so it outlives this exec
            await subcontainer.exec(
              ['sh', '-c', 'setsid rbw-agent >/dev/null 2>&1 < /dev/null &'],
              { user: 'node', env: RBW_ENV },
            )
            await new Promise((r) => setTimeout(r, 2000))

            // Login with API key (client_secret) via env, then unlock with
            // master password. rbw reads secrets from stdin/env non-interactively.
            const login = await subcontainer.exec(
              ['sh', '-c', 'printf "%s" "$RBW_API_KEY" | rbw login'],
              { user: 'node', env: { ...RBW_ENV, RBW_API_KEY: vw.apiKey } },
            )
            if (login.exitCode !== 0) {
              console.error('rbw login failed:', String(login.stderr))
            }

            const unlock = await subcontainer.exec(
              ['sh', '-c', 'printf "%s" "$RBW_PASS" | rbw unlock'],
              { user: 'node', env: { ...RBW_ENV, RBW_PASS: vw.masterPassword } },
            )
            if (unlock.exitCode !== 0) {
              console.error('rbw unlock failed:', String(unlock.stderr))
            } else {
              console.info('Vault unlocked successfully')
            }
            return null
          },
        },
        requires: ['install-root-ca', 'chown'],
      })
      .addDaemon('qdrant', {
        subcontainer: qdrantSub,
        exec: {
          command: ['./qdrant'],
          user: 'root',
          env: {
            QDRANT__STORAGE__STORAGE_PATH: '/qdrant/storage',
            QDRANT__SERVICE__HTTP_PORT: qdrantPort.toString(),
            QDRANT__LOG_LEVEL: 'INFO',
          },
        },
        ready: {
          display: i18n('Qdrant Vector Database'),
          fn: () =>
            sdk.healthCheck.checkPortListening(effects, qdrantPort, {
              successMessage: i18n('Qdrant is ready'),
              errorMessage: i18n('Qdrant is not ready'),
            }),
          gracePeriod: 30_000,
        },
        requires: [],
      })
      .addDaemon('primary', {
        subcontainer: openclawSub,
        exec: {
          command: [
            'openclaw',
            'gateway',
            '--port',
            uiPort.toString(),
            '--bind',
            'lan',
            '--verbose',
            '--allow-unconfigured',
          ],
          user: 'node',
          env: {
            HOME: '/data',
            OPENCLAW_STATE_DIR: '/data/.openclaw',
            NODE_EXTRA_CA_CERTS: '/etc/ssl/certs/ca-certificates.crt',
            QDRANT_URL: qdrantUrl,
            // rbw XDG paths so skills can call rbw with the unlocked agent
            XDG_CONFIG_HOME: '/data/.openclaw/rbw/config',
            XDG_CACHE_HOME: '/data/.openclaw/rbw/cache',
            XDG_RUNTIME_DIR: '/data/.openclaw/rbw/runtime',
            ...providerKeyEnv,
            ...externalEnv,
          },
        },
        ready: {
          display: i18n('Web Interface'),
          fn: () =>
            bridge.url
              ? sdk.healthCheck.checkWebUrl(effects, `${bridge.url}/healthz`, {
                  successMessage: i18n('OpenClaw Gateway is ready'),
                  errorMessage: i18n('OpenClaw Gateway is not ready'),
                })
              : Promise.resolve({
                  result: 'starting' as const,
                  message: i18n('OpenClaw Gateway is not ready'),
                }),
          gracePeriod: 40_000,
        },
        requires: ['install-root-ca', 'chown', 'setup-vault', 'qdrant'],
      })
      .addOneshot('check-login', {
        subcontainer: openclawSub,
        exec: {
          fn: async (subcontainer) => {
            const result = await subcontainer.exec(
              ['start-cli', 'auth', 'session', 'list'],
              { user: 'node', env: { HOME: '/data' } },
            )
            if (result.exitCode !== 0) {
              await sdk.action.createOwnTask(effects, loginToOs, 'important', {
                reason: i18n(
                  'Login to StartOS to enable start-cli authentication for managing the server',
                ),
              })
            }
            return null
          },
        },
        requires: ['primary'],
      })
      .addOneshot('check-simplex-plugin', {
        subcontainer: openclawSub,
        exec: {
          fn: (subcontainer) =>
            requestSimplexPluginUpgrade(effects, subcontainer),
        },
        requires: ['primary'],
      })
      .addOneshot('server-state-snapshot', {
        subcontainer: openclawSub,
        exec: {
          fn: async (subcontainer) => {
            const execOpts = { user: 'node' as const, env: { HOME: '/data' } }
            const commands: [string, string[]][] = [
              ['Server Metrics', ['start-cli', 'server', 'metrics']],
              ['Server Time', ['start-cli', 'server', 'time']],
              ['Package List', ['start-cli', 'package', 'list']],
              ['Package Stats', ['start-cli', 'package', 'stats']],
              ['Notifications', ['start-cli', 'notification', 'list']],
              ['Network Gateways', ['start-cli', 'net', 'gateway', 'list']],
              ['Disk List', ['start-cli', 'disk', 'list']],
              ['Backup Targets', ['start-cli', 'backup', 'target', 'list']],
            ]

            const sections: string[] = []
            for (const [label, cmd] of commands) {
              const result = await subcontainer.exec(cmd, execOpts)
              const output =
                result.exitCode === 0
                  ? String(result.stdout).trim() || '_No output_'
                  : `_Command failed (exit ${result.exitCode}): ${String(result.stderr).trim()}_`
              sections.push(`### ${label}\n\n\`\`\`\n${output}\n\`\`\``)
            }

            const stateBlock =
              '## Server State Snapshot\n\n' +
              `_Captured at startup: ${new Date().toISOString()}_\n\n` +
              sections.join('\n\n') +
              '\n'

            const memoryPath = sdk.volumes.main.subpath(
              '.openclaw/workspace/MEMORY.md',
            )
            const existing = await readFile(memoryPath, 'utf-8').catch(() => '')
            const marker = '## Server State Snapshot'
            const idx = existing.indexOf(marker)
            const before =
              idx >= 0 ? existing.slice(0, idx).trimEnd() : existing.trimEnd()
            const updated = before ? before + '\n\n' + stateBlock : stateBlock
            await writeFile(memoryPath, updated)

            return null
          },
        },
        requires: ['primary', 'check-login'],
      })
  )
})
