import type { AsyncLocalStorage } from "async_hooks";

import pino from "pino";

export function buildLogger(als: AsyncLocalStorage<{ requestId: string }>) {
  return pino({
    mixin() {
      const store = als.getStore();
      // same as fastifies reqId
      return { reqId: store?.requestId };
    },
  });
}

export type Logger = ReturnType<typeof buildLogger>;
