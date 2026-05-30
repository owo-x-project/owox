export function isMac(): boolean {
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
}
