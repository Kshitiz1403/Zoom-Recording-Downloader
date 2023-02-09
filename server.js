import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from 'express'
import { getToken } from './zoomAPI.js'
import { download } from './downloader.js'
import formData from 'express-form-data'


export const redirect_URL = "https://zoom.kshitizagrawal.in";

const app = express();

app.use(express.json()) // for json
app.use(express.urlencoded({ extended: true })) // for form data
app.use(formData.format());


app.get('/', getToken);

app.post('/download', download);

app.listen('7229', () => console.log("Server listening on 7229"));