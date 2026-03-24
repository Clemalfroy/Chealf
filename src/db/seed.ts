import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { AISLE_SLUGS, DIETARY_TAG_SLUGS } from "./seed-data";

export { AISLE_SLUGS, DIETARY_TAG_SLUGS };

async function seed() {
  const databaseUrl =
    process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL_DIRECT or DATABASE_URL must be set");
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  console.log("Seeding aisles...");
  for (const slug of AISLE_SLUGS) {
    await db
      .insert(schema.aisles)
      .values({ slug })
      .onConflictDoNothing({ target: schema.aisles.slug });
  }
  console.log(`  ${AISLE_SLUGS.length} aisles seeded`);

  console.log("Seeding dietary tags...");
  for (const slug of DIETARY_TAG_SLUGS) {
    await db
      .insert(schema.dietaryTags)
      .values({ slug })
      .onConflictDoNothing({ target: schema.dietaryTags.slug });
  }
  console.log(`  ${DIETARY_TAG_SLUGS.length} dietary tags seeded`);

  await client.end();
  console.log("Done.");
}

// Only run when executed directly
if (
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`
) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
