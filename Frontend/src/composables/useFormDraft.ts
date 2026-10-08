import { ref, watch } from 'vue';

/**
 * Keeps what the user typed in sessionStorage (this tab only), so it survives an expired session
 * (sign in again, come back to the same page) or an accidental reload. Removed once saved.
 */
export function useFormDraft<T extends object>(key: () => string, form: T) {
  const restored = ref(false);
  let active = false;
  /** The form as it was loaded; a form equal to it has nothing worth keeping. */
  let pristine = '';

  function read(): Partial<T> | null {
    try {
      const raw = sessionStorage.getItem(key());
      return raw ? (JSON.parse(raw) as Partial<T>) : null;
    } catch {
      return null;
    }
  }

  /** Call once the form holds its initial values; applies a saved draft on top, then starts saving. */
  function start(): void {
    pristine = JSON.stringify(form);
    const saved = read();
    if (saved) {
      Object.assign(form, saved);
      // A draft identical to the loaded form holds nothing to restore.
      if (JSON.stringify(form) === pristine) clear();
      else restored.value = true;
    }
    active = true;
  }

  function clear(): void {
    restored.value = false;
    try {
      sessionStorage.removeItem(key());
    } catch {
      // Storage unavailable: nothing was saved either.
    }
  }

  watch(form, (value) => {
    if (!active) return;
    const json = JSON.stringify(value);
    try {
      if (json === pristine) sessionStorage.removeItem(key());
      else sessionStorage.setItem(key(), json);
    } catch {
      // Storage full or blocked: the form still works, it just is not remembered.
    }
  }, { deep: true });

  return { restored, start, clear };
}
