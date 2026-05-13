import { useSyncExternalStore } from "react";

const KEY = "pheip.selectedProperty";
let current: string = (typeof window !== "undefined" && localStorage.getItem(KEY)) || "All Hotels";
const listeners = new Set<() => void>();

export function setSelectedProperty(name: string) {
  current = name;
  if (typeof window !== "undefined") localStorage.setItem(KEY, name);
  listeners.forEach((l) => l());
}

export function useSelectedProperty(): string {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => current,
    () => current,
  );
}
