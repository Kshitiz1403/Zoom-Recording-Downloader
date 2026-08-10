import fs from 'fs';
import Database from 'better-sqlite3';

const storeJsonPath = './store.json';
const storeDbPath = './store.db';

if (!fs.existsSync(storeJsonPath)) {
  console.log('No store.json found — nothing to migrate.');
  process.exit(0);
}

const json = JSON.parse(fs.readFileSync(storeJsonPath, 'utf-8'));
const keys = Object.keys(json);

if (keys.length === 0) {
  console.log('store.json is empty — nothing to migrate.');
  process.exit(0);
}

const db = new Database(storeDbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const insert = db.prepare(`
  INSERT INTO transactions (id, data, created_at, updated_at)
  VALUES (?, ?, datetime('now'), datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    data = excluded.data,
    updated_at = datetime('now')
`);

const migrate = db.transaction(() => {
  for (const key of keys) {
    insert.run(key, json[key]);
  }
});

migrate();
console.log(`Migrated ${keys.length} transaction(s) from store.json to store.db.`);
