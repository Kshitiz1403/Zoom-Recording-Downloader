import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import { GetObjectCommand, S3 } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs'


const clientConfig = {
 forcePathStyle: true, // MinIO serves buckets as host/bucket/key, not bucket.host/key.
 region: process.env.S3_REGION || "us-east-1",
 credentials: {
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY
 }
}

// Uploads go straight to MinIO, but emailed links must use the public hostname. The Host header
// is part of the signature, so the URL has to be signed against the public endpoint from the start.
const s3Client = new S3({ ...clientConfig, endpoint: process.env.S3_ENDPOINT })
const presignClient = new S3({ ...clientConfig, endpoint: process.env.S3_PUBLIC_ENDPOINT || process.env.S3_ENDPOINT })

const BUCKET_NAME = process.env.S3_BUCKET


const uploadToS3 = async (filePath, transactionID) => {
 const resp = await s3Client.putObject({
  Bucket: BUCKET_NAME,
  Key: `${transactionID}.zip`,
  Body: fs.createReadStream(filePath)
 })

 return resp
}

const generatePresignedURL = async (transactionID, expirationDays) => {

 const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: `${transactionID}.zip` })
 const url = await getSignedUrl(presignClient, command, { expiresIn: expirationDays * 24 * 60 * 60 })

 return url
}


export {
 uploadToS3,
 generatePresignedURL
}
