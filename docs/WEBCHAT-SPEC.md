# Webchat — build spec

Status: draft for review · Target version: `2026.9.4:3` · Gateway: openclaw `2026.9.4`

A lightweight, mobile-first chat UI for OpenClaw with multiple **profiles**
(one per person), bundled in this package. **Disabled by default.** Everything
personal (names, colors, presets, PINs) is entered through the
**Configure Webchat** action and stored in `/data`; the package ships only
generic defaults.

Replaces an earlier standalone per-user webchat (one container per person),
rebuilt for StartOS 0.4 and the 2026.9 gateway.

---

## 1. Goals / non-goals

**Goals**
- One webchat, many profiles, each at its own URL path and installable as its
  own home-screen app (PWA).
- No gateway secret ever reaches the browser.
- Profile separation **enforced by the server**, not just cosmetic.
- Optional per-profile PIN, remembered per device.
- File hand-off from the agent to the user (download cards) keeps working.
- Off unless the operator turns it on.

**Non-goals (this version)**
- Per-user scoping inside the gateway itself (upstream feature request
  openclaw#104499; not available).
- Importing 0.3.x conversation history.
- Remote access beyond what the LAN/VPN already provides.

---

## 2. Architecture

```
 phone / browser ──HTTPS──▶ StartOS interface "Webchat"
                                │
                   ┌────────────▼─────────────┐   openclaw subcontainer
                   │ webchat daemon (Node)    │
                   │  • serves UI per profile │
                   │  • PIN / cookie check    │
                   │  • relay WS: browser⇄GW  │──ws://127.0.0.1:<gw port>──▶ gateway
                   │  • /upload (loopback)    │◀── present.py (agent skill)
                   └──────────────────────────┘
```

- **One daemon, `webchat`**, in the existing openclaw subcontainer, added to
  `main.ts` only when enabled. Requires `primary` (the gateway).
- **Gateway connection (server-side only).** Uses the official
  `@openclaw/gateway-client@2026.9.4` (exact pin, matches the gateway).
  - Client identity: `id: "gateway-client"`, `mode: "backend"`,
    `role: "operator"`, scopes `operator.read` + `operator.write`, protocol v4.
  - Auth: gateway password read from `openclaw.json` (package-managed).
  - Device identity: ed25519 keypair generated on first run, stored in
    `/data/.openclaw/webchat/device.json` (0600). Loopback connections are
    auto-approved for pairing, so no manual approval step. The issued device
    token is persisted alongside.
- **Browser ⇄ server** uses the webchat's own small WebSocket per profile
  (`/u/<id>/ws`). The server relays a **whitelist** of calls and rewrites /
  checks session keys:

  | Browser call | Allowed when |
  |---|---|
  | `chat.send`, `chat.history`, `chat.abort` | `sessionKey` starts with the profile prefix |
  | `sessions.list` | always; results **filtered** to the profile prefix |
  | `sessions.reset`, `sessions.delete` | key starts with the profile prefix |
  | anything else | rejected |

  Gateway events are forwarded only when their `sessionKey` belongs to the
  profile. Profile prefix: `agent:main:<profileId>`.
- **Upload endpoint** listens on `127.0.0.1` only (separate port), so only
  processes inside the container (the agent's `present.py`) can post files.
  Download links (`/download/<128-bit token>/<name>`) are served on the public
  port, expire after 24 h, and require a valid profile cookie when any
  profile has a PIN.

---

## 3. Configure Webchat action

Modeled on Configure External Services. Saving restarts OpenClaw.

- **Webchat**: `Disabled` (default) / `Enabled`
- When **Enabled**:
  - **App name** — text, default `OpenClaw`
  - **Remember devices for** — 30 / 90 (default) / 365 days / never expire
  - **Profiles** — list (`displayAs: {{name}}`, unique by id), each:
    - **Profile ID** — `^[a-z][a-z0-9-]{0,23}$`; becomes `/u/<id>/` and the
      session prefix. Changing it orphans that profile's conversations
      (warned in the description).
    - **Display name**
    - **Accent color** — select: Gold (default), Teal, Violet, Rose, Blue,
      Green
    - **Greeting prompt** — optional textarea; sent as the first message of a
      new conversation
    - **Preset conversations** — optional textarea, one title per line
    - **PIN** — optional, masked, 4–12 digits; blank on edit keeps the
      current PIN. A separate toggle **Remove PIN** clears it.
- At least one profile is required when enabled. Default profile on first
  enable: id `me`, name `Me`, Gold, no PIN.

Stored in `/data/.openclaw/webchat/config.json` via a file model. PINs are
stored only as scrypt hashes, never echoed back.

---

## 4. Defaults shipped in the package

- Dark theme, **Gold** accent `#c8a96e` (user bubble `#1e1a14`).
- Default avatar: a bundled example image (`assets/default-avatar.jpg`). Override by
  placing `/data/.openclaw/webchat/avatar.(png|jpg)`; per-profile override at
  `/data/.openclaw/webchat/avatars/<profileId>.(png|jpg)`.
- PWA icons generated from the avatar; manifest per profile (`id`, `scope`
  and `start_url` = `/u/<id>/`) so each installs as a separate app.
- Root `/` shows a simple profile picker.

Palette (accent / user bubble): Gold `#c8a96e`/`#1e1a14` · Teal
`#4a8b8c`/`#101a1a` · Violet `#8b6aae`/`#17121d` · Rose `#b86b7a`/`#1d1214` ·
Blue `#5b84b8`/`#11161d` · Green `#6f9a5c`/`#121a10`.

---

## 5. PIN behavior

- Asked **once per device** per profile; success sets an HttpOnly, Secure,
  SameSite=Strict cookie scoped to `/u/<id>/`.
- Cookie = HMAC(server secret, profileId | pinVersion | expiry). Server secret
  lives in `/data/.openclaw/webchat/secret` (0600).
- Changing or removing a PIN bumps `pinVersion` → every device for that
  profile is signed out.
- Rate limit: 5 wrong attempts per profile per client IP → 5-minute lockout,
  doubling on repeat.
- iOS note: a home-screen app has storage separate from Safari, so it asks
  once more after installing.

---

## 6. Files and data

| Path | Contents |
|---|---|
| `/opt/webchat/` (image) | `server.mjs`, `ui/` (HTML/CSS/JS), `assets/` |
| `/data/.openclaw/webchat/config.json` | action-managed config |
| `/data/.openclaw/webchat/state/<id>.json` | sidebar state: names, deleted, presets seeded (was `name-map.json`) |
| `/data/.openclaw/webchat/uploads/` | hand-off files, 24 h TTL |
| `/data/.openclaw/webchat/device.json`, `secret` | gateway device identity / token, cookie key (0600) |

All under `/data`, so StartOS backups cover them.

---

## 7. Package changes

- `Dockerfile`: copy `webchat/` to `/opt/webchat`, `npm ci --omit=dev` there
  (deps: `@openclaw/gateway-client`, `@openclaw/gateway-protocol`, exact
  `2026.9.4`).
- `startos/fileModels/webchat.json.ts`, `startos/actions/configureWebchat.ts`.
- `startos/interfaces.ts`: `webchat` interface (HTTP, LAN) — exported only
  when enabled.
- `startos/main.ts`: `webchat` daemon when enabled; env `WEBCHAT_UPLOAD_URL`
  added to the gateway env so the agent's skill can find the upload port.
- `skills/webchat-present/SKILL.md` + helper (generic version of the existing
  workspace skill) — loaded only when webchat is enabled.
- `instructions.md`: Webchat section (enable, profiles, PIN, iOS note).

---

## 8. Build order

1. **Gateway connection spike** — minimal Node script in the container:
   connect with `gateway-client`, list sessions, send one message, receive
   the streamed reply. Confirms device auth + event names before anything
   else is built.
2. Server: profiles, relay with whitelist/prefix checks, state files,
   upload/download.
3. UI: port the existing page (sidebar, rename/delete, presets, streaming,
   download cards), parameterized per profile.
4. Package wiring: file model, action, interface, daemon, skill.
5. PIN + cookies + rate limit.
6. Docs, version bump, release.

---

## 9. After install (operator, not in the package)

- Enable webchat; add one profile per person (e.g. one Teal with presets, one Gold).
- Optionally drop a custom avatar into `/data/.openclaw/webchat/`.
- Point any workspace copy of `present.py` at `WEBCHAT_UPLOAD_URL` (or use the
  packaged skill).
- Retire and rotate the old 0.3.x gateway token if it is still valid anywhere.

## 10. Open questions

- Event names for streaming in 2026.9.4 (old page used `chat.agent.token` /
  `agent.*`) — settled by step 1.
- Whether `sessions.list` supports a key-prefix filter server-side or we
  filter after fetching.
