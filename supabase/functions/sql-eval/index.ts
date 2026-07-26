
import * as postgres from "https://deno.land/x/postgres@v0.17.0/mod.ts";
Deno.serve(async (req) => {
  try {
    const url = Deno.env.get("SUPABASE_DB_URL");
    if (!url) throw new Error("No DB URL");
    const pool = new postgres.Pool(url, 3, true);
    const connection = await pool.connect();
    try {
      const body = await req.json();
      const result = await connection.queryObject(body.query);
      return new Response(JSON.stringify(result.rows), { headers: { "Content-Type": "application/json" } });
    } finally {
      connection.release();
    }
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
});

