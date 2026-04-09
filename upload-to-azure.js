import * as dotenv from 'dotenv'
dotenv.config()
import { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob'
import fs from 'fs'

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME

const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
const blobServiceClient = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    sharedKeyCredential
)

const uploadToAzure = async (filePath, transactionID) => {
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(`${transactionID}.zip`)
    const fileStream = fs.createReadStream(filePath)
    const fileSize = fs.statSync(filePath).size
    const resp = await blockBlobClient.uploadStream(fileStream, fileSize)
    return resp
}

const generatePresignedURL = async (transactionID, expirationDays) => {
    const startsOn = new Date()
    const expiresOn = new Date(startsOn)
    expiresOn.setDate(expiresOn.getDate() + expirationDays)

    const sasToken = generateBlobSASQueryParameters(
        {
            containerName,
            blobName: `${transactionID}.zip`,
            permissions: BlobSASPermissions.parse('r'),
            startsOn,
            expiresOn,
        },
        sharedKeyCredential
    ).toString()

    const url = `https://${accountName}.blob.core.windows.net/${containerName}/${transactionID}.zip?${sasToken}`
    return url
}

export { uploadToAzure, generatePresignedURL }
