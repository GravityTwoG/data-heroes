// inspired by https://github.com/fastify/fastify-request-context/blob/main/index.js
import { AsyncLocalStorage, AsyncResource } from "node:async_hooks";

import { FastifyInstance, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";

export const registerRequestContext = <RequestALS extends AsyncLocalStorage<unknown>>({
  app,
  requestALS,
  onRequest,
}: {
  app: FastifyInstance;
  requestALS: RequestALS;
  onRequest: (
    req: FastifyRequest,
    res: FastifyReply,
    done: HookHandlerDoneFunction,
  ) => Promise<void> | void;
}) => {
  const asyncResourceSymbol = Symbol("asyncResource");

  app.addHook("onRequest", (req, res, done) => {
    requestALS.run({}, () => {
      // create async resource to prolongate life of async context
      const ar = new AsyncResource("fastify-request-context");
      (req as any)[asyncResourceSymbol] = ar;
      onRequest(req, res, () => ar.runInAsyncScope(done, req.raw));
    });
  });

  // Both of onRequest and preParsing are executed after the als.runWith call
  // within the "proper" async context (AsyncResource implicitly created by ALS).
  // However, preValidation, preHandler and the route handler are executed as a part of req.emit('end') call which happens
  // in a different async context, as req/res may emit events in a different context.
  // Related to https://github.com/nodejs/node/issues/34430 and https://github.com/nodejs/node/issues/33723
  app.addHook("preValidation", (req, _, done) => {
    const ar = (req as any)[asyncResourceSymbol] as AsyncResource;
    ar.runInAsyncScope(done, req.raw);
  });
};
