import { createSignal, onCleanup, onMount } from "solid-js";
import { classifyViewport, type ViewportClass } from "./state";

/**
 * Reactive viewport classification (`SPEC-ui-responsive-webui`). Built on the
 * pure {@link classifyViewport} so the breakpoint logic stays unit-testable;
 * this hook only owns the DOM listener.
 *
 * SSR / node-safe: when `window` is unavailable (tests, prerender) it returns a
 * static `desktop` signal and registers no listener.
 *
 * Resize events are debounced (100 ms) to avoid excessive re-classification
 * during drag-resize or mobile orientation change animations.
 */
export function useViewport(): () => ViewportClass {
  if (typeof window === "undefined") {
    const [viewport] = createSignal<ViewportClass>("desktop");
    return viewport;
  }

  const measure = (): ViewportClass => classifyViewport(window.innerWidth);
  const [viewport, setViewport] = createSignal<ViewportClass>(measure());

  let timer: ReturnType<typeof setTimeout> | undefined;
  const update = () => {
    clearTimeout(timer);
    timer = setTimeout(() => setViewport(measure()), 100);
  };

  onMount(() => {
    window.addEventListener("resize", update);
    // Re-measure on mount in case the initial render happened before layout.
    setViewport(measure());
  });
  onCleanup(() => {
    window.removeEventListener("resize", update);
    clearTimeout(timer);
  });

  return viewport;
}
