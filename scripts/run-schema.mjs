import { Client } from "pg";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REF = "wfxnkqaeakjltctgfnju";
const REGIONS = [
  "ap-northeast-2",
  "ap-northeast-1",
  "us-east-1",
  "us-west-2",
  "eu-west-2",
  "ap-southeast-1",
];
const PASSWORDS = [process.env.SUPA_PW1, process.env.SUPA_PW2].filter(Boolean);
const SQL_FILE = process.argv[2] ?? resolve(__dirname, "../supabase/schema.sql");

async function tryConnect(host, password) {
  const client = new Client({
    host,
    port: 5432,                        // session pooler (DDL OK)
    database: "postgres",
    user: `postgres.${REF}`,
    password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });
  await client.connect();
  return client;
}

const sql = readFileSync(SQL_FILE, "utf8");

for (const region of REGIONS) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  for (const pw of PASSWORDS) {
    try {
      const client = await tryConnect(host, pw);
      console.log(`✓ connected via ${region} (pw len ${pw.length})`);
      const r = await client.query(sql);
      console.log(`✓ schema applied`, Array.isArray(r) ? `${r.length} statements` : "");
      const tables = await client.query(
        `select table_name from information_schema.tables
         where table_schema='public' order by table_name`
      );
      console.log("tables:", tables.rows.map((r) => r.table_name).join(", "));
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`✗ ${region} pw=${pw.length}: ${e.code} | ${e.message}`);
    }
  }
}
console.log("All attempts failed");
process.exit(1);
