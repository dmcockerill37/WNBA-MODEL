/**
 * Run once to create tables in Neon:
 *   npx tsx scripts/migrate.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Copy .env.local.example to .env.local and fill it in.");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const schema = readFileSync(join(import.meta.dirname, "../src/lib/schema.sql"), "utf8");

// split on semicolons and run each statement
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

console.log(`Running ${statements.length} SQL statements...`);
for (const stmt of statements) {
  await sql(stmt);
  console.log("  ok:", stmt.slice(0, 60).replace(/\s+/g, " ") + "...");
}
console.log("Migration complete.");
