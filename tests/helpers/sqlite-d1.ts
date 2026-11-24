import fs from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

/**
 * In-memory Cloudflare D1 + R2 test harness backed by Node 22's built-in SQLite engine.
 * Applies the exact SQL files from `migrations/` and implements the D1Database & R2Bucket
 * interfaces expected by `drizzle-orm/d1` and `lib/server/*`.
 */

class SqlitePreparedStatement {
  private readonly sqlite: DatabaseSync;
  private readonly query: string;
  private readonly boundValues: SQLInputValue[];

  constructor(
    sqlite: DatabaseSync,
    query: string,
    boundValues: SQLInputValue[] = [],
  ) {
    this.sqlite = sqlite;
    this.query = query;
    this.boundValues = boundValues;
  }

  bind(...values: unknown[]): SqlitePreparedStatement {
    const normalized = values.map((v) => {
      if (v === undefined) return null;
      if (typeof v === "boolean") return v ? 1 : 0;
      return v as SQLInputValue;
    });
    return new SqlitePreparedStatement(this.sqlite, this.query, normalized);
  }

  async run() {
    const stmt = this.sqlite.prepare(this.query);
    const trimmed = this.query.trimStart().toUpperCase();
    const returnsRows =
      trimmed.startsWith("SELECT") || trimmed.includes("RETURNING");
    if (returnsRows) {
      const results = stmt.all(...this.boundValues);
      return {
        results,
        success: true,
        meta: {
          duration: 0,
          changes: results.length,
          last_row_id: 0,
          changed_db: !trimmed.startsWith("SELECT"),
          size_after: 0,
          rows_read: results.length,
          rows_written: results.length,
        },
      };
    }
    const info = stmt.run(...this.boundValues);
    return {
      results: [],
      success: true,
      meta: {
        duration: 0,
        changes: Number(info.changes),
        last_row_id: Number(info.lastInsertRowid),
        changed_db: Number(info.changes) > 0,
        size_after: 0,
        rows_read: 0,
        rows_written: Number(info.changes),
      },
    };
  }

  async all<T = Record<string, unknown>>() {
    const res = await this.run();
    return {
      results: res.results as T[],
      success: true,
      meta: res.meta,
    };
  }

  async raw<T = unknown[]>(options?: { columnNames?: boolean }) {
    const stmt = this.sqlite.prepare(this.query);
    stmt.setReturnArrays(true);
    const rows = stmt.all(...this.boundValues) as unknown as T[];
    if (options?.columnNames && rows.length > 0) {
      const colsStmt = this.sqlite.prepare(this.query);
      const sample = colsStmt.all(...this.boundValues) as Record<
        string,
        unknown
      >[];
      const names = sample[0] ? (Object.keys(sample[0]) as unknown as T) : ([] as unknown as T);
      return [names, ...rows];
    }
    return rows;
  }

  async first<T = unknown>(colName?: string): Promise<T | null> {
    const stmt = this.sqlite.prepare(this.query);
    const row = stmt.get(...this.boundValues) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    if (colName) return ((row[colName] as T) ?? null);
    return row as unknown as T;
  }
}

export function createInMemoryD1(): {
  d1: D1Database;
  sqlite: DatabaseSync;
  close: () => void;
} {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON;");

  const migrationsDir = path.resolve(process.cwd(), "migrations");
  const sqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of sqlFiles) {
    const content = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      sqlite.exec(statement);
    }
  }

  const d1 = {
    prepare(query: string) {
      return new SqlitePreparedStatement(sqlite, query);
    },
    async batch(statements: SqlitePreparedStatement[]) {
      sqlite.exec("BEGIN IMMEDIATE TRANSACTION;");
      try {
        const out = [];
        for (const stmt of statements) {
          out.push(await stmt.run());
        }
        sqlite.exec("COMMIT;");
        return out;
      } catch (err) {
        sqlite.exec("ROLLBACK;");
        throw err;
      }
    },
    async exec(query: string) {
      sqlite.exec(query);
      return { count: 1, duration: 0 };
    },
    async dump() {
      return new ArrayBuffer(0);
    },
    withSession() {
      return this;
    },
  } as unknown as D1Database;

  return {
    d1,
    sqlite,
    close: () => sqlite.close(),
  };
}

