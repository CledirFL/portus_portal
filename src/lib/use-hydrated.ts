import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** true depois de o React hidratar no navegador; usado também pelos testes E2E. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
