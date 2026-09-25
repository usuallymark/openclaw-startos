import { sdk } from './sdk'
import { uiPort, qdrantPort } from './utils'
import { i18n } from './i18n'

// Host id (the sdk.MultiHost.of group) — distinct from the interface id exported on it.
export const uiHostId = 'ui-multi'
export const uiInterfaceId = 'ui'

// Qdrant internal bridge-only binding — NOT exported to LAN.
// The openclaw container reaches Qdrant via sdk.host.getBridgeAddress() in main.ts.
export const qdrantHostId = 'qdrant'
export const qdrantInternalPort = qdrantPort

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  const uiMulti = sdk.MultiHost.of(effects, uiHostId)
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: uiInterfaceId,
    description: i18n(
      'The OpenClaw Gateway web interface providing WebChat and control panel',
    ),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const uiReceipt = await uiMultiOrigin.export([ui])

  // Qdrant — bind to bridge only, no export to LAN.
  // Other containers in this package reach it via sdk.host.getBridgeAddress().
  await sdk.MultiHost.of(effects, qdrantHostId).bindPort(qdrantPort, {
    protocol: 'http',
    preferredExternalPort: qdrantPort,
  })

  return [uiReceipt]
})
