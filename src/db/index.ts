import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { requireEnv } from "@/lib/env";
import * as schema from "./schema";

// Transaction pooler (port 6543) does not support prepared statements
const client = postgres(requireEnv("DRIZZLE_DATABASE_URL"), { prepare: false });

export const db = drizzle(client, { schema });
