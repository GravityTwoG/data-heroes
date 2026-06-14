import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildHTTPServer } from "@/http";
import { withNamedOperationSchemas } from "@/http/lib/openapi-components";

const __dirname = dirname(fileURLToPath(import.meta.url));

void (async () => {
  const app = buildHTTPServer({
    useCases: {} as any,
    config: {
      isProduction: false,
    },
    logger: {} as any,
    requestALS: {} as any,
  });

  await app.ready();

  const spec = withNamedOperationSchemas(app.swagger());
  const outPath = resolve(__dirname, "../openapi.json");
  writeFileSync(outPath, JSON.stringify(spec, null, 2));

  app.log.info(`OpenAPI spec written to ${outPath}`);
  await app.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
