const fs = require('fs')
const path = require('path')

const DOWNLOADS_DIRECTORY = "./downloads"
const ZIPS_DIRECTORY = "./zips";

const NOW = new Date();

dirItemsRemove(DOWNLOADS_DIRECTORY);
dirItemsRemove(ZIPS_DIRECTORY)

function dirItemsRemove(DIRECTORY_PATH) {
    const DIRECTORY = fs.readdirSync(DIRECTORY_PATH);
    DIRECTORY.map(file => {
        const filePath = path.join(DIRECTORY_PATH, file)

        const stats = fs.statSync(filePath)
        const createdAt = stats.ctime;

        if (NOW.getTime() - createdAt.getTime() > 15 * 24 * 60 * 60 * 1000) {
            fs.rmSync(filePath, { recursive: true, force: true });
        }
    })
}