export function createInMemoryR2(): R2Bucket {
  const objects = new Map<
    string,
    {
      bytes: Uint8Array;
      contentType: string;
      customMetadata?: Record<string, string>;
      uploaded: Date;
    }
  >();

  return {
    async put(
      key: string,
      value: ArrayBuffer | ArrayBufferView | ReadableStream | string | Blob,
      options?: R2PutOptions,
    ) {
      let bytes: Uint8Array;
      if (value instanceof Uint8Array) {
        bytes = value;
      } else if (value instanceof ArrayBuffer) {
        bytes = new Uint8Array(value);
      } else if (ArrayBuffer.isView(value)) {
        bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
      } else if (typeof value === "string") {
        bytes = new TextEncoder().encode(value);
      } else if (value instanceof Blob) {
        bytes = new Uint8Array(await value.arrayBuffer());
      } else {
        const resp = new Response(value);
        bytes = new Uint8Array(await resp.arrayBuffer());
      }

      const httpMeta = options?.httpMetadata as
        | { contentType?: string }
        | undefined;
      const entry = {
        bytes,
        contentType: httpMeta?.contentType ?? "application/octet-stream",
        customMetadata: options?.customMetadata,
        uploaded: new Date(),
      };
      objects.set(key, entry);

      return {
        key,
        size: bytes.byteLength,
        etag: `etag-${key}`,
        httpEtag: `"etag-${key}"`,
        uploaded: entry.uploaded,
      } as unknown as R2Object;
    },

    async get(key: string) {
      const entry = objects.get(key);
      if (!entry) return null;
      return {
        key,
        size: entry.bytes.byteLength,
        etag: `etag-${key}`,
        httpEtag: `"etag-${key}"`,
        uploaded: entry.uploaded,
        httpMetadata: { contentType: entry.contentType },
        customMetadata: entry.customMetadata ?? {},
        body: new ReadableStream({
          start(controller) {
            controller.enqueue(entry.bytes);
            controller.close();
          },
        }),
        async arrayBuffer() {
          return entry.bytes.buffer.slice(
            entry.bytes.byteOffset,
            entry.bytes.byteOffset + entry.bytes.byteLength,
          );
        },
        async text() {
          return new TextDecoder().decode(entry.bytes);
        },
      } as unknown as R2ObjectBody;
    },

    async delete(keys: string | string[]) {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const key of list) {
        objects.delete(key);
      }
    },

    async head(key: string) {
      const entry = objects.get(key);
      if (!entry) return null;
      return {
        key,
        size: entry.bytes.byteLength,
        uploaded: entry.uploaded,
        httpMetadata: { contentType: entry.contentType },
      } as unknown as R2Object;
    },
  } as unknown as R2Bucket;
}

export function installTestCloudflareEnv(overrides?: Partial<CloudflareEnv>) {
  const { d1, sqlite, close } = createInMemoryD1();
  const r2 = createInMemoryR2();
  const sym = Symbol.for("__cloudflare-context__");

  (globalThis as Record<symbol, unknown>)[sym] = {
    env: {
      DB: d1,
      MEDIA_BUCKET: r2,
      APP_ENV: "development",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      SESSION_SECRET: "test-session-secret-minimum-32-characters-long-ok",
      ADMIN_BOOTSTRAP_TOKEN: "test-bootstrap-token-minimum-24-chars",
      ...overrides,
    } satisfies CloudflareEnv,
    cf: undefined,
    ctx: {
      waitUntil: () => undefined,
      passThroughOnException: () => undefined,
    },
  };

  return { d1, r2, sqlite, close };
}
