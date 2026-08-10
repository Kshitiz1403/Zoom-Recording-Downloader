import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from 'express'
import { getToken } from './zoomAPI.js'
import download, { getFilesForId, getStatus } from './downloader.js'
import Database from 'better-sqlite3'
import cors from 'cors'
import fs from 'fs'
import path from 'path'

const _db = new Database('./store.db');
_db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id         TEXT PRIMARY KEY,
    data       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

export const db = {
  get: (key) => {
    const row = _db.prepare('SELECT data FROM transactions WHERE id = ?').get(key);
    return row ? row.data : null;
  },
  set: (key, value) => {
    _db.prepare(`
      INSERT INTO transactions (id, data, created_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(id) DO UPDATE SET
        data = excluded.data,
        updated_at = datetime('now')
    `).run(key, value);
  }
};
export const redirect_URL = "https://zoom.kshitizagrawal.in";
export const downloadDirectory = "./downloads"
export const zipsDirectory = "./zips"

if (!fs.existsSync(downloadDirectory)) fs.mkdirSync(downloadDirectory)
if (!fs.existsSync(zipsDirectory)) fs.mkdirSync(zipsDirectory)

const app = express();

app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true })) // for form data
app.use(cors())

app.use(express.static(zipsDirectory))

const __dirname = path.resolve()

app.get('/status/*', (req, res) => res.sendFile(path.join(__dirname, "index.html")))

app.get('/', getToken);

app.post('/download', download);

app.get('/download/:id', getFilesForId)

app.get('/api/status/:id', getStatus)

app.listen('7229', () => console.log("Server listening on 7229"));