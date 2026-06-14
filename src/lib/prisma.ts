import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

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
