import * as dotenv from 'dotenv'
dotenv.config()
import { uploadToAzure, generatePresignedURL } from './upload-to-azure.js'
import fs from 'fs'

const TEST_FILE = './test-azure-upload.txt'

fs.writeFileSync(TEST_FILE, 'Hello from Zoom Recording Downloader - Azure connectivity test')

console.log('Uploading test file...')
await uploadToAzure(TEST_FILE, 'test-connectivity')
console.log('Upload successful!')

console.log('Generating presigned URL...')
const url = await generatePresignedURL('test-connectivity', 1)
console.log('Presigned URL:', url)

fs.rmSync(TEST_FILE)
