import { Pool } from "pg";

// One shared pool across hot-reloads (Next re-imports modules on every change in dev).
const g = globalThis as unknown as { _kindelloPool?: Pool };

export const pool: Pool =
	g._kindelloPool ??
	(g._kindelloPool = new Pool({
		connectionString: process.env.DATABASE_URL,
	}));
