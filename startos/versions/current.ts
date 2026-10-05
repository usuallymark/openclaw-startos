import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '2026.9.4:17',
  releaseNotes: {
    en_US: `Live model lists, a Memory Embeddings setting, and safer Qdrant collections.

- Configure AI Provider: the model dropdowns are now filled live from each provider (Anthropic, OpenAI, Google, xAI) once its API key is saved, so new models appear without a package update. If a provider can't be reached, the last list it returned is used. The Custom Model field stays.
- New "Memory Embeddings" section, independent of the chat model: choose OpenAI, Google, your own Ollama server, any OpenAI-compatible server, or keyword-only for OpenClaw's memory search. You can now chat with one provider and embed with another. Until now memory search silently fell back to keywords when there was no OpenAI key. After changing it, the memory index is rebuilt once (free with Ollama).
- Qdrant skill: collections now remember which embedding model built them, searches and inserts use that model automatically, and a vector of the wrong size is refused instead of returning nonsense. Existing collections are recorded once with \`qdrant.py set-model\`. The skill no longer lists any particular user's collections.
- The health skill also checks whether memory search has working embeddings.
- Skill docs and setting examples no longer carry personal names, hosts or addresses; examples are generic.`,
  },
  migrations: {
    up: async () => {},
    down: IMPOSSIBLE,
  },
})
