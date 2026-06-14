import { z } from "zod";

const ConfigSchema = z.object({
  nodeEnv: z.enum(["development", "production"]).default("development"),
  isProduction: z.boolean(),

  port: z.coerce.number().default(3000),

  databaseURL: z.string().min(1),
  databasePoolMax: z.coerce.number().default(10),
});

export type Config = z.infer<typeof ConfigSchema>;

export function parseConfig(): Config {
  return ConfigSchema.parse({
    nodeEnv: process.env.NODE_ENV,
    isProduction: process.env.NODE_ENV === "production",

    port: process.env.PORT,

    databaseURL: process.env.DATABASE_URL,
    databasePoolMax: process.env.DATABASE_POOL_MAX,
  });
}
