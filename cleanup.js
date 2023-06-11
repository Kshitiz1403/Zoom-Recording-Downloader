const fs = require('fs')
const path = require('path')

const DOWNLOADS_DIRECTORY = "./downloads"
const ZIPS_DIRECTORY = "./zips";

const NOW = new Date();
const DOWNLOADS = fs.readdirSync(DOWNLOADS_DIRECTORY)
const ZIPS = fs.readdirSync(ZIPS_DIRECTORY)

dirItemsRemove(DOWNLOADS, DOWNLOADS_DIRECTORY);
dirItemsRemove(ZIPS, ZIPS_DIRECTORY)

function dirItemsRemove(DIRECTORY, DIRECTORY_PATH) {
    DIRECTORY.map(file => {
        const filePath = path.join(DIRECTORY_PATH, file)

        const stats = fs.statSync(filePath)
        const createdAt = stats.ctime;

        if (NOW.getTime() - createdAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
            fs.rmSync(filePath, { recursive: true, force: true });
        }
    })
}