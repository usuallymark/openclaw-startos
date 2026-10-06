// Sent verbatim as the heartbeat turn's user message; scratch is appended when set.
export const HEARTBEAT_PROMPT = `Refresh the 3 most dynamic subsections of the Server State Snapshot in MEMORY.md. Run these commands, then update **only** the corresponding subsections below \`## Server State Snapshot\`. Preserve all other subsections and content in MEMORY.md.

1. \`start-cli server metrics\` — update \`### Server Metrics\`
2. \`start-cli package list\` — update \`### Package List\`
3. \`start-cli notification list\` — update \`### Notifications\`

Update the timestamp line to \`_Captured at heartbeat: <current timestamp>_\`.

Change no other file, and do not commit, push or run any git command: this turn only refreshes MEMORY.md on disk.

Follow the heartbeat monitor scratch context when provided. When done, reply NO_REPLY.`
