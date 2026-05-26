import { useEffect, useRef } from "react";

export function useResizeObserver(callback: (entry: ResizeObserverEntry) => void) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        callback(entry);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [callback]);

  return ref;
}
