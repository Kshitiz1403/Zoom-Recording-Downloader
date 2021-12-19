const csv = require('csv-parser')
const fs = require('fs')
const results = []
let recordingsDir = './recordings'
let csvPath = './meetingDetails/zoomus_recordings.csv'

fs.createReadStream(csvPath)
    .pipe(csv({}))
    .on('data', (data) => { results.push(data) })
    .on('end', () => {
        issuesIdentifier()
        rename()
    })

const issuesIdentifier = () => {
    results.forEach(item => {
        if (!item.hasOwnProperty('Last Accessed')) {
            console.log('\x1b[33m%s\x1b[0m', `There might be error renaming- "${item['﻿Topic']}"`)
        }
    })
}
const rename = () => {
    const meetTimeHandler = (fileTime, fileName) => {
        results.forEach(item => {
            let startTime = item['Start Time']
            startTime = new Date(startTime).toUTCString()
            startTimeWithoutSecond = startTime.slice(0, 22)

            if (fileTime == startTimeWithoutSecond) {
                let title = item['﻿Topic']
                let extension = fileName.match(/\.[0-9a-z]+$/i)[0]
                let dateTime = fileName.slice(0, 11)
                fs.rename(`${recordingsDir}/${fileName}`, `${recordingsDir}/${title}_${dateTime}${extension}`, (err) => { })
            }
        });
    }

    fs.readdir(recordingsDir, (err, files) => {
        files.forEach(file => {
            fileTime = fileNameTimeHandler(file)
            meetTimeHandler(fileTime, file)
        });
        console.log('\x1b[32m%s\x1b[0m', `Rename Successful!`)
    });
}


const fileNameTimeHandler = (fileName) => {
    let year = fileName.slice(3, 7)
    let month = fileName.slice(7, 9)
    let day = fileName.slice(9, 11)
    let hour = fileName.slice(12, 14)
    let minute = fileName.slice(14, 16)
    let second = fileName.slice(16, 18)

    let someDate = new Date(year, month - 1, day, hour, minute, second)
    // here month is 0 indexed

    someDate.setMinutes(someDate.getMinutes() + 330)
    let someDateWithoutSeconds = someDate.toUTCString().slice(0, 22)
    return someDateWithoutSeconds
}
