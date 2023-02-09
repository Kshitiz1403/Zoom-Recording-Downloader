import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from 'express'
import { callAPI } from './zoomAPI.js'
import { download } from './downloader.js'

export const redirect_URL = "https://zoom.kshitizagrawal.in";

const app = express();

app.get('/', callAPI);

app.post('/download', download);

app.listen('7229', () => console.log("Server listening on 7229"));