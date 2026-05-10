FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

ARG NODE_MAJOR=24
ENV DEBIAN_FRONTEND=noninteractive

# ---------- System packages ----------
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  git-lfs \
  gh \
  jq \
  less \
  unzip \
  zip \
  sudo \
  openssh-client \
  bash-completion \
  build-essential \
  pkg-config \
  make \
  procps \
  ripgrep \
  fd-find \
  tree \
  bubblewrap \
  python3 \
  python3-venv \
  python3-pip \
  pipx \
  && rm -rf /var/lib/apt/lists/*

# ---------- JavaScript/TypeScript Dev Environment ----------
RUN mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${NODE_MAJOR}.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@latest --activate

# ---------- Rust Dev Environment ----------
ENV CARGO_HOME=/usr/local/cargo
ENV RUSTUP_HOME=/usr/local/rustup
RUN curl --proto '=https' --tlsv1.2 -fsSL https://sh.rustup.rs \
  | sh -s -- -y --no-modify-path --profile minimal \
  && chmod -R a+w ${CARGO_HOME} ${RUSTUP_HOME}

# ---------- Codex CLI ----------
RUN npm install -g @openai/codex

# ---------- RTK ----------
RUN curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh \
  | RTK_INSTALL_DIR=/usr/local/bin sh

RUN mkdir -p \
  /root/.codex \
  /home/vscode/.npm-global \
  /home/vscode/.local/bin \
  /home/vscode/.local/share/pnpm \
  /home/vscode/.cache/pip \
  /pnpm/store \
  && chown -R vscode:vscode /home/vscode /pnpm

ENV NPM_CONFIG_PREFIX=/home/vscode/.npm-global
ENV PNPM_HOME=/home/vscode/.local/share/pnpm
ENV PNPM_STORE_DIR=/pnpm/store
ENV PIP_CACHE_DIR=/home/vscode/.cache/pip
ENV PIPX_HOME=/home/vscode/.local/pipx
ENV PIPX_BIN_DIR=/home/vscode/.local/bin
ENV PATH=/home/vscode/.npm-global/bin:/home/vscode/.local/bin:/home/vscode/.local/share/pnpm:/usr/local/cargo/bin:/usr/local/bin:${PATH}

WORKDIR /workspace
