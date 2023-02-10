import axios from 'axios';
import fs from 'fs'
import * as stream from 'stream';
import { db, downloadDirectory } from './server.js';
import util from 'util'
import { v4 as uuid } from 'uuid';
import { zip } from 'zip-a-folder';

const pipeline = util.promisify(stream.pipeline);

const download = async (req, res, next) => {
    const zoomAccount = req.body.account
    const access_token = req.body.access_token;

    if (!(zoomAccount == "careers@dreamsoft4u.com" || zoomAccount == "sanjeev@dreamsoft4u.com" || zoomAccount == "gaurav.s@dreamsoft4u.com")) {
        return res.status(400).json("Invalid account");
    }
    const meetings = await axios.get(`https://api.zoom.us/v2/users/${zoomAccount}/recordings`, {
        params: {
            from: "2022-02-07"
        },
        headers: {
            'Authorization': `Bearer ${access_token}`
        },
    }).then(data => data.data['meetings'])

    const downloads = await downloadFiles(meetings, access_token);
    return res.status(200).json(downloads)
}



export async function downloadFiles(meetings, access_token) {
    const promises = []

    const transactionID = uuid();
    const obj = {};
    for (const meeting of meetings) {
        for (const file of meeting.recording_files) {
            let fileURL = `${file.download_url}?access_token=${access_token}`
            const fileSize = file.file_size
            console.log(fileSize)
            let fileDate = dateHandler(meeting.start_time)
            let fileName = `${meeting.topic} ${fileDate}.${file.file_extension}`
            obj[fileName] = "downloading"

            const directory = `${downloadDirectory}/${transactionID}`
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory)
            }
            const filePath = `${directory}/${fileName}`
            const promise = axiosDownloadWrapper(fileURL, filePath, fileName);
            promises.push(promise)
        }
    }
    db.set(transactionID, JSON.stringify(obj));
    const downloads = Promise.all(promises);
    const status = {};
    downloads.then(async downloads => {
        downloads.map(download => {
            status[download] = "downloaded"
        })
        await zip(downloadDirectory + `/${transactionID}`, `./zips/${transactionID}.zip`);
        db.set(transactionID, JSON.stringify(status));
    })
    return transactionID;
}

export const getStatus = (req, res, next) => {
    const transactionID = req.params.id;
    const transaction = JSON.parse(db.get(transactionID));
    return res.status(200).send(transaction)
}

export const getFilesForId = async (req, res, next) => {
    const transactionID = req.params.id;
    return res.status(200).json(`https://zoom.kshitizagrawal.in/${transactionID}.zip`)
}

async function axiosDownloadWrapper(url, filePath, fileName) {
    try {
        const request = await axios.get(url, {
            responseType: 'stream',
        });
        const response = await pipeline(request.data, fs.createWriteStream(filePath));
        return fileName
    } catch (error) {
        console.error('download pipeline failed', error);
    }
}

function dateHandler(zFormat) {
    // 2022-01-08T03:55:18Z  -> 2022-01-08-9_25_18
    let date = new Date(zFormat)
    let onlyDate = date.getDate().toString()
    if (onlyDate.length < 2) {
        onlyDate = '0' + onlyDate
    }

    let month = (date.getMonth() + 1).toString()
    if (month.length < 2) {
        month = '0' + month
    }

    let year = date.getFullYear()

    const timeHandler = (time) => {
        let hour = time.slice(0, 2)
        let min = time.slice(3, 5)
        let sec = time.slice(6, 8)
        return `${hour}_${min}_${sec}`
    }
    let time = date.toTimeString()
    time = timeHandler(time)

    date = onlyDate + '-' + month + '-' + year + '-' + time
    return date
}

export default download