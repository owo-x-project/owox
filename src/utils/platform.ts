export function isMac(): boolean {
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
}

/** Returns true when the device supports touch as primary input. */
export function isTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}
