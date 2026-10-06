import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const v2026_9_4_18 = VersionInfo.of({
  version: '2026.9.4:18',
  releaseNotes: {
    en_US: `Agents in the UI, and local chat models for them.

- New action "Configure Agents": a list of the helper agents the main agent can spawn, with Add and Delete. For each: model, tool profile, extra and blocked tools, skills, which other agents it may spawn, whether the main agent may spawn it, and its instructions folder (a starter AGENTS.md is created). It is filled from OpenClaw's own config every time it opens, and saving changes only what you edited, through OpenClaw's validated writer. No restart needed.
- The main agent can now create and change agents in conversation with the new agents skill, using the same rules; they appear in Configure Agents. It cannot switch on the coding or full profiles, shell or system tools, or change the main agent: those are left to you in Configure Agents.
- Configure AI Provider: new "Local Chat Models for Agents" option. Point it at your own Ollama server and its tool-capable models (embedding-only and tool-less models are left out) become choices in Configure Agents, so helper agents can run locally at no API cost. Models you pull later appear without saving again.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
