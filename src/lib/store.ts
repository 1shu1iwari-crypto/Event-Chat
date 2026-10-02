import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
import { freshState } from './seed';
import type { EventState } from '@/types/domain';
const db = process.env.DATABASE_URL ? postgres(process.env.DATABASE_URL, { max: 3, prepare: false, idle_timeout: 20 }) : null;
const file = path.join(process.env.EVENTOPS_DATA_DIR || '.data', 'event.json');
let queue = Promise.resolve();
let initialized: Promise<unknown> | undefined;
async function initDatabase() {
  if (!db) return;
  initialized ??= (async () => {
    await db`CREATE TABLE IF NOT EXISTS eventops_state (id text PRIMARY KEY, state jsonb NOT NULL)`;
    await db`INSERT INTO eventops_state (id, state) VALUES ('novahack', ${db.json(freshState() as unknown as postgres.JSONValue)}) ON CONFLICT DO NOTHING`;
  })().catch(error => { initialized = undefined; throw error; });
  await initialized;
}
async function readLocal(): Promise<EventState> {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; return freshState(); }
}
export async function readState(): Promise<EventState> {
  if (db) { await initDatabase(); const [row] = await db`SELECT state FROM eventops_state WHERE id = 'novahack'`; return row.state as EventState; }
  await queue; return readLocal();
}
export async function mutate<T>(fn: (state: EventState) => T | Promise<T>): Promise<T> {
  if (db) {
    await initDatabase();
    return await db.begin(async sql => {
      const [row] = await sql`SELECT state FROM eventops_state WHERE id = 'novahack' FOR UPDATE`;
      const state = row.state as EventState; const result = await fn(state); state.version++;
      await sql`UPDATE eventops_state SET state = ${sql.json(state as unknown as postgres.JSONValue)} WHERE id = 'novahack'`;
      return result as never;
    }) as T;
  }
  const task = queue.then(async () => {
    const state = await readLocal(); const result = await fn(state); state.version++;
    await mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${crypto.randomUUID()}.tmp`;
    await writeFile(tmp, JSON.stringify(state), { mode: 0o600 }); await rename(tmp, file); return result;
  });
  queue = task.then(() => {}, () => {}); return task;
}
export const storage = db ? 'postgres' : 'file';
