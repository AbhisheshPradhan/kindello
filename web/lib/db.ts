import { Pool as PgPool } from "pg";
import {
	Pool as NeonPool,
	neonConfig,
	type QueryResultRow,
} from "@neondatabase/serverless";
import ws from "ws";

// We only ever call `.query(text, params)` and read `.rows`, so the export is typed
// to that minimal surface — lets the local (pg) and cloud (Neon) pools share one type.
type Queryable = {
	query<R extends QueryResultRow = QueryResultRow>(
		text: string,
		params?: unknown[],
	): Promise<{ rows: R[] }>;
};

// One shared pool across hot-reloads (Next re-imports modules on every change in dev).
const g = globalThis as unknown as { _kindelloPool?: Queryable };

// Strip any `sslmode` from the URL: TLS is configured explicitly below, so the query
// param is redundant and only triggers pg's "verify-full alias" deprecation warning.
function stripSslMode(url: string | undefined): string | undefined {
	if (!url) return url;
	try {
		const parsed = new URL(url);
		parsed.searchParams.delete("sslmode");
		return parsed.toString();
	} catch {
		return url; // not a parseable URL — leave it untouched
	}
}

const connectionString = stripSslMode(process.env.DATABASE_URL);

// Local Postgres uses trust auth + no TLS; cloud (Neon) requires SSL. Detect by host
// so the same code works in both places with no extra env flag.
const isLocal =
	!!connectionString && /@(localhost|127\.0\.0\.1)/.test(connectionString);

function makePool(): Queryable {
	if (isLocal) {
		// Local dev: raw TCP via node-postgres, no TLS, a normal-sized pool.
		return new PgPool({ connectionString, max: 10 });
	}
	// Cloud (Neon) on Vercel serverless: node-postgres' raw TCP socket gets its TLS
	// handshake reset by Neon (cold starts / Lambda networking) -> "Client network
	// socket disconnected before secure TLS connection was established". Neon's own
	// driver tunnels Postgres over a WebSocket instead, which survives that path.
	// In Node we must hand it a WebSocket implementation.
	neonConfig.webSocketConstructor = ws;
	return new NeonPool({ connectionString, max: 1 });
}

export const pool: Queryable = g._kindelloPool ?? (g._kindelloPool = makePool());
