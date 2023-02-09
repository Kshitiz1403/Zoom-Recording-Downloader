import fs from 'fs'
import request from 'request';

export const download = async (req, res, next) => {
    const zoomAccount = req.query.account;
    if (!(zoomAccount == "careers@dreamsoft4u.com" || zoomAccount == "sanjeev@dreamsoft4u.com" || zoomAccount == "gaurav.s@dreamsoft4u.com")) {
        return res.status(400).json("Invalid account");
    }
    return res.status(200).json("Accepted")
}



export const downloadFiles = async (data, access_token) => {
    const meetings = data["meetings"]
    let downloadStatus = {}
    for (const meeting of meetings) {
        for (const file of meeting.recording_files) {
            let fileURL = `${file.download_url}?access_token=${access_token}`
            let fileDate = dateHandler(meeting.start_time)
            let fileName = `${meeting.topic} ${fileDate}.${file.file_extension}`
            downloadStatus = { ...downloadStatus, [fileName]: false }
            let directory = "./downloads"
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory)
            }
            request.get(fileURL)
                .on('error', (err) => console.log(err))
                // File has been downloaded and closed
                .on('close', () => {
                    downloadStatus[fileName] = true
                    console.log(downloadStatus)
                })
                .pipe(fs.createWriteStream(`${directory}/${fileName}`))
        }
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