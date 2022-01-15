# Zoom Recording Manager

Zoom only provides 1GB of space for cloud recordings on their base paid plan. This might be not sufficient for most users and they might want to download the recordings to their local machine. 

The user can either manually download those meetings from the Zoom's website or can use the developers API to access them.

The major problem with downloading files from the website is that it gets renamed to the Pacific time when the meeting was started for example `GMT20211218-040016_Recording_640x360.mp4`. This might be useful to some users but the most users would want the meetings to be renamed as the meeting topic.

If the user wants to access the Cloud Recordings via Zoom API, this is certainly difficult as Zoom uses OAuth 2.0 for authentication. 

The app allows you to download all the recordings from the last 30 days (limitations imposed by Zoom) or rename already download files to their respective meeting topics.


### Installation
To use Zoom Recording Manager, run:

    npm install

# To download Cloud Recordings using Zoom API

 1. Enable OAuth with Zoom
 2. Create an OAuth App

## Setup

### Run development server

    npm start

> A server at port 4000 will be created.

### Store Credentials

Create a `.env` file in the root directory.

Copy the following to the file and add values from the OAuth app
```
clientID=
clientSecret=
```

### Add credentials to the Zoom Marketplace 

Add the redirect URL from the terminal into the Redirect URL for OAuth field in the Zoom Marketplace App.

Add the same URL in the allow lists field in the Zoom App.

### Add Scopes

Add scopes according to the data that you may request from the API.

## Usage

Run `npm start`

After successful authorization, all the recordings from 30 days will start getting downloaded in the `downloads` folder in the root directory.

The name of the files will be of the format of `{meeting topic}-{time}.{extension}`

Console messages will be shown for  the remaining downloads.

### How this works
A tunnel will be created using the package [localtunnel](https://www.npmjs.com/package/localtunnel) with the specified subdomain pointing to the port 4000.

The tunnel URI will be used to recieve a response from the Zoom Client.


# To rename already downloaded cloud recording files 




## Usage

 Drop your Cloud Recordings CSV in the **meetingDetails** directory as `zoomus_recordings.csv` which can be downloaded from https://zoom.us/recording
 
 Drop the recordings  in the **recordings** directory.
 
 Execute script on the command line: 
	`node main.js`

The recordings will be renamed to their respective titles in the **recordings** directory.
## Limitations

Files containing `""` cannot be renamed to their respective titles due to the limitations of  [csv-parser](https://github.com/mafintosh/csv-parser/issues/70)