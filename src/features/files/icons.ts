// Inline icon labels for file types
// Using simple, recognizable text icons with catppuccin-inspired colors

const FILE_ICONS: Record<string, { svg: string; color: string }> = {
  // Languages
  typescript: { svg: "TS", color: "#3178c6" },
  javascript: { svg: "JS", color: "#f7df1e" },
  rust: { svg: "RS", color: "#ce422b" },
  python: { svg: "PY", color: "#3776ab" },
  html: { svg: "</>", color: "#e34c26" },
  css: { svg: "#", color: "#264de4" },
  json: { svg: "{}", color: "#9aa4b2" },
  markdown: { svg: "MD", color: "#083fa1" },
  toml: { svg: "TL", color: "#9c4221" },
  yaml: { svg: "YL", color: "#cb171e" },
  svg: { svg: "◇", color: "#ffb13b" },

  // Config
  docker: { svg: "🐋", color: "#2496ed" },
  git: { svg: "", color: "#f05032" },
  license: { svg: "⚖", color: "#9aa4b2" },
  lock: { svg: "🔒", color: "#9aa4b2" },
  env: { svg: "⚙", color: "#ecd53f" },

  // Default
  default: { svg: "📄", color: "#9aa4b2" },
};

const EXT_MAP: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  rs: "rust",
  py: "python",
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  less: "css",
  json: "json",
  jsonc: "json",
  md: "markdown",
  mdx: "markdown",
  toml: "toml",
  yaml: "yaml",
  yml: "yaml",
  svg: "svg",
  lock: "lock",
};

const NAME_MAP: Record<string, string> = {
  Dockerfile: "docker",
  "docker-compose.yml": "docker",
  "docker-compose.yaml": "docker",
  "compose.yaml": "docker",
  "compose.yml": "docker",
  ".gitignore": "git",
  ".gitmodules": "git",
  ".gitattributes": "git",
  LICENSE: "license",
  "LICENSE.md": "license",
  ".env": "env",
  ".env.local": "env",
  ".env.development": "env",
  ".env.production": "env",
};

const DIR_ICONS: Record<string, { icon: string; color: string }> = {
  src: { icon: "📦", color: "#7aa2f7" },
  docs: { icon: "📚", color: "#e0af68" },
  tests: { icon: "🧪", color: "#9ece6a" },
  test: { icon: "🧪", color: "#9ece6a" },
  node_modules: { icon: "📦", color: "#9aa4b2" },
  ".git": { icon: "", color: "#f05032" },
  ".github": { icon: "", color: "#9aa4b2" },
  target: { icon: "🎯", color: "#9aa4b2" },
  build: { icon: "🔨", color: "#9aa4b2" },
  dist: { icon: "📤", color: "#9aa4b2" },
  crates: { icon: "📦", color: "#ce422b" },
  apps: { icon: "🚀", color: "#7aa2f7" },
  assets: { icon: "🎨", color: "#e0af68" },
};

export function getFileIcon(name: string): { label: string; color: string } {
  const nameIcon = NAME_MAP[name];
  if (nameIcon && FILE_ICONS[nameIcon]) {
    return { label: FILE_ICONS[nameIcon].svg, color: FILE_ICONS[nameIcon].color };
  }

  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const extIcon = EXT_MAP[ext];
  if (extIcon && FILE_ICONS[extIcon]) {
    return { label: FILE_ICONS[extIcon].svg, color: FILE_ICONS[extIcon].color };
  }

  return { label: FILE_ICONS.default.svg, color: FILE_ICONS.default.color };
}

export function getDirIcon(
  name: string,
  expanded: boolean,
): { label: string; color: string } {
  const special = DIR_ICONS[name];
  if (special) {
    return { label: special.icon, color: special.color };
  }
  return { label: expanded ? "📂" : "📁", color: "#9aa4b2" };
}

export function isHiddenFile(name: string): boolean {
  return name.startsWith(".");
}
