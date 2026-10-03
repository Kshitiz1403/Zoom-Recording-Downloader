import * as dotenv from 'dotenv'
dotenv.config()
import { uploadToS3, generatePresignedURL } from './upload-to-s3.js'
import fs from 'fs'

const TEST_FILE = './test-s3-upload.txt'
const TEST_CONTENT = 'Hello from Zoom Recording Downloader - S3 connectivity test'

fs.writeFileSync(TEST_FILE, TEST_CONTENT)

console.log('Uploading test file...')
await uploadToS3(TEST_FILE, 'test-connectivity')
console.log('Upload successful!')

console.log('Generating presigned URL...')
const url = await generatePresignedURL('test-connectivity', 1)
console.log('Presigned URL:', url)

console.log('Downloading via presigned URL...')
const res = await fetch(url)
const body = await res.text()
if (res.ok && body === TEST_CONTENT) {
    console.log('Presigned URL works!')
} else {
    console.error(`Presigned URL failed: ${res.status} ${body}`)
    process.exitCode = 1
}

fs.rmSync(TEST_FILE)
