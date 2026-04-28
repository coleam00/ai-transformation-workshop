import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  requestId: string;
  userId?: string;
  correlationId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Get the current request context from AsyncLocalStorage.
 * Returns undefined if called outside of a request context.
 */
export function getRequestContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Set the request context for the current async execution.
 * Use this at the start of a request handler.
 */
export function setRequestContext(context: RequestContext): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    Object.assign(store, context);
  }
}

/**
 * Run a function within a request context.
 * All async operations within the callback will have access to the context.
 *
 * @example
 * await withRequestContext({ requestId: "abc-123" }, async () => {
 *   // All logs here will include requestId
 *   logger.info("processing request");
 * });
 */
export function withRequestContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Generate a unique request ID.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}
