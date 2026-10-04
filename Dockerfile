FROM node:26-bookworm-slim

ARG START_CLI_VERSION
ARG GH_VERSION=2.100.0
ARG OPENCLAW_VERSION=2026.9.4

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    jq \
    python3 \
    ripgrep \
    tmux \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install GitHub CLI (direct binary)
RUN ARCH="$(dpkg --print-architecture)" && \
    curl -fsSL "https://github.com/cli/cli/releases/download/v${GH_VERSION}/gh_${GH_VERSION}_linux_${ARCH}.tar.gz" \
    | tar -xz --strip-components=1 -C /usr/local

# Install uv (Python package manager)
RUN curl -LsSf https://astral.sh/uv/install.sh | UV_INSTALL_DIR=/usr/local/bin sh

# Install openclaw using the official install script (non-interactive)
# HOME is set to /data (the runtime volume path) so openclaw installs there.
# This matches where the package mounts the main volume at runtime.
ENV HOME=/data
RUN mkdir -p /data && \
    curl -fsSL https://openclaw.bot/install.sh | bash -s -- --no-prompt --no-onboard --version "${OPENCLAW_VERSION}"

# Install start-cli from its product-scoped release in the start-technologies
# monorepo (see UPDATING.md). Authenticated at runtime by "Login to StartOS".
RUN curl -fsSL "https://github.com/Start9Labs/start-technologies/releases/download/start-cli%2Fv${START_CLI_VERSION}/start-cli_$(uname -m)-linux" -o /usr/local/bin/start-cli \
    && chmod +x /usr/local/bin/start-cli

# SMB for the NAS skill: Samba's smbclient (lists shares) and the Python
# smbprotocol library (file access), hash-pinned in skills/nas/requirements.txt.
# Installed in the image so nothing depends on files in the data volume.
RUN apt-get update && apt-get install -y --no-install-recommends smbclient \
    && rm -rf /var/lib/apt/lists/*
COPY skills/nas/requirements.txt /tmp/nas-requirements.txt
RUN uv pip install --python /usr/bin/python3 --target /opt/python-libs \
        --require-hashes --only-binary :all: --no-cache \
        -r /tmp/nas-requirements.txt \
    && rm /tmp/nas-requirements.txt \
    && PYTHONPATH=/opt/python-libs python3 -c 'import smbclient' \
    && smbclient --version
ENV PYTHONPATH=/opt/python-libs

# Install pinentry-curses (required by rbw)
RUN apt-get update && apt-get install -y --no-install-recommends pinentry-curses && rm -rf /var/lib/apt/lists/*

# Install rbw (Vaultwarden CLI) for credential retrieval at runtime.
# rbw is used by Alfred's skills to fetch secrets from Vaultwarden.
# Configuration and XDG dirs are set up at runtime via the setup-vault oneshot.
# - amd64: install from official .deb release
# - arm64: prebuilt binaries from this repo's rbw-arm64-1.15.0 release
#   (built once by .github/workflows/build-rbw-arm64.yml; sha256-pinned)
RUN ARCH="$(dpkg --print-architecture)" && \
    if [ "$ARCH" = "amd64" ]; then \
        curl -fsSL "https://git.tozt.net/rbw/releases/deb/rbw_1.15.0_amd64.deb" -o /tmp/rbw.deb && \
        dpkg -i /tmp/rbw.deb && \
        rm /tmp/rbw.deb; \
    elif [ "$ARCH" = "arm64" ]; then \
        RBW_URL="https://github.com/usuallymark/openclaw-startos/releases/download/rbw-arm64-1.15.0" && \
        curl -fsSL "$RBW_URL/rbw" -o /usr/local/bin/rbw && \
        curl -fsSL "$RBW_URL/rbw-agent" -o /usr/local/bin/rbw-agent && \
        echo "11e2fc0effa04148388fa03c71e39edb3a191ea9a7909d81d3d330ee99de05c6  /usr/local/bin/rbw" | sha256sum -c - && \
        echo "4854370cc9fb74af3ed5c82159ddebbe5c63e6e9cc70176f6ea417b25be1d3c5  /usr/local/bin/rbw-agent" | sha256sum -c - && \
        chmod 755 /usr/local/bin/rbw /usr/local/bin/rbw-agent; \
    else \
        echo "Unsupported arch: $ARCH" && exit 1; \
    fi

# Stage skill files (loaded via extraDirs in openclaw.json)
# start-cli skill (always loaded)
COPY skills/start-cli/SKILL.md /opt/skills/start-cli/SKILL.md
# External service skills (loaded when service is enabled via Configure External Services)
COPY skills/rbw/SKILL.md skills/rbw/creds.py /opt/skills/rbw/
COPY skills/rbw/getcred /usr/local/bin/getcred
RUN chmod 755 /usr/local/bin/getcred
COPY skills/qdrant/SKILL.md /opt/skills/qdrant/SKILL.md
COPY skills/health/SKILL.md skills/health/health.py /opt/skills/health/
COPY skills/ollama/SKILL.md /opt/skills/ollama/SKILL.md
COPY skills/nas/SKILL.md skills/nas/nas.py /opt/skills/nas/
COPY skills/n8n/SKILL.md /opt/skills/n8n/SKILL.md
COPY skills/trilium/SKILL.md /opt/skills/trilium/SKILL.md
COPY skills/stirling/SKILL.md /opt/skills/stirling/SKILL.md
COPY skills/searxng/SKILL.md /opt/skills/searxng/SKILL.md
COPY skills/crawl4ai/SKILL.md skills/crawl4ai/crawl4ai.py /opt/skills/crawl4ai/
COPY skills/ntfy/SKILL.md skills/ntfy/ntfy.py /opt/skills/ntfy/
COPY skills/ntfy/notify /usr/local/bin/notify
RUN chmod 755 /usr/local/bin/notify
COPY skills/webchat-present/SKILL.md /opt/skills/webchat-present/SKILL.md

# Webchat (optional; started only when enabled via Configure Webchat).
# Dependencies are pinned in webchat/package-lock.json.
COPY webchat/package.json webchat/package-lock.json /opt/webchat/
RUN cd /opt/webchat && npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY webchat/server.mjs webchat/present.mjs /opt/webchat/
COPY webchat/ui /opt/webchat/ui
COPY webchat/assets /opt/webchat/assets

# Stage workspace bootstrap files
COPY workspace/SOUL.md /opt/workspace/SOUL.md
COPY workspace/IDENTITY.md /opt/workspace/IDENTITY.md
COPY workspace/MEMORY.md /opt/workspace/MEMORY.md

# Set runtime environment variables
# HOME and OPENCLAW_STATE_DIR point to /data — the persistent volume mount point.
# All openclaw state, workspace, and rbw config lives under /data/.openclaw/
ENV NODE_ENV=production
ENV HOME=/data
ENV OPENCLAW_STATE_DIR=/data/.openclaw
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
# Include openclaw binary paths
ENV PATH="/data/.openclaw/bin:/usr/local/lib/node_modules/openclaw/bin:/usr/local/bin:$PATH"

WORKDIR /data

# The entrypoint will be provided by the StartOS daemon configuration
CMD ["openclaw", "gateway", "--port", "18789", "--bind", "lan"]
