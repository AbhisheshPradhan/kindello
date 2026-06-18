import { Pool } from "pg";

// One shared pool across hot-reloads (Next re-imports modules on every change in dev).
const g = globalThis as unknown as { _kindelloPool?: Pool };

const connectionString = process.env.DATABASE_URL;

// Local Postgres uses trust auth + no TLS; cloud (Neon) requires SSL. Detect by host
// so the same code works in both places with no extra env flag.
const isLocal =
	!!connectionString && /@(localhost|127\.0\.0\.1)/.test(connectionString);

export const pool: Pool =
	g._kindelloPool ??
	(g._kindelloPool = new Pool({
		connectionString,
		// Cloud: enable TLS and keep each serverless instance's pool tiny so we don't
		// exhaust Neon connections (use the -pooler/PgBouncer endpoint as DATABASE_URL).
		ssl: isLocal ? undefined : { rejectUnauthorized: false },
		max: isLocal ? 10 : 1,
	}));
