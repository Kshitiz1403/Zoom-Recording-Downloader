import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from 'express'
import { getToken } from './zoomAPI.js'
import download, { getFilesForId, getStatus } from './downloader.js'
import JSONdb from 'simple-json-db'
import cors from 'cors'
import fs from 'fs'

export const db = new JSONdb("./store.json");
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

app.use('/status', express.static('./client/build'))

app.get('/', getToken);

app.post('/download', download);

app.get('/download/:id', getFilesForId)

app.get('/api/status/:id', getStatus)

app.listen('7229', () => console.log("Server listening on 7229"));