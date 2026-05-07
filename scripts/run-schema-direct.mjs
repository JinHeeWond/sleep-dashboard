import { Client } from "pg";
import { readFileSync } from "node:fs";

const REF = "wfxnkqaeakjltctgfnju";
const PASSWORDS = [process.env.SUPA_PW1, process.env.SUPA_PW2].filter(Boolean);

for (const pw of PASSWORDS) {
  const client = new Client({
    host: `db.${REF}.supabase.co`,
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: pw,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    console.log(`✓ direct IPv6 connected (pw len ${pw.length})`);
    const sql = readFileSync("./supabase/schema.sql", "utf8");
    await client.query(sql);
    const t = await client.query(
      `select table_name from information_schema.tables where table_schema='public' order by 1`
    );
    console.log("tables:", t.rows.map((r) => r.table_name).join(", "));
    await client.end();
    process.exit(0);
  } catch (e) {
    console.log(`✗ pw len ${pw.length}: ${e.code} | ${e.message}`);
  }
}
process.exit(1);
