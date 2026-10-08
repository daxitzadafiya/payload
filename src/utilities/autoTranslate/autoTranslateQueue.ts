/**
 * Serializes deferred auto-translate jobs so concurrent page saves do not
 * open overlapping SQLite write transactions (a common cause of SQLITE_CORRUPT).
 */
let chain: Promise<void> = Promise.resolve()

export function enqueueAutoTranslate<T>(task: () => Promise<T>): Promise<T> {
  const run = chain.then(task, task)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

/**
 * Run DeepL after the current admin save finishes.
 *
 * Must not run inside `afterChange` (nested `updateGlobal` deadlocks SQLite).
 * Prefer `setTimeout(0)` over `queueMicrotask` so Payload can commit first.
 */
export function scheduleDeferredAutoTranslate(
  task: () => Promise<unknown>,
  onError: (error: unknown) => void,
): void {
  setTimeout(() => {
    void enqueueAutoTranslate(task).catch(onError)
  }, 0)
}
