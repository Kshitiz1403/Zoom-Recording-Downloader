import axios from "axios";
import { redirect_URL } from "./server.js"


export const getToken = async (req, res, next) => {

  // Step 1: 
  // Check if the code parameter is in the url 
  // if an authorization code is available, the user has most likely been redirected from Zoom OAuth
  // if not, the user needs to be redirected to Zoom OAuth to authorize

  if (!req.query.code) {
    // Step 2: 
    // If no authorization code is available, redirect to Zoom OAuth to authorize
    res.redirect('https://zoom.us/oauth/authorize?response_type=code&client_id=' + process.env.clientID + '&redirect_uri=' + redirect_URL)
    return;
  }

  // Step 3:
  // Request an access token using the auth code

  let url = 'https://zoom.us/oauth/token?grant_type=authorization_code&code=' + req.query.code + '&redirect_uri=' + redirect_URL;


  const data = await axios.post(url, null, { auth: { "username": process.env.clientID, "password": process.env.clientSecret } }).then(data => data.data)

  const access_token = data.access_token
  const refresh_token = data.refresh_token

  // if (!access_token) { }


  return res.send(`<label for="accounts">Choose an account:</label>
    <select id="accounts" form="form">
      <option value="sanjeev@dreamsoft4u.com">sanjeev@dreamsoft4u.com</option>
      <option value="careers@dreamsoft4u.com">careers@dreamsoft4u.com</option>
      <option value="gaurav.s@dreamsoft4u.com">gaurav.s@dreamsoft4u.com</option>
    </select>
    <form id="form" >
         <button type="submit">Submit</button>
    </form>
    <script>
      const form = document.getElementById("form");
    
    form.addEventListener("submit", formSubmit);
    
    function formSubmit(e) {
      e.preventDefault()
      const select = document.getElementById("accounts")
      const account = select.value
      console.log(account)
      console.log("${access_token}")
    
      fetch("/download",{
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            account,
            access_token:"${access_token}"
        }),
      })
      .then(response => response.json()).then(transactionId => {
        window.location.href= ("https://zoom.kshitizagrawal.in/status/" + transactionId)}
        )
      .catch(error => console.error(error))
    }
    </script>
    <footer style="position:absolute; bottom:0;">
    <a href="https://github.com/Kshitiz1403"> Kshitiz Agrawal</a> 
    </footer>`)

}