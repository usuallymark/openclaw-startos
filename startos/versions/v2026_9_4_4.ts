import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_4 = VersionInfo.of({
  version: '2026.9.4:4',
  releaseNotes: {
    en_US: `Adds an optional, mobile-friendly **Webchat** (off by default).

- Turn it on with the new **Configure Webchat** action. Add one profile per person, each with its own name, color, optional greeting, preset conversations and optional PIN. Each profile gets its own address and can be added to a phone's home screen as its own app.
- Each profile only sees its own conversations. The browser never receives the gateway password: the webchat server talks to OpenClaw on the person's behalf.
- A PIN is asked once per device and remembered (90 days by default). Changing a PIN signs out every device for that profile; repeated wrong PINs are locked out.
- The agent can hand files to the person as download buttons (new **webchat-present** skill, loaded while the webchat is on).
- A **Webchat** health check goes green once the webchat is connected to OpenClaw.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
