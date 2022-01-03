// Bring in environment secrets through dotenv
require('dotenv/config')
let fs = require('fs')

// Use the request module to make HTTP requests from Node
const request = require('request')

// Run the express app
const express = require('express')
const app = express()


app.get('/', (req, res) => {

    // Step 1: 
    // Check if the code parameter is in the url 
    // if an authorization code is available, the user has most likely been redirected from Zoom OAuth
    // if not, the user needs to be redirected to Zoom OAuth to authorize


    if (req.query.code) {

        // Step 3: 
        // Request an access token using the auth code

        let url = 'https://zoom.us/oauth/token?grant_type=authorization_code&code=' + req.query.code + '&redirect_uri=' + process.env.redirectURL;

        request.post(url, (error, response, body) => {

            // Parse response to JSON
            body = JSON.parse(body);

            // Logs your access and refresh tokens in the browser
            console.log(`access_token: ${body.access_token}`);
            console.log(`refresh_token: ${body.refresh_token}`);
            let access_token = body.access_token

            if (body.access_token) {

                // Step 4:
                // We can now use the access token to authenticate API calls

                // Send a request to get your user information using the /me context
                // The `/me` context restricts an API call to the user the token belongs to
                // This helps make calls to user-specific endpoints instead of storing the userID

                // The maximum data that can be retrieved is from T = T-30 days
                request.get({ url: 'https://api.zoom.us/v2/users/gaurav.s@dreamsoft4u.com/recordings', qs: { from: "2021-11-15" } }, (error, response, body) => {
                    if (error) {
                        console.log('API Response Error: ', error)
                    } else {
                        body = JSON.parse(body);
                        const downloadFiles = async (data) => {
                            const meetings = data["meetings"]
                            let downloadStatus = {}
                            for (const meeting of meetings) {
                                for (const file of meeting.recording_files) {
                                    let fileURL = `${file.download_url}?access_token=${access_token}`
                                    let fileName = `${meeting.topic}.${file.file_extension}`
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
                        downloadFiles(body)

                        // fs.writeFileSync('./data.json', body)
                        // Display response in console
                        console.log('API call ', body);
                        // Display response in browser
                        var JSONResponse = '<pre><code>' + JSON.stringify(body, null, 2) + '</code></pre>'
                        res.send(`
                        <style>@import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap');@import url('https://necolas.github.io/normalize.css/8.0.1/normalize.css');html{color:#232333;font-family:'Open Sans',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}.response{margin:32px 0;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between}.response>a{text-decoration:none;color:#2d8cff;font-size:14px}.response>pre{overflow-x:scroll;background:#f6f7f9;padding:1.2em 1.4em;border-radius:10.56px;width:100%;box-sizing:border-box}</style>
                                <div class="response">
                                    <h4>JSON Response:</h4>
                                    <a href="https://marketplace.zoom.us/docs/api-reference/zoom-api/users/user" target="_blank">
                                        API Reference
                                    </a>
                                    ${JSONResponse}
                                </div>
                            </div>
                        `);
                    }
                }).auth(null, null, true, body.access_token);

            } else {
                // Handle errors, something's gone wrong!
            }

        }).auth(process.env.clientID, process.env.clientSecret);

        return;

    }

    // Step 2: 
    // If no authorization code is available, redirect to Zoom OAuth to authorize
    res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + process.env.redirectURL)
})

app.listen(4000, () => console.log(`Zoom Hello World app listening at PORT: 4000`))