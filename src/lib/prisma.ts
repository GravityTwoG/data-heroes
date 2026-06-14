import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "@/generated/prisma/client";

export const buildPrismaClient = ({
  databaseURL,
  poolConnectionsLimit,
}: {
  databaseURL: string;
  poolConnectionsLimit: number;
}) => {
  const pool = new Pool({
    connectionString: databaseURL,
    max: poolConnectionsLimit,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};
