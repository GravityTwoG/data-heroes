import { execSync } from "node:child_process";
import { resolve } from "node:path";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

let container: StartedPostgreSqlContainer;

export async function setup() {
  container = await new PostgreSqlContainer("postgres:18.4").start();

  process.env.DATABASE_URL = container.getConnectionUri();

  execSync("npx prisma migrate deploy", {
    env: { ...process.env },
    cwd: resolve(__dirname, "../../.."),
    stdio: "pipe",
  });

}

export async function teardown() {
  if (container) await container.stop();
}
