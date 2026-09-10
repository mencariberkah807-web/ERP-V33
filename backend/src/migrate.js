import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const root = fileURLToPath(new URL("../../", import.meta.url));
const migrationPath = `${root}/database/migrations/001_initial_schema.sql`;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

try {
  const sql = await readFile(migrationPath, "utf8");
  await client.connect();
  await client.query(sql);
  console.log("Database migration 001 applied successfully.");
} catch (error) {
  console.error("Database migration failed.");
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
