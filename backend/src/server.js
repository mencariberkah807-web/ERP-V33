import Fastify from "fastify";
import pg from "pg";

const { Pool } = pg;

const app = Fastify({ logger: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/health", async () => {
  const result = await pool.query("SELECT 1 AS ok");

  return {
    status: "ok",
    database: result.rows[0]?.ok === 1 ? "ok" : "error",
  };
});

app.addHook("onClose", async () => {
  await pool.end();
});

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